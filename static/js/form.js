/**
 * Form management functions for the damage report system
 * Handles creation, editing, and saving of reports
 */

// Store the current number of image fields
let currentImageCount = 1;

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
 * Dynamically adds a new image field to the form
 * @param {number} nr - The number of the image field to add
 */
function addBildField(nr) {
  if (nr > 10) return;
  
  const container = document.getElementById('bildContainer');
  
  // Erstelle einen Card-Container für das neue Bild
  const bildItem = document.createElement('div');
  bildItem.className = 'bild-item card p-3 mb-3';
  
  // Erstelle den HTML-Inhalt im Bootstrap-Raster-Layout
  bildItem.innerHTML = `
    <div class="fw-bold mb-2">Bild ${nr}</div>
    <div class="mb-2">
      <label for="bild${nr}" class="form-label">Bild-Datei:</label>
      <input type="file" name="bild${nr}" id="bild${nr}" accept="image/*" class="form-control">
    </div>
    <div class="row">
      <div class="col-md-4 col-sm-6 mb-2">
        <label for="bild${nr}_etage" class="form-label">Etage:</label>
        <input type="text" name="bild${nr}_etage" id="bild${nr}_etage" class="form-control">
      </div>
      <div class="col-md-4 col-sm-6 mb-2">
        <label for="bild${nr}_raum" class="form-label">Raum:</label>
        <input type="text" name="bild${nr}_raum" id="bild${nr}_raum" class="form-control">
      </div>
      <div class="col-md-4 col-sm-12 mb-2">
        <label for="bild${nr}_beschreibung" class="form-label">Beschreibung:</label>
        <input type="text" name="bild${nr}_beschreibung" id="bild${nr}_beschreibung" class="form-control">
      </div>
    </div>
  `;
  
  container.appendChild(bildItem);
  currentImageCount = nr;
}

/**
 * Converts a file to a Data URL for storage
 * @param {File} file - The file to convert
 * @returns {Promise} A promise that resolves with the Data URL
 */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Populates the form with data from a saved report
 * @param {Object} data - The report data to populate the form with
 */
async function populateForm(data) {
  const form = document.getElementById('berichtForm');
  
  // Set basic text, select, and textarea fields
  for (const [key, value] of Object.entries(data)) {
    if (key.endsWith('[]') || key.startsWith('bild') || key.startsWith('ergebnis_bild') || key === 'einsatzzeit') {
      continue; // Handle special fields separately
    }
    
    const field = form.elements[key];
    if (field) {
      field.value = value;
    }
  }
  
  // Verarbeiten der Einsatzzeit (teilen in Von/Bis Uhrzeit)
  if (data.einsatzzeit) {
    const einsatzzeiten = data.einsatzzeit.split(' - ');
    if (einsatzzeiten.length === 2) {
      const vonField = form.elements['einsatzzeit_von'];
      const bisField = form.elements['einsatzzeit_bis'];
      
      if (vonField) vonField.value = einsatzzeiten[0].trim();
      if (bisField) bisField.value = einsatzzeiten[1].trim();
    } else {
      // Falls kein Bindestrich vorhanden, setze gesamte Zeit in das Von-Feld
      const vonField = form.elements['einsatzzeit_von'];
      if (vonField) vonField.value = data.einsatzzeit;
    }
  }
  
  // Handle checkbox arrays
  if (data.verfahren && Array.isArray(data.verfahren)) {
    const checkboxes = form.querySelectorAll('input[name="verfahren[]"]');
    checkboxes.forEach(checkbox => {
      if (data.verfahren.includes(checkbox.value)) {
        checkbox.checked = true;
      }
    });
  }
  
  // Handle image fields
  for (let i = 1; i <= 10; i++) {
    const bildKey = 'bild' + i;
    if (data[bildKey] && i > 1) {
      addBildField(i);
    }
  }
}

/**
 * Loads a report for editing
 */
async function loadReport() {
  const editId = getParameterByName('id');
  if (editId) {
    try {
      const report = await getReport(Number(editId));
      if (report) {
        await populateForm(report);
      } else {
        alert('Bericht nicht gefunden!');
      }
    } catch (error) {
      console.error('Fehler beim Laden des Berichts:', error);
      alert('Fehler beim Laden des Berichts: ' + error.message);
    }
  }
}

/**
 * Saves the current report
 */
async function speichernBericht() {
  const form = document.getElementById('berichtForm');
  const formData = new FormData(form);
  const datenObj = {};
  
  // Process all form fields
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      if (value.size > 0) {
        datenObj[key] = await fileToDataURL(value);
      } else {
        datenObj[key] = '';
      }
    } else {
      if (key.endsWith('[]')) {
        const baseKey = key.slice(0, -2);
        if (!datenObj[baseKey]) datenObj[baseKey] = [];
        datenObj[baseKey].push(value);
      } else {
        datenObj[key] = value;
      }
    }
  }
  
  // Kombinieren der Einsatzzeit-Felder (Von/Bis) in ein einziges Feld für die Kompatibilität
  const einsatzzeit_von = formData.get('einsatzzeit_von');
  const einsatzzeit_bis = formData.get('einsatzzeit_bis');
  if (einsatzzeit_von || einsatzzeit_bis) {
    datenObj.einsatzzeit = (einsatzzeit_von || '') + (einsatzzeit_von && einsatzzeit_bis ? ' - ' : '') + (einsatzzeit_bis || '');
  }
  
  // Check if we're editing an existing report or creating a new one
  const editId = getParameterByName('id');
  if (editId) {
    datenObj.id = Number(editId);
    await saveReport(datenObj);
    alert('Bericht aktualisiert!');
  } else {
    datenObj.id = Date.now();
    await saveReport(datenObj);
    alert('Bericht gespeichert!');
  }
  
  // Reset form and clear URL parameter
  form.reset();
  window.history.replaceState(null, "", window.location.pathname);
}

/**
 * Exports the current report as a PDF
 */
async function exportAsPDF() {
  await speichernBericht();
  const editId = getParameterByName('id');
  const reportId = editId ? editId : Date.now();
  window.location.href = '/pdf?id=' + reportId;
}

// Add event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Set up Add Image button
  const addBildBtn = document.getElementById('addBildBtn');
  if (addBildBtn) {
    addBildBtn.addEventListener('click', function() {
      if (currentImageCount < 10) {
        addBildField(currentImageCount + 1);
      } else {
        alert('Maximal 10 Bilder erreicht.');
      }
    });
  }
  
  // Load existing report if editing
  loadReport();
  
  // Set up form action buttons
  const saveBtn = document.querySelector('button[onclick="speichernBericht()"]');
  if (saveBtn) {
    saveBtn.onclick = null;
    saveBtn.addEventListener('click', speichernBericht);
  }
  
  const pdfBtn = document.querySelector('button[onclick="exportAsPDF()"]');
  if (pdfBtn) {
    pdfBtn.onclick = null;
    pdfBtn.addEventListener('click', exportAsPDF);
  }
});
