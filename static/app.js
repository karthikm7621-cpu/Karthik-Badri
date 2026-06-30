(() => {
  const queue = window.OfflineQueue;
  const employees = [
    { id: 'EMP-101', name: 'Ari Chen' },
    { id: 'EMP-102', name: 'Mina Patel' },
    { id: 'EMP-103', name: 'Jules Ortiz' },
  ];

  // Auth UI removed

  // Admin UI
  const adminPanel = document.getElementById('admin-panel');
  const pendingUsersList = document.getElementById('pending-users-list');
  const delegationContainer = document.getElementById('delegation-container');
  const delegateForm = document.getElementById('delegate-form');
  const delegateUserSelect = document.getElementById('delegate-user-select');
  const delegateFeedback = document.getElementById('delegate-feedback');

  // Resume Upload UI
  const resumeForm = document.getElementById('resume-form');
  const resumeUploadInput = document.getElementById('resume-upload');
  const resumeSpinner = document.getElementById('resume-spinner');
  const resumeFeedback = document.getElementById('resume-feedback');

  // Dashboard UI
  const connectionStatus = document.getElementById('connection-status');
  const employeeList = document.getElementById('employee-list');
  const queueCount = document.getElementById('queue-count');

  const attendanceForm = document.getElementById('attendance-form');
  const leaveForm = document.getElementById('leave-form');
  const attendanceFeedback = document.getElementById('attendance-feedback');
  const leaveFeedback = document.getElementById('leave-feedback');
  const attendanceEmployee = document.getElementById('attendance-employee');
  const leaveEmployee = document.getElementById('leave-employee');
  const attendanceDate = document.getElementById('attendance-date');
  const receiptEmployee = document.getElementById('receipt-employee');
  const receiptFileInput = document.getElementById('receipt-file-input');
  const receiptPreview = document.getElementById('receipt-preview');
  const submitExpenseBtn = document.getElementById('submit-expense-btn');
  const receiptFeedback = document.getElementById('receipt-feedback');

  // Biometric UI
  const startBiometricBtn = document.getElementById('start-biometric-btn');
  const biometricContainer = document.getElementById('biometric-container');
  const webcamVideo = document.getElementById('webcam');
  const captureBiometricBtn = document.getElementById('capture-biometric-btn');
  const biometricCanvas = document.getElementById('biometric-canvas');
  let webcamStream = null;

  // HR Helpdesk UI
  const hrForm = document.getElementById('hr-form');
  const hrFeedback = document.getElementById('hr-feedback');
  const hrEmployee = document.getElementById('hr-employee');
  const hrRequest = document.getElementById('hr-request');

  // Policy chat UI
  const policyChatForm = document.getElementById('policy-chat-form');
  const policyChatInput = document.getElementById('policy-chat-input');
  const policyChatHistory = document.getElementById('policy-chat-history');

  // Audio UI
  let mediaRecorder = null;
  let audioChunks = [];
  let currentAudioBlob = null;
  const recordBtn = document.getElementById('record-btn');
  const recordingIndicator = document.getElementById('recording-indicator');
  const audioPlayback = document.getElementById('audio-playback');
  const submitAudioBtn = document.getElementById('submit-audio-btn');

  // State
  let currentUserRole = null;
  let currentUsername = null;
  let currentReceiptBlob = null;
  let currentReceiptPreviewUrl = null;

  function setFeedback(element, message, type) {
    element.className = `feedback ${type}`;
    element.textContent = message;
  }

  function appendPolicyMessage(text, role) {
    const bubble = document.createElement('div');
    bubble.className = `policy-message ${role}`;
    bubble.textContent = text;
    policyChatHistory.appendChild(bubble);
    policyChatHistory.scrollTop = policyChatHistory.scrollHeight;
  }

  function updateConnectivity() {
    const online = navigator.onLine;
    connectionStatus.className = `hero__status ${online ? 'online' : 'offline'}`;
    connectionStatus.textContent = online
      ? 'Online and ready to sync.'
      : 'Offline mode active — changes will be queued locally.';

    if (startBiometricBtn) {
      if (online) {
        startBiometricBtn.disabled = false;
        startBiometricBtn.title = '';
      } else {
        startBiometricBtn.disabled = true;
        startBiometricBtn.title =
          'Biometric attendance logging requires a connection to the local authentication server.';
      }
    }
  }

  function renderEmployees() {
    const employeeMarkup = employees
      .map((employee) => `<li><strong>${employee.name}</strong><span>${employee.id}</span></li>`)
      .join('');
    const employeeOptions = employees
      .map(
        (employee) => `<option value="${employee.id}">${employee.name} (${employee.id})</option>`
      )
      .join('');

    employeeList.innerHTML = employeeMarkup;
    attendanceEmployee.innerHTML = employeeOptions;
    leaveEmployee.innerHTML = employeeOptions;
    receiptEmployee.innerHTML = employeeOptions;
    hrEmployee.innerHTML = employeeOptions;
    delegateUserSelect.innerHTML = employeeOptions;
    attendanceDate.value = new Date().toISOString().slice(0, 10);
  }

  async function updateQueueCount() {
    if (!queue || typeof queue.getQueueCount !== 'function') {
      queueCount.textContent = 'Queue: 0';
      return;
    }

    const count = await queue.getQueueCount();
    queueCount.textContent = `Queue: ${count}`;
  }

  async function sendPayload(endpoint, payload) {
    const response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Request failed');
    }

    return response.json();
  }

  // Auth Logic
  function checkAuth() {
    currentUsername = 'Anonymous';
    currentUserRole = 'Main Owner';
    showDashboard();
  }

  function showDashboard() {
    const dashboardView = document.getElementById('dashboard-view');
    if (dashboardView) {
      dashboardView.classList.remove('hidden');
    }

    renderEmployees();

    if (currentUserRole === 'Main Owner' || currentUserRole === 'Delegated Owner') {
      adminPanel.classList.remove('hidden');
      void loadAdminData();

      if (currentUserRole === 'Main Owner') {
        delegationContainer.classList.remove('hidden');
      } else {
        delegationContainer.classList.add('hidden');
      }
    } else {
      adminPanel.classList.add('hidden');
    }
  }

  // Auth Logic Removed

  // Admin Logic
  async function loadAdminData() {
    if (!navigator.onLine) {
      return;
    }

    try {
      const res = await fetch('/api/pending-users');
      if (!res.ok) {
        throw new Error('Failed to fetch pending users');
      }
      const payload = await res.json();
      const users = Array.isArray(payload.users) ? payload.users : payload;

      if (users.length === 0) {
        pendingUsersList.innerHTML = `<li style="justify-content: center; color: var(--muted);">No pending users</li>`;
      } else {
        pendingUsersList.innerHTML = users
          .map(
            (u) => `
          <li>
            <strong>${u.username}</strong>
            <span>${u.stream}</span>
            <button class="approve-btn secondary-btn" data-id="${u.id}" style="width: auto; padding: 0.4rem 0.8rem; border-radius: 8px;">Approve</button>
          </li>
        `
          )
          .join('');

        document.querySelectorAll('.approve-btn').forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            const userId = e.target.getAttribute('data-id');
            try {
              await sendPayload('approve-user', { user_id: userId });
              e.target.textContent = 'Approved';
              e.target.disabled = true;
            } catch (err) {
              console.warn('Failed to approve user', err);
            }
          });
        });
      }
    } catch (err) {
      console.warn('Could not load pending users', err);
    }
  }

  async function handleDelegation(event) {
    event.preventDefault();
    if (!navigator.onLine) {
      setFeedback(delegateFeedback, 'Requires network connection.', 'info');
      return;
    }

    const targetUserId = delegateUserSelect.value;
    try {
      await sendPayload('delegate-owner', { user_id: targetUserId });
      setFeedback(delegateFeedback, 'Delegation successful.', 'success');
      delegateForm.reset();
    } catch (err) {
      setFeedback(delegateFeedback, 'Delegation failed.', 'info');
      console.warn(err);
    }
  }

  // Dashboard logic
  async function handleAttendanceSubmission(event) {
    event.preventDefault();
    const payload = {
      employee: attendanceEmployee.value,
      date: attendanceDate.value,
      notes: document.getElementById('attendance-notes').value.trim(),
    };

    try {
      if (!navigator.onLine) {
        throw new Error('offline');
      }
      await sendPayload('sync-attendance', payload);
      setFeedback(attendanceFeedback, 'Attendance saved successfully.', 'success');
      attendanceForm.reset();
      attendanceDate.value = new Date().toISOString().slice(0, 10);
    } catch (error) {
      if (queue && typeof queue.addToQueue === 'function') {
        await queue.addToQueue('sync-attendance', payload);
      }
      setFeedback(
        attendanceFeedback,
        'Saved locally and will sync when you are back online.',
        'info'
      );
    }
    await updateQueueCount();
  }

  async function handleLeaveSubmission(event) {
    event.preventDefault();
    const payload = {
      employee: leaveEmployee.value,
      raw_text: document.getElementById('leave-request').value.trim(),
    };

    try {
      if (!navigator.onLine) {
        throw new Error('offline');
      }
      await sendPayload('submit-leave', payload);
      setFeedback(leaveFeedback, 'Leave request queued for review.', 'success');
      leaveForm.reset();
    } catch (error) {
      if (queue && typeof queue.addToQueue === 'function') {
        await queue.addToQueue('submit-leave', payload);
      }
      setFeedback(leaveFeedback, 'Leave request saved for later sync.', 'info');
    }
    await updateQueueCount();
  }

  async function handlePolicyChatSubmit(event) {
    event.preventDefault();
    const query = policyChatInput.value.trim();
    if (!query) {
      return;
    }

    appendPolicyMessage(query, 'user');
    policyChatInput.value = '';

    const payload = { query };

    try {
      if (!navigator.onLine) {
        throw new Error('offline');
      }
      const response = await fetch('/api/ask-policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Policy request failed');
      }

      const data = await response.json();
      appendPolicyMessage(data.answer || 'I cannot find the answer in the policy.', 'bot');
    } catch (error) {
      if (queue && typeof queue.addToQueue === 'function') {
        await queue.addToQueue('ask-policy', payload);
      }
      appendPolicyMessage(
        'You are offline. Your question has been saved and will be answered when the connection is restored.',
        'bot'
      );
    }
  }

  function revokeReceiptPreview() {
    if (currentReceiptPreviewUrl) {
      URL.revokeObjectURL(currentReceiptPreviewUrl);
      currentReceiptPreviewUrl = null;
    }
  }

  async function compressImageToBlob(file) {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    try {
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error('Image load failed'));
        image.src = imageUrl;
      });

      const maxWidth = 1024;
      const scale = Math.min(1, maxWidth / image.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return await new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob || file), 'image/jpeg', 0.9);
      });
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  async function handleReceiptSelection(event) {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    try {
      const blob = await compressImageToBlob(file);
      revokeReceiptPreview();
      currentReceiptBlob = blob;
      currentReceiptPreviewUrl = URL.createObjectURL(blob);
      receiptPreview.src = currentReceiptPreviewUrl;
      receiptPreview.classList.remove('hidden');
      setFeedback(receiptFeedback, 'Receipt ready. Submit when connected or offline.', 'info');
    } catch (error) {
      console.warn('Receipt preview failed', error);
      setFeedback(receiptFeedback, 'Could not prepare the receipt image.', 'info');
    }
  }

  async function handleExpenseSubmission() {
    if (!currentReceiptBlob) {
      setFeedback(receiptFeedback, 'Please capture a receipt first.', 'info');
      return;
    }

    const formData = new FormData();
    formData.append('employee_id', receiptEmployee.value);
    formData.append('receipt', currentReceiptBlob, 'receipt.jpg');

    try {
      if (!navigator.onLine) {
        throw new Error('offline');
      }
      const response = await fetch('/api/submit-receipt', { method: 'POST', body: formData });
      if (!response.ok) {
        throw new Error('Request failed');
      }
      setFeedback(receiptFeedback, 'Receipt submitted for processing.', 'success');
      revokeReceiptPreview();
      receiptPreview.classList.add('hidden');
      receiptFileInput.value = '';
      currentReceiptBlob = null;
    } catch (error) {
      if (queue && typeof queue.addToQueue === 'function') {
        await queue.addToQueue(
          'submit-receipt',
          { employee_id: receiptEmployee.value, receipt: currentReceiptBlob },
          true
        );
      }
      setFeedback(receiptFeedback, 'Receipt saved offline. Will process when connected.', 'info');
      revokeReceiptPreview();
      receiptPreview.classList.add('hidden');
      receiptFileInput.value = '';
      currentReceiptBlob = null;
    }
    await updateQueueCount();
  }

  async function handleResumeSubmission(event) {
    event.preventDefault();

    const [file] = resumeUploadInput.files || [];
    if (!file) {
      setFeedback(resumeFeedback, 'Please select a resume file to upload.', 'info');
      return;
    }

    // show spinner
    resumeSpinner.classList.remove('hidden');
    setFeedback(resumeFeedback, 'Processing resume...', 'info');

    const formData = new FormData();
    formData.append('resume', file, file.name);
    // include current username if available (server may require auth)
    const storedUser = localStorage.getItem('ems_username');
    if (storedUser) {
      formData.append('username', storedUser);
    }

    try {
      if (!navigator.onLine) {
        throw new Error('offline');
      }

      const response = await fetch('/api/upload-resume', { method: 'POST', body: formData });
      if (!response.ok) {
        throw new Error('Request failed');
      }

      setFeedback(resumeFeedback, 'Resume processed successfully.', 'success');
      resumeForm.reset();
    } catch (err) {
      // fallback: queue the FormData payload for later sync via IndexedDB
      try {
        if (queue && typeof queue.addToQueue === 'function') {
          // queue.addToQueue expects a serializable payload; pass file blob and metadata
          await queue.addToQueue(
            'upload-resume',
            { resume: file, username: localStorage.getItem('ems_username') },
            true
          );
          setFeedback(
            resumeFeedback,
            'Resume saved offline. Will be parsed by AI when connection is restored.',
            'info'
          );
          resumeForm.reset();
        } else {
          setFeedback(resumeFeedback, 'Unable to queue offline — no queue available.', 'info');
        }
      } catch (qerr) {
        console.warn('Failed to queue resume', qerr);
        setFeedback(resumeFeedback, 'Failed to process or queue resume.', 'info');
      }
    } finally {
      resumeSpinner.classList.add('hidden');
      await updateQueueCount();
    }
  }

  async function handleHRSubmission(event) {
    event.preventDefault();
    const payload = {
      employee_id: hrEmployee.value,
      raw_text: hrRequest.value.trim(),
    };

    try {
      if (!navigator.onLine) {
        throw new Error('offline');
      }
      await sendPayload('submit-hr-ticket', payload);
      setFeedback(hrFeedback, 'Ticket submitted successfully.', 'success');
      hrForm.reset();
    } catch (error) {
      if (queue && typeof queue.addToQueue === 'function') {
        await queue.addToQueue('submit-hr-ticket', payload);
      }
      setFeedback(
        hrFeedback,
        'Ticket saved offline. Will be submitted to HR when connected.',
        'info'
      );
      hrForm.reset();
    }
    await updateQueueCount();
  }

  // Biometric Logic
  async function startWebcam() {
    if (!navigator.onLine) {
      setFeedback(
        attendanceFeedback,
        'Biometric attendance logging requires a connection to the local authentication server.',
        'info'
      );
      return;
    }

    try {
      webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
      webcamVideo.srcObject = webcamStream;
      biometricContainer.classList.remove('hidden');
      startBiometricBtn.classList.add('hidden');
      setFeedback(attendanceFeedback, 'Please look into the camera.', 'info');
    } catch (err) {
      setFeedback(attendanceFeedback, 'Webcam access denied or unavailable.', 'info');
      console.warn('Webcam error:', err);
    }
  }

  function stopWebcam() {
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => track.stop());
      webcamStream = null;
    }
    webcamVideo.srcObject = null;
  }

  async function captureAndVerifyFace() {
    if (!webcamStream) {
      return;
    }

    const context = biometricCanvas.getContext('2d');
    biometricCanvas.width = webcamVideo.videoWidth;
    biometricCanvas.height = webcamVideo.videoHeight;
    context.drawImage(webcamVideo, 0, 0, biometricCanvas.width, biometricCanvas.height);

    stopWebcam();
    biometricContainer.classList.add('hidden');
    startBiometricBtn.classList.remove('hidden');

    setFeedback(attendanceFeedback, 'Verifying face...', 'info');

    biometricCanvas.toBlob(
      async (blob) => {
        if (!blob) {
          setFeedback(attendanceFeedback, 'Failed to capture image.', 'info');
          return;
        }

        const formData = new FormData();
        formData.append('employee_id', attendanceEmployee.value);
        formData.append('image', blob, 'face.jpg');

        try {
          if (!navigator.onLine) {
            throw new Error('offline');
          }
          const response = await fetch('/api/verify-attendance', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const resData = await response.json().catch(() => ({}));
            throw new Error(resData.error || 'Verification failed');
          }

          setFeedback(attendanceFeedback, 'Face Verified! Attendance Logged.', 'success');
          attendanceForm.reset();
          attendanceDate.value = new Date().toISOString().slice(0, 10);
        } catch (err) {
          setFeedback(
            attendanceFeedback,
            err.message === 'offline'
              ? 'Biometric attendance logging requires a connection to the local authentication server.'
              : `Verification failed: ${err.message}`,
            'info'
          );
        }
        await updateQueueCount();
      },
      'image/jpeg',
      0.9
    );
  }

  // Audio Logic
  async function initAudioRecorder() {
    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn('Media devices API not supported.');
      return;
    }

    recordBtn.addEventListener('mousedown', async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        });

        mediaRecorder.addEventListener('stop', () => {
          currentAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(currentAudioBlob);
          audioPlayback.src = audioUrl;
          audioPlayback.classList.remove('hidden');
          submitAudioBtn.classList.remove('hidden');
          stream.getTracks().forEach((track) => track.stop());
        });

        mediaRecorder.start();
        recordingIndicator.classList.remove('hidden');
      } catch (err) {
        setFeedback(leaveFeedback, 'Microphone access denied or error.', 'info');
        console.warn(err);
      }
    });

    recordBtn.addEventListener('mouseup', () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        recordingIndicator.classList.add('hidden');
      }
    });

    recordBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      recordBtn.dispatchEvent(new Event('mousedown'));
    });
    recordBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      recordBtn.dispatchEvent(new Event('mouseup'));
    });

    submitAudioBtn.addEventListener('click', async () => {
      if (!currentAudioBlob) {
        return;
      }
      const payload = { employee_id: leaveEmployee.value, audio: currentAudioBlob };

      try {
        if (!navigator.onLine) {
          throw new Error('offline');
        }
        const formData = new FormData();
        formData.append('employee_id', payload.employee_id);
        formData.append('audio', payload.audio, 'audio.webm');

        const response = await fetch('/api/submit-audio-leave', { method: 'POST', body: formData });
        if (!response.ok) {
          throw new Error('Request failed');
        }

        setFeedback(leaveFeedback, 'Voice note submitted for processing.', 'success');
        currentAudioBlob = null;
        audioPlayback.classList.add('hidden');
        submitAudioBtn.classList.add('hidden');
      } catch (error) {
        if (queue && typeof queue.addToQueue === 'function') {
          await queue.addToQueue('submit-audio-leave', payload, true);
        }
        setFeedback(leaveFeedback, 'Voice note saved for later sync.', 'info');
        currentAudioBlob = null;
        audioPlayback.classList.add('hidden');
        submitAudioBtn.classList.add('hidden');
      }
      await updateQueueCount();
    });
  }

  async function syncQueue() {
    if (!(navigator.onLine && queue) || typeof queue.processQueue !== 'function') {
      return;
    }
    const syncedItems = await queue.processQueue();
    if (syncedItems > 0) {
      await updateQueueCount();
    }
  }

  async function init() {
    updateConnectivity();
    await updateQueueCount();
    void initAudioRecorder();

    // Auth Event Listeners Removed

    delegateForm.addEventListener('submit', handleDelegation);
    attendanceForm.addEventListener('submit', handleAttendanceSubmission);
    if (startBiometricBtn) {
      startBiometricBtn.addEventListener('click', startWebcam);
    }
    if (captureBiometricBtn) {
      captureBiometricBtn.addEventListener('click', captureAndVerifyFace);
    }
    leaveForm.addEventListener('submit', handleLeaveSubmission);
    if (resumeForm) {
      resumeForm.addEventListener('submit', handleResumeSubmission);
    }
    receiptFileInput.addEventListener('change', handleReceiptSelection);
    submitExpenseBtn.addEventListener('click', handleExpenseSubmission);
    hrForm.addEventListener('submit', handleHRSubmission);
    policyChatForm.addEventListener('submit', handlePolicyChatSubmit);

    window.addEventListener('online', () => {
      updateConnectivity();
      void syncQueue();
    });
    window.addEventListener('offline', updateConnectivity);
    window.setInterval(() => {
      void syncQueue();
    }, 15000);

    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/static/service-worker.js');
      } catch (error) {
        console.warn('SW failed', error);
      }
    }

    checkAuth();
  }

  document.addEventListener('DOMContentLoaded', () => {
    void init();
  });
})();
