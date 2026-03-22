import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const outputDir = path.join(process.cwd(), "Images");
const stateFile = path.join(process.cwd(), ".download-state.json");
const pollIntervalMs = Number(process.env.POLL_INTERVAL_MS || 10000);
const maxResults = Number(process.env.MAX_RESULTS_PER_POLL || 50);
const sourceFolder = (process.env.CLOUDINARY_SOURCE_FOLDER || "EPICS").trim();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function ensureOutputDir() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

function loadState() {
  if (!fs.existsSync(stateFile)) {
    return { downloadedPublicIds: [] };
  }

  try {
    const raw = fs.readFileSync(stateFile, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.downloadedPublicIds)) {
      return { downloadedPublicIds: [] };
    }
    return parsed;
  } catch {
    return { downloadedPublicIds: [] };
  }
}

function saveState(state) {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

function getExtension(resource) {
  if (resource.format) {
    return resource.format;
  }
  return "jpg";
}

function buildOutputPath(resource) {
  const safePublicId = resource.public_id.replace(/[\\/]/g, "_");
  const ext = getExtension(resource);
  return path.join(outputDir, `${safePublicId}.${ext}`);
}

async function downloadFile(url, destinationPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(destinationPath, buffer);
}

async function syncFromCloudinary() {
  const state = loadState();
  const downloadedSet = new Set(state.downloadedPublicIds);
  const folderPrefix = sourceFolder.endsWith("/") ? sourceFolder : `${sourceFolder}/`;

  const result = await cloudinary.api.resources({
    type: "upload",
    resource_type: "image",
    max_results: maxResults,
    direction: "desc",
    prefix: folderPrefix,
  });

  if (!Array.isArray(result.resources) || result.resources.length === 0) {
    console.log("No images found in Cloudinary.");
    return;
  }

  let newDownloads = 0;

  for (const resource of result.resources) {
    if (downloadedSet.has(resource.public_id)) {
      continue;
    }

    const destinationPath = buildOutputPath(resource);
    await downloadFile(resource.secure_url, destinationPath);

    downloadedSet.add(resource.public_id);
    state.downloadedPublicIds.push(resource.public_id);
    newDownloads += 1;

    console.log(`Downloaded ${resource.public_id} -> ${destinationPath}`);
  }

  if (newDownloads > 0) {
    saveState(state);
    console.log(`Sync complete. Downloaded ${newDownloads} new image(s).`);
  } else {
    console.log("Sync complete. No new images to download.");
  }
}

async function start() {
  ensureOutputDir();

  console.log("AI Model downloader started.");
  console.log(`Cloudinary source folder: ${sourceFolder}`);
  console.log(`Saving images to: ${outputDir}`);
  console.log(`Polling every ${pollIntervalMs} ms`);

  await syncFromCloudinary();

  setInterval(async () => {
    try {
      await syncFromCloudinary();
    } catch (error) {
      console.error("Sync error:", error.message);
    }
  }, pollIntervalMs);
}

start().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});
