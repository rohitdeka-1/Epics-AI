import express from "express";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const CAPTURE_SCRIPT = path.join(__dirname, "capture.py");
const IMAGES_DIR = path.join(__dirname, "Images");
const PYTHON_BIN = process.env.PYTHON_BIN || (process.platform === "win32" ? "python" : "python3");

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

app.get("/api/status", (req, res) => {
	res.json(createStatusPayload());
});

app.listen(PORT, HOST, () => {
	console.log(`Capture server running at http://${HOST}:${PORT}`);
	console.log(`Using Python binary: ${PYTHON_BIN}`);
	console.log(`Serving UI from ${path.join(__dirname, "public")}`);
	console.log(`Saving captures to ${IMAGES_DIR}`);
});
