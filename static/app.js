const networkStatus = document.getElementById('network-status');
const attendanceForm = document.getElementById('attendance-form');
const attendanceStatus = document.getElementById('attendance-status');
const leaveForm = document.getElementById('leave-form');
const leaveStatus = document.getElementById('leave-status');

const API_BASE = '/api';

function updateNetworkStatus() {
  const online = navigator.onLine;
  networkStatus.textContent = online ? 'Online and ready to sync attendance data.' : 'Offline mode enabled — your UI remains available.';
  networkStatus.className = `status ${online ? 'success' : 'offline'}`;
}

function showStatus(element, message, type = 'success') {
  element.hidden = false;
  element.textContent = message;
  element.className = `status ${type}`;
  setTimeout(() => {
    element.hidden = true;
  }, 6000);
}

async function postPayload(endpoint, payload, isFormData = false) {
  try {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      body: isFormData ? payload : JSON.stringify(payload),
      headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Server rejected the request');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Network error');
  }
}

attendanceForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const employeeId = document.getElementById('employee-id').value.trim();
  const notes = document.getElementById('attendance-notes').value.trim();
  const fileInput = document.getElementById('timesheet-file');
  const file = fileInput.files[0];

  if (!employeeId || !file) {
    showStatus(attendanceStatus, 'Please provide your employee ID and timesheet image.', 'error');
    return;
  }

  const payload = new FormData();
  payload.append('employeeId', employeeId);
  payload.append('notes', notes);
  payload.append('timesheet', file);

  attendanceStatus.textContent = 'Uploading attendance...';
  attendanceStatus.hidden = false;
  attendanceStatus.className = 'status';

  try {
    const result = await postPayload('attendance', payload, true);
    showStatus(attendanceStatus, result.message || 'Attendance uploaded successfully.');
    attendanceForm.reset();
  } catch (error) {
    showStatus(attendanceStatus, `Unable to upload attendance: ${error.message}`, 'error');
  }
});

leaveForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const employeeId = document.getElementById('leave-employee-id').value.trim();
  const reason = document.getElementById('leave-reason').value.trim();

  if (!employeeId || !reason) {
    showStatus(leaveStatus, 'Employee ID and leave reason are required.', 'error');
    return;
  }

  leaveStatus.textContent = 'Sending leave request...';
  leaveStatus.hidden = false;
  leaveStatus.className = 'status';

  try {
    const result = await postPayload('leave', { employeeId, reason });
    showStatus(leaveStatus, result.message || 'Leave request sent successfully.');
    leaveForm.reset();
  } catch (error) {
    showStatus(leaveStatus, `Unable to submit leave request: ${error.message}`, 'error');
  }
});

window.addEventListener('online', updateNetworkStatus);
window.addEventListener('offline', updateNetworkStatus);
updateNetworkStatus();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('service-worker.js');
      console.log('Service worker registered:', registration.scope);
    } catch (error) {
      console.warn('Service worker registration failed:', error);
    }
  });
}
