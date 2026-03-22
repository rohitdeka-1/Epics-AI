import express from "express";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const CAPTURE_SCRIPT = path.join(__dirname, "capture.py");
const IMAGES_DIR = path.join(__dirname, "Images");
const PYTHON_BIN = process.env.PYTHON_BIN || (process.platform === "win32" ? "python" : "python3");
const UI_ADMIN_PASSWORD = process.env.UI_ADMIN_PASSWORD || "rhdpi@rhdpi";

let state = {
	running: false,
	durationSeconds: 0,
	startedAt: null,
	endsAt: null,
	captures: 0,
	lastError: null,
};

if (!fs.existsSync(IMAGES_DIR)) {
	fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

function isValidDuration(value) {
	return Number.isInteger(value) && value >= 10 && value % 10 === 0;
}

function getRemainingSeconds() {
	if (!state.running || !state.endsAt) {
		return 0;
	}

	const remainingMs = state.endsAt - Date.now();
	return Math.max(0, Math.ceil(remainingMs / 1000));
}

function createStatusPayload() {
	return {
		running: state.running,
		durationSeconds: state.durationSeconds,
		remainingSeconds: getRemainingSeconds(),
		captures: state.captures,
		startedAt: state.startedAt,
		endsAt: state.endsAt,
		readyForNextCapture: !state.running,
		statusText: state.running ? "Capturing..." : "Ready for next capture",
		lastError: state.lastError,
	};
}

function getLocalIPv4Addresses() {
	const interfaces = os.networkInterfaces();
	const ipList = [];

	Object.values(interfaces).forEach((items) => {
		(items || []).forEach((item) => {
			if (item && item.family === "IPv4" && !item.internal) {
				ipList.push(item.address);
			}
		});
	});

	return [...new Set(ipList)];
}

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/capture", (req, res) => {
	const duration = Number(req.body?.duration);

	if (!isValidDuration(duration)) {
		return res.status(400).json({
			message: "Duration must be 10 or greater, and in multiples of 10.",
		});
	}

	if (state.running) {
		return res.status(409).json({
			message: "Capture is already running.",
			status: createStatusPayload(),
		});
	}

	const pythonProcess = spawn(
		PYTHON_BIN,
		[CAPTURE_SCRIPT, String(duration), IMAGES_DIR, "--interval", "2"],
		{ cwd: __dirname }
	);

	state = {
		running: true,
		durationSeconds: duration,
		startedAt: Date.now(),
		endsAt: Date.now() + duration * 1000,
		captures: 0,
		lastError: null,
	};

	pythonProcess.stdout.on("data", (chunk) => {
		const text = chunk.toString();
		process.stdout.write(text);

		const capturedMatches = text.match(/CAPTURED/g);
		if (capturedMatches) {
			state.captures += capturedMatches.length;
		}
	});

	pythonProcess.stderr.on("data", (chunk) => {
		const text = chunk.toString();
		process.stderr.write(text);
	});

	pythonProcess.on("error", (err) => {
		state.running = false;
		state.endsAt = Date.now();
		state.lastError = `Failed to start capture process: ${err.message}`;
	});

	pythonProcess.on("close", (code) => {
		state.running = false;
		state.endsAt = Date.now();

		if (code !== 0) {
			state.lastError = `Capture process exited with code ${code}`;
		}
	});

	return res.status(202).json({
		message: "Capture started.",
		status: createStatusPayload(),
	});
});

function runPrivilegedAction(action, password) {
	let args;

	if (action === "shutdown") {
		args = ["-S", "-k", "/sbin/shutdown", "-h", "now"];
	} else if (action === "reboot") {
		args = ["-S", "-k", "/sbin/shutdown", "-r", "now"];
	} else {
		throw new Error("Invalid action");
	}

	const proc = spawn("sudo", args, { stdio: ["pipe", "ignore", "pipe"] });
	proc.stdin.write(`${password}\n`);
	proc.stdin.end();

	proc.stderr.on("data", (chunk) => {
		process.stderr.write(chunk.toString());
	});

	proc.on("error", (err) => {
		console.error(`Failed to execute ${action}:`, err.message);
	});
}

app.post("/api/system", (req, res) => {
	const action = req.body?.action;
	const password = String(req.body?.password || "");

	if (!password || password !== UI_ADMIN_PASSWORD) {
		return res.status(401).json({ message: "Invalid password." });
	}

	if (action !== "shutdown" && action !== "reboot") {
		return res.status(400).json({ message: "Invalid action." });
	}

	res.status(202).json({
		message: `${action === "shutdown" ? "Shutdown" : "Reboot"} requested. Device will go offline shortly.`,
	});

	setTimeout(() => {
		runPrivilegedAction(action, password);
	}, 1000);
});

app.get("/api/status", (req, res) => {
	res.json(createStatusPayload());
});

app.listen(PORT, HOST, () => {
	console.log(`Capture server running at http://${HOST}:${PORT}`);
	console.log(`Using Python binary: ${PYTHON_BIN}`);
	console.log(`Serving UI from ${path.join(__dirname, "public")}`);
	console.log(`Saving captures to ${IMAGES_DIR}`);

	const ips = getLocalIPv4Addresses();
	if (ips.length > 0) {
		ips.forEach((ip) => {
			console.log(`Phone UI URL: http://${ip}:${PORT}`);
		});
	}
});
