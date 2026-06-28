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

  async function init() {
    renderEmployees();
    updateConnectivity();
    await updateQueueCount();

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
