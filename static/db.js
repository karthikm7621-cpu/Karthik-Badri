(function () {
  "use strict";

  const DB_NAME = "cpu-first-ems";
  const STORE_NAME = "sync_queue";
  const DB_VERSION = 1;

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const database = event.target.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function addToQueue(endpoint, payload, isFormData = false) {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    await new Promise((resolve, reject) => {
      const request = store.add({ endpoint, payload, isFormData, createdAt: new Date().toISOString() });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
  }

  async function getQueueCount() {
    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const count = await new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return count;
  }

  async function processQueue() {
    if (!navigator.onLine) {
      return 0;
    }

    const database = await openDatabase();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const entries = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    let syncedCount = 0;
    for (const entry of entries) {
      try {
        let fetchOptions = {
          method: "POST"
        };
        
        if (entry.isFormData) {
          const formData = new FormData();
          for (const key in entry.payload) {
            if (key === 'audio' && entry.payload[key] instanceof Blob) {
              formData.append(key, entry.payload[key], "audio.webm");
            } else {
              formData.append(key, entry.payload[key]);
            }
          }
          fetchOptions.body = formData;
        } else {
          fetchOptions.headers = { "Content-Type": "application/json" };
          fetchOptions.body = JSON.stringify(entry.payload);
        }

        const response = await fetch(`/api/${entry.endpoint}`, fetchOptions);

        if (!response.ok) {
          throw new Error("Request failed");
        }

        await new Promise((resolve, reject) => {
          const deleteRequest = store.delete(entry.id);
          deleteRequest.onsuccess = () => resolve();
          deleteRequest.onerror = () => reject(deleteRequest.error);
        });
        syncedCount += 1;
      } catch (error) {
        console.warn("Queue sync failed", error);
      }
    }

    database.close();
    return syncedCount;
  }

  window.OfflineQueue = {
    addToQueue,
    getQueueCount,
    processQueue,
  };
})();
