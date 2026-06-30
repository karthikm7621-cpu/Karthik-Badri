(() => {
  const queue = window.OfflineQueue;
  let employees = [];

  async function fetchEmployees() {
    try {
      if (navigator.onLine) {
        const res = await fetch('/api/employees');
        if (res.ok) {
          const data = await res.json();
          employees = data.map((e) => ({ id: e.employee_id_string, name: e.full_name }));
          renderEmployees();
        }
      }
    } catch (_err) {}
  }

  async function fetchAnalytics() {
    try {
      if (navigator.onLine) {
        const res = await fetch('/api/analytics');
        if (res.ok) {
          const data = await res.json();
          document.getElementById('stat-employees').textContent = data.total_employees;
          document.getElementById('stat-leaves').textContent = data.pending_leaves;
          document.getElementById('stat-expenses').textContent = data.pending_expenses;
          document.getElementById('stat-tickets').textContent = data.open_tickets;
        }
      }
    } catch (_err) {}
  }

  // Admin UI
  const _adminPanel = document.getElementById('admin-panel');
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
  let _currentUsername = null;
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
    const headers = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('ems_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Request failed');
    }

    return response.json();
  }

  // View Switching Logic
  const navBtns = document.querySelectorAll('.nav-btn');
  const viewSections = document.querySelectorAll('.view-section');
  const pageTitle = document.getElementById('page-title');

  function switchView(targetId, titleText) {
    viewSections.forEach((sec) => {
      sec.classList.remove('active');
    });
    document.getElementById(targetId).classList.add('active');

    navBtns.forEach((btn) => {
      btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`.nav-btn[data-target="${targetId}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    if (pageTitle && titleText) {
      pageTitle.textContent = titleText;
    }
  }

  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const titleText = btn.querySelector('span').textContent;
      switchView(targetId, titleText);
    });
  });

  // Auth Logic
  function checkAuth() {
    _currentUsername = 'Anonymous';
    currentUserRole = 'Main Owner';
    showDashboard();
  }

  function showDashboard() {
    fetchEmployees().then(() => {
      // Employees fetched and rendered
    });
    fetchAnalytics();

    if (currentUserRole === 'Main Owner' || currentUserRole === 'Delegated Owner') {
      const navAdmin = document.getElementById('nav-admin');
      if (navAdmin) {
        navAdmin.classList.remove('hidden');
      }
      void loadAdminData();

      if (currentUserRole === 'Main Owner') {
        delegationContainer.classList.remove('hidden');
      } else {
        delegationContainer.classList.add('hidden');
      }
    } else {
      const navAdmin = document.getElementById('nav-admin');
      if (navAdmin) {
        navAdmin.classList.add('hidden');
      }
    }
  }

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

              // Instantly refresh the employee dropdowns and analytics across the site
              await fetchEmployees();
              await fetchAnalytics();
            } catch (_err) {}
          });
        });
      }
    } catch (_err) {}
  }

  // Join Team Logic
  const joinModal = document.getElementById('join-modal');
  const joinBtn = document.getElementById('join-team-btn');
  const joinCancelBtn = document.getElementById('join-cancel-btn');
  const joinForm = document.getElementById('join-form');
  const joinFeedback = document.getElementById('join-feedback');

  if (joinBtn) {
    joinBtn.addEventListener('click', () => {
      joinModal.classList.remove('hidden');
    });
  }
  if (joinCancelBtn) {
    joinCancelBtn.addEventListener('click', () => {
      joinModal.classList.add('hidden');
    });
  }

  if (joinForm) {
    joinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        username: document.getElementById('join-name').value.trim(),
        department: document.getElementById('join-department').value.trim(),
        role: document.getElementById('join-role').value,
      };
      try {
        const res = await fetch('/api/request-join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          joinFeedback.textContent = data.message;
          joinFeedback.className = 'feedback success';
          setTimeout(() => joinModal.classList.add('hidden'), 2000);
          joinForm.reset();
        } else {
          joinFeedback.textContent = data.message || 'Request failed';
          joinFeedback.className = 'feedback error';
        }
      } catch (_err) {
        joinFeedback.textContent = 'Network error. Try again.';
        joinFeedback.className = 'feedback error';
      }
    });
  }

  // Dashboard logic
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
    } catch (_err) {
      setFeedback(delegateFeedback, 'Delegation failed.', 'info');
    }
  }

  // Dashboard logic
  async function handleAttendanceSubmission(event) {
    event.preventDefault();
    const payload = {
      employee_id: attendanceEmployee.value,
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
    } catch (_error) {
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
    } catch (_error) {
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
    } catch (_error) {
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
    } catch (_error) {
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
      const token = localStorage.getItem('ems_token');
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/submit-receipt', {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Request failed');
      }
      setFeedback(receiptFeedback, 'Receipt submitted for processing.', 'success');
      revokeReceiptPreview();
      receiptPreview.classList.add('hidden');
      receiptFileInput.value = '';
      currentReceiptBlob = null;
    } catch (_error) {
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

      const token = localStorage.getItem('ems_token');
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        headers,
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Request failed');
      }

      setFeedback(resumeFeedback, 'Resume processed successfully.', 'success');
      resumeForm.reset();
    } catch (_err) {
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
      } catch (_qerr) {
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
    } catch (_error) {
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
    } catch (_err) {
      setFeedback(attendanceFeedback, 'Webcam access denied or unavailable.', 'info');
    }
  }

  function stopWebcam() {
    if (webcamStream) {
      webcamStream.getTracks().forEach((track) => {
        track.stop();
      });
      webcamStream = null;
    }
    webcamVideo.srcObject = null;
  }

  function captureAndVerifyFace() {
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
          const token = localStorage.getItem('ems_token');
          const headers = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }

          const response = await fetch('/api/verify-attendance', {
            method: 'POST',
            headers,
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
  function initAudioRecorder() {
    if (!navigator.mediaDevices?.getUserMedia) {
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
          stream.getTracks().forEach((track) => {
            track.stop();
          });
        });

        mediaRecorder.start();
        recordingIndicator.classList.remove('hidden');
      } catch (_err) {
        setFeedback(leaveFeedback, 'Microphone access denied or error.', 'info');
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

        const token = localStorage.getItem('ems_token');
        const headers = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch('/api/submit-audio-leave', {
          method: 'POST',
          headers,
          body: formData,
        });
        if (!response.ok) {
          throw new Error('Request failed');
        }

        setFeedback(leaveFeedback, 'Voice note submitted for processing.', 'success');
        currentAudioBlob = null;
        audioPlayback.classList.add('hidden');
        submitAudioBtn.classList.add('hidden');
      } catch (_error) {
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
      } catch (_error) {}
    }

    checkAuth();
  }

  document.addEventListener('DOMContentLoaded', () => {
    void init();
  });
})();
