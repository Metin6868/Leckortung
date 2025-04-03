/**
 * Database management functions for the damage report system
 * Handles interaction with IndexedDB
 */

/**
 * Opens the IndexedDB database
 * @returns {Promise} A promise that resolves with the database object
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("SchadensberichtDB", 1);
    
    // Create object store if needed
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("berichte")) {
        db.createObjectStore("berichte", { keyPath: "id" });
      }
    };
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Retrieves all stored reports from the database
 * @returns {Promise} A promise that resolves with all stored reports
 */
async function getAllReports() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("berichte", "readonly");
    const store = transaction.objectStore("berichte");
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves a specific report by ID
 * @param {number} id - The ID of the report to retrieve
 * @returns {Promise} A promise that resolves with the requested report
 */
async function getReport(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("berichte", "readonly");
    const store = transaction.objectStore("berichte");
    const request = store.get(Number(id));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves a report to the database
 * @param {Object} report - The report object to save
 * @returns {Promise} A promise that resolves when the report is saved
 */
async function saveReport(report) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("berichte", "readwrite");
    const store = transaction.objectStore("berichte");
    const request = store.put(report);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Deletes a report from the database
 * @param {number} id - The ID of the report to delete
 * @returns {Promise} A promise that resolves when the report is deleted
 */
async function deleteReport(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("berichte", "readwrite");
    const store = transaction.objectStore("berichte");
    const request = store.delete(Number(id));
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
