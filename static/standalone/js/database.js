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
        const request = indexedDB.open('schadensbericht-db', 1);
        
        request.onerror = (event) => {
            reject(new Error('Fehler beim Öffnen der Datenbank: ' + event.target.error));
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Berichte-Objekt-Store erstellen, falls nicht vorhanden
            if (!db.objectStoreNames.contains('berichte')) {
                const objectStore = db.createObjectStore('berichte', { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('datum', 'datum', { unique: false });
                objectStore.createIndex('kunde', 'kunde', { unique: false });
            }
        };
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            resolve(db);
        };
    });
}

/**
 * Retrieves all stored reports from the database
 * @returns {Promise} A promise that resolves with all stored reports
 */
async function getAllReports() {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['berichte'], 'readonly');
        const objectStore = transaction.objectStore('berichte');
        const request = objectStore.getAll();
        
        request.onerror = (event) => {
            reject(new Error('Fehler beim Abrufen der Berichte: ' + event.target.error));
        };
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
    });
}

/**
 * Retrieves a specific report by ID
 * @param {number} id - The ID of the report to retrieve
 * @returns {Promise} A promise that resolves with the requested report
 */
async function getReport(id) {
    id = parseInt(id, 10);
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['berichte'], 'readonly');
        const objectStore = transaction.objectStore('berichte');
        const request = objectStore.get(id);
        
        request.onerror = (event) => {
            reject(new Error('Fehler beim Abrufen des Berichts: ' + event.target.error));
        };
        
        request.onsuccess = (event) => {
            if (event.target.result) {
                resolve(event.target.result);
            } else {
                reject(new Error('Bericht nicht gefunden'));
            }
        };
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
        const transaction = db.transaction(['berichte'], 'readwrite');
        const objectStore = transaction.objectStore('berichte');
        let request;
        
        if (report.id) {
            // Update existing report
            request = objectStore.put(report);
        } else {
            // Add new report
            request = objectStore.add(report);
        }
        
        request.onerror = (event) => {
            reject(new Error('Fehler beim Speichern des Berichts: ' + event.target.error));
        };
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
    });
}

/**
 * Deletes a report from the database
 * @param {number} id - The ID of the report to delete
 * @returns {Promise} A promise that resolves when the report is deleted
 */
async function deleteReport(id) {
    id = parseInt(id, 10);
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['berichte'], 'readwrite');
        const objectStore = transaction.objectStore('berichte');
        const request = objectStore.delete(id);
        
        request.onerror = (event) => {
            reject(new Error('Fehler beim Löschen des Berichts: ' + event.target.error));
        };
        
        request.onsuccess = () => {
            resolve();
        };
    });
}