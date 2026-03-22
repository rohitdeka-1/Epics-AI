const durationInput = document.getElementById("durationInput");
const startBtn = document.getElementById("startBtn");
const statusText = document.getElementById("statusText");
const remainingText = document.getElementById("remainingText");
const capturesText = document.getElementById("capturesText");
const errorText = document.getElementById("errorText");
const systemPasswordInput = document.getElementById("systemPassword");
const shutdownBtn = document.getElementById("shutdownBtn");
const rebootBtn = document.getElementById("rebootBtn");

function isValidDuration(value) {
  return Number.isInteger(value) && value >= 10 && value % 10 === 0;
}

function renderStatus(status) {
  statusText.textContent = status.statusText;
  remainingText.textContent = `Remaining: ${status.remainingSeconds}s`;
  capturesText.textContent = `Captured: ${status.captures}`;
  startBtn.disabled = Boolean(status.running);

  if (status.running) {
    startBtn.textContent = "Capture Running...";
  } else {
    startBtn.textContent = "Start Capture";
  }

  if (status.lastError) {
    errorText.textContent = status.lastError;
  } else {
    errorText.textContent = "";
  }
}

async function fetchStatus() {
  const response = await fetch("/api/status");
  if (!response.ok) {
    throw new Error("Unable to fetch status");
  }
  const status = await response.json();
  renderStatus(status);
}

async function startCapture() {
  const duration = Number(durationInput.value);

  if (!isValidDuration(duration)) {
    errorText.textContent = "Enter 10 or higher in multiples of 10.";
    return;
  }

  errorText.textContent = "";
  startBtn.disabled = true;

  const response = await fetch("/api/capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ duration }),
  });

  const payload = await response.json();

  if (!response.ok) {
    startBtn.disabled = false;
    errorText.textContent = payload.message || "Failed to start capture.";
    if (payload.status) {
      renderStatus(payload.status);
    }
    return;
  }

  renderStatus(payload.status);
}

async function requestSystemAction(action) {
  const password = systemPasswordInput.value;

  if (!password) {
    errorText.textContent = "Enter the system password first.";
    return;
  }

  shutdownBtn.disabled = true;
  rebootBtn.disabled = true;
  errorText.textContent = "";

  const response = await fetch("/api/system", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, password }),
  });

  const payload = await response.json();

  if (!response.ok) {
    errorText.textContent = payload.message || "System action failed.";
    shutdownBtn.disabled = false;
    rebootBtn.disabled = false;
    return;
  }

  statusText.textContent = payload.message;
  remainingText.textContent = "Remaining: -";
  capturesText.textContent = "Captured: -";
}

startBtn.addEventListener("click", () => {
  startCapture().catch((err) => {
    errorText.textContent = err.message;
    startBtn.disabled = false;
  });
});

shutdownBtn.addEventListener("click", () => {
  requestSystemAction("shutdown").catch((err) => {
    errorText.textContent = err.message;
    shutdownBtn.disabled = false;
    rebootBtn.disabled = false;
  });
});

rebootBtn.addEventListener("click", () => {
  requestSystemAction("reboot").catch((err) => {
    errorText.textContent = err.message;
    shutdownBtn.disabled = false;
    rebootBtn.disabled = false;
  });
});

setInterval(() => {
  fetchStatus().catch((err) => {
    errorText.textContent = err.message;
  });
}, 1000);

fetchStatus().catch((err) => {
  errorText.textContent = err.message;
});
