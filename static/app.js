(function () {
  "use strict";

  const queue = window.OfflineQueue;
  const employees = [
    { id: "EMP-101", name: "Ari Chen" },
    { id: "EMP-102", name: "Mina Patel" },
    { id: "EMP-103", name: "Jules Ortiz" },
  ];

  const connectionStatus = document.getElementById("connection-status");
  const employeeList = document.getElementById("employee-list");
  const queueCount = document.getElementById("queue-count");
  const attendanceForm = document.getElementById("attendance-form");
  const leaveForm = document.getElementById("leave-form");
  const attendanceFeedback = document.getElementById("attendance-feedback");
  const leaveFeedback = document.getElementById("leave-feedback");
  const attendanceEmployee = document.getElementById("attendance-employee");
  const leaveEmployee = document.getElementById("leave-employee");
  const attendanceDate = document.getElementById("attendance-date");

  let mediaRecorder = null;
  let audioChunks = [];
  let currentAudioBlob = null;

  const recordBtn = document.getElementById("record-btn");
  const recordingIndicator = document.getElementById("recording-indicator");
  const audioPlayback = document.getElementById("audio-playback");
  const submitAudioBtn = document.getElementById("submit-audio-btn");

  function setFeedback(element, message, type) {
    element.className = `feedback ${type}`;
    element.textContent = message;
  }

  function updateConnectivity() {
    const online = navigator.onLine;
    connectionStatus.className = `hero__status ${online ? "online" : "offline"}`;
    connectionStatus.textContent = online ? "Online and ready to sync." : "Offline mode active — changes will be queued locally.";
  }

  function renderEmployees() {
    const employeeMarkup = employees
      .map((employee) => `<li><strong>${employee.name}</strong><span>${employee.id}</span></li>`)
      .join("");
    const employeeOptions = employees
      .map((employee) => `<option value="${employee.id}">${employee.name} (${employee.id})</option>`)
      .join("");

    employeeList.innerHTML = employeeMarkup;
    attendanceEmployee.innerHTML = employeeOptions;
    leaveEmployee.innerHTML = employeeOptions;
    attendanceDate.value = new Date().toISOString().slice(0, 10);
  }

  async function updateQueueCount() {
    if (!queue || typeof queue.getQueueCount !== "function") {
      queueCount.textContent = "Queue: 0";
      return;
    }

    const count = await queue.getQueueCount();
    queueCount.textContent = `Queue: ${count}`;
  }

  async function sendPayload(endpoint, payload) {
    const response = await fetch(`/api/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Request failed");
    }

    return response.json();
  }

  async function handleAttendanceSubmission(event) {
    event.preventDefault();

    const payload = {
      employee: attendanceEmployee.value,
      date: attendanceDate.value,
      notes: document.getElementById("attendance-notes").value.trim(),
    };

    try {
      if (!navigator.onLine) {
        throw new Error("offline");
      }

      await sendPayload("attendance", payload);
      setFeedback(attendanceFeedback, "Attendance saved successfully.", "success");
      attendanceForm.reset();
      attendanceDate.value = new Date().toISOString().slice(0, 10);
    } catch (error) {
      if (queue && typeof queue.addToQueue === "function") {
        await queue.addToQueue("attendance", payload);
      }
      setFeedback(attendanceFeedback, "Saved locally and will sync when you are back online.", "info");
    }

    await updateQueueCount();
  }

  async function handleLeaveSubmission(event) {
    event.preventDefault();

    const payload = {
      employee: leaveEmployee.value,
      request: document.getElementById("leave-request").value.trim(),
    };

    try {
      if (!navigator.onLine) {
        throw new Error("offline");
      }

      await sendPayload("leave", payload);
      setFeedback(leaveFeedback, "Leave request queued for review.", "success");
      leaveForm.reset();
    } catch (error) {
      if (queue && typeof queue.addToQueue === "function") {
        await queue.addToQueue("leave", payload);
      }
      setFeedback(leaveFeedback, "Leave request saved for later sync.", "info");
    }

    await updateQueueCount();
  }

  async function syncQueue() {
    if (!navigator.onLine || !queue || typeof queue.processQueue !== "function") {
      return;
    }

    const syncedItems = await queue.processQueue();
    if (syncedItems > 0) {
      await updateQueueCount();
    }
  }

  async function initAudioRecorder() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("Media devices API not supported.");
      return;
    }

    recordBtn.addEventListener("mousedown", async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.addEventListener("dataavailable", (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        });

        mediaRecorder.addEventListener("stop", () => {
          currentAudioBlob = new Blob(audioChunks, { type: "audio/webm" });
          const audioUrl = URL.createObjectURL(currentAudioBlob);
          audioPlayback.src = audioUrl;
          audioPlayback.classList.remove("hidden");
          submitAudioBtn.classList.remove("hidden");

          stream.getTracks().forEach((track) => track.stop());
        });

        mediaRecorder.start();
        recordingIndicator.classList.remove("hidden");
      } catch (err) {
        setFeedback(leaveFeedback, "Microphone access denied or error.", "info");
      }
    });

    recordBtn.addEventListener("mouseup", () => {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        recordingIndicator.classList.add("hidden");
      }
    });

    recordBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      recordBtn.dispatchEvent(new Event("mousedown"));
    });
    recordBtn.addEventListener("touchend", (e) => {
      e.preventDefault();
      recordBtn.dispatchEvent(new Event("mouseup"));
    });
  }

  submitAudioBtn.addEventListener("click", async () => {
    if (!currentAudioBlob) return;

    const payload = {
      employee_id: leaveEmployee.value,
      audio: currentAudioBlob,
    };

    try {
      if (!navigator.onLine) {
        throw new Error("offline");
      }

      const formData = new FormData();
      formData.append("employee_id", payload.employee_id);
      formData.append("audio", payload.audio, "audio.webm");

      const response = await fetch("/api/submit-audio-leave", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setFeedback(leaveFeedback, "Voice note submitted for processing.", "success");
      currentAudioBlob = null;
      audioPlayback.classList.add("hidden");
      submitAudioBtn.classList.add("hidden");
    } catch (error) {
      if (queue && typeof queue.addToQueue === "function") {
        await queue.addToQueue("submit-audio-leave", payload, true);
      }
      setFeedback(leaveFeedback, "Voice note saved for later sync.", "info");
      currentAudioBlob = null;
      audioPlayback.classList.add("hidden");
      submitAudioBtn.classList.add("hidden");
    }

    await updateQueueCount();
  });

  async function init() {
    renderEmployees();
    updateConnectivity();
    await updateQueueCount();
    void initAudioRecorder();

    attendanceForm.addEventListener("submit", handleAttendanceSubmission);
    leaveForm.addEventListener("submit", handleLeaveSubmission);
    window.addEventListener("online", () => {
      updateConnectivity();
      void syncQueue();
    });
    window.addEventListener("offline", updateConnectivity);
    window.setInterval(() => {
      void syncQueue();
    }, 15000);

    if ("serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.register("/static/service-worker.js");
      } catch (error) {
        console.warn("Service worker registration failed", error);
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    void init();
  });
})();
