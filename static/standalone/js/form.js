/**
 * Form handling for the damage report system
 */

// Globale Variablen
let currentReportId = null;
let imageCounter = 0;

// DOM geladen
document.addEventListener('DOMContentLoaded', function() {
    // Formular initialisieren
    initForm();
    
    // Event-Listener registrieren
    document.getElementById('schadensberichtForm').addEventListener('submit', function(event) {
        event.preventDefault();
        speichernBericht();
    });
    
    document.getElementById('addImageBtn').addEventListener('click', function() {
        addBildField(++imageCounter);
    });
    
    document.getElementById('resetFormBtn').addEventListener('click', function() {
        if (confirm('Möchten Sie das Formular wirklich zurücksetzen? Alle nicht gespeicherten Daten gehen verloren.')) {
            document.getElementById('schadensberichtForm').reset();
            document.getElementById('bilderContainer').innerHTML = '';
            imageCounter = 0;
        }
    });
    
    document.getElementById('pdfBtn').addEventListener('click', function() {
        exportAsPDF();
    });
    
    // Prüfen, ob ein vorhandener Bericht geladen werden soll
    loadReport();
});

/**
 * Get URL parameter by name
 * @param {string} name - The name of the parameter
 * @param {string} url - The URL to check (defaults to current window location)
 * @returns {string|null} The value of the parameter or null if not found
 */
function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Initializes the form with current date
 */
function initForm() {
    // Aktuelles Datum als Standardwert setzen
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('datum').value = today;
}

/**
 * Dynamically adds a new image field to the form
 * @param {number} nr - The number of the image field to add
 */
function addBildField(nr) {
    const container = document.getElementById('bilderContainer');
    
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';
    col.id = `bildCol_${nr}`;
    
    col.innerHTML = `
        <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="mb-0">Bild ${nr}</h6>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeBildField(${nr})">
                    Entfernen
                </button>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <label for="bildDatei_${nr}" class="form-label">Bild auswählen</label>
                    <input type="file" class="form-control" id="bildDatei_${nr}" accept="image/*">
                </div>
                <div class="mb-3">
                    <label for="bildBeschreibung_${nr}" class="form-label">Beschreibung</label>
                    <textarea class="form-control" id="bildBeschreibung_${nr}" rows="2"></textarea>
                </div>
                <div class="image-preview mt-3" id="bildVorschau_${nr}"></div>
            </div>
        </div>
    `;
    
    container.appendChild(col);
    
    // Event-Listener für Bildvorschau
    document.getElementById(`bildDatei_${nr}`).addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewContainer = document.getElementById(`bildVorschau_${nr}`);
                previewContainer.innerHTML = `<img src="${e.target.result}" class="img-fluid" alt="Vorschau">`;
            };
            reader.readAsDataURL(file);
        }
    });
}

/**
 * Removes an image field from the form
 * @param {number} nr - The number of the image field to remove
 */
function removeBildField(nr) {
    const element = document.getElementById(`bildCol_${nr}`);
    if (element) {
        element.remove();
    }
}

/**
 * Converts a file to a Data URL for storage
 * @param {File} file - The file to convert
 * @returns {Promise} A promise that resolves with the Data URL
 */
function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

/**
 * Populates the form with data from a saved report
 * @param {Object} data - The report data to populate the form with
 */
async function populateForm(data) {
    // Reset form and image container
    document.getElementById('schadensberichtForm').reset();
    document.getElementById('bilderContainer').innerHTML = '';
    
    // Set form fields
    document.getElementById('reportId').value = data.id;
    document.getElementById('kunde').value = data.kunde || '';
    document.getElementById('datum').value = data.datum || '';
    document.getElementById('schadensnummer').value = data.schadensnummer || '';
    document.getElementById('kennzeichen').value = data.kennzeichen || '';
    document.getElementById('besitzer').value = data.besitzer || '';
    document.getElementById('fahrzeug').value = data.fahrzeug || '';
    document.getElementById('pruefung').value = data.pruefung || '';
    document.getElementById('pruefungsort').value = data.pruefungsort || '';
    document.getElementById('pruefungsgrund').value = data.pruefungsgrund || '';
    document.getElementById('ergebnis').value = data.ergebnis || '';
    
    // Add image fields
    if (data.bilder && data.bilder.length > 0) {
        for (let i = 0; i < data.bilder.length; i++) {
            const bild = data.bilder[i];
            const nr = i + 1;
            
            addBildField(nr);
            document.getElementById(`bildBeschreibung_${nr}`).value = bild.beschreibung || '';
            
            // Create preview if image data is available
            if (bild.data) {
                const previewContainer = document.getElementById(`bildVorschau_${nr}`);
                previewContainer.innerHTML = `<img src="${bild.data}" class="img-fluid" alt="Vorschau">`;
            }
        }
        
        imageCounter = data.bilder.length;
    } else {
        imageCounter = 0;
    }
}

/**
 * Loads a report for editing
 */
async function loadReport() {
    const reportId = getParameterByName('id');
    if (reportId) {
        try {
            currentReportId = parseInt(reportId, 10);
            const report = await getReport(currentReportId);
            await populateForm(report);
        } catch (error) {
            console.error('Fehler beim Laden des Berichts:', error);
            showError('Der Bericht konnte nicht geladen werden: ' + error.message);
        }
    }
}

/**
 * Saves the current report
 */
async function speichernBericht() {
    const form = document.getElementById('schadensberichtForm');
    
    // Form validation
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    try {
        // Sammle Daten aus dem Formular
        const reportData = {
            kunde: document.getElementById('kunde').value,
            datum: document.getElementById('datum').value,
            schadensnummer: document.getElementById('schadensnummer').value,
            kennzeichen: document.getElementById('kennzeichen').value,
            besitzer: document.getElementById('besitzer').value,
            fahrzeug: document.getElementById('fahrzeug').value,
            pruefung: document.getElementById('pruefung').value,
            pruefungsort: document.getElementById('pruefungsort').value,
            pruefungsgrund: document.getElementById('pruefungsgrund').value,
            ergebnis: document.getElementById('ergebnis').value,
            bilder: []
        };
        
        // Bilder sammeln
        for (let i = 1; i <= imageCounter; i++) {
            const colElement = document.getElementById(`bildCol_${i}`);
            if (colElement) {
                const beschreibung = document.getElementById(`bildBeschreibung_${i}`).value;
                const fileInput = document.getElementById(`bildDatei_${i}`);
                let imageData = null;
                
                // Wenn ein neues Bild ausgewählt wurde, konvertiere es zu DataURL
                if (fileInput.files && fileInput.files[0]) {
                    imageData = await fileToDataURL(fileInput.files[0]);
                } else {
                    // Wenn kein neues Bild ausgewählt wurde, aber eine Vorschau existiert,
                    // verwende das vorhandene Bild
                    const preview = document.getElementById(`bildVorschau_${i}`);
                    if (preview && preview.querySelector('img')) {
                        imageData = preview.querySelector('img').src;
                    }
                }
                
                if (beschreibung || imageData) {
                    reportData.bilder.push({
                        beschreibung: beschreibung,
                        data: imageData
                    });
                }
            }
        }
        
        // ID setzen, wenn es sich um eine Bearbeitung handelt
        if (currentReportId) {
            reportData.id = currentReportId;
        }
        
        // Speichern
        const savedId = await saveReport(reportData);
        
        // Erfolg-Nachricht und Weiterleitung
        alert('Bericht erfolgreich gespeichert!');
        window.location.href = 'berichte.html';
        
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        showError('Der Bericht konnte nicht gespeichert werden: ' + error.message);
    }
}

/**
 * Exports the current report as a PDF
 */
async function exportAsPDF() {
    // Wenn die Formularvalidierung fehlschlägt, abbrechen
    const form = document.getElementById('schadensberichtForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    // Wenn ein existierender Bericht geöffnet ist, zur PDF-Seite weiterleiten
    if (currentReportId) {
        window.location.href = `pdf.html?id=${currentReportId}`;
        return;
    }
    
    // Sonst Bericht erst speichern und dann zur PDF-Seite weiterleiten
    try {
        await speichernBericht();
    } catch (error) {
        console.error('Fehler beim Speichern vor PDF-Export:', error);
        showError('Der Bericht konnte vor dem PDF-Export nicht gespeichert werden: ' + error.message);
    }
}

/**
 * Displays an error message
 * @param {string} message - The error message to display
 */
function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.textContent = message;
    errorContainer.classList.remove('d-none');
    
    // Scroll to error message
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Hide error after 5 seconds
    setTimeout(() => {
        errorContainer.classList.add('d-none');
    }, 5000);
}