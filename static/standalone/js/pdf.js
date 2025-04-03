/**
 * PDF generation functions for the damage report system
 */

// DOM geladen
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await buildReport();
        
        // Event-Listener registrieren
        document.getElementById('printBtn').addEventListener('click', function() {
            window.print();
        });
        
        document.getElementById('downloadBtn').addEventListener('click', function() {
            downloadPDF();
        });
    } catch (error) {
        console.error('Fehler beim Erstellen des Berichts:', error);
        showError('Der Bericht konnte nicht erstellt werden: ' + error.message);
    }
});

/**
 * Builds the report content for PDF generation
 */
async function buildReport() {
    const reportId = getParameterByName('id');
    if (!reportId) {
        showError('Keine Berichts-ID gefunden');
        return;
    }
    
    try {
        // Lade den Bericht aus der Datenbank
        const report = await getReport(parseInt(reportId, 10));
        
        // Bereite den PDF-Container vor
        const container = document.getElementById('pdfContainer');
        container.innerHTML = '';
        
        // Formatiere das Datum für die Anzeige
        const datumObj = new Date(report.datum);
        const formattedDate = datumObj.toLocaleDateString('de-DE');
        
        // Erstelle den PDF-Inhalt
        const pdfContent = document.createElement('div');
        pdfContent.className = 'pdf-content';
        
        // Header
        const header = document.createElement('div');
        header.className = 'pdf-header';
        header.innerHTML = `
            <h1>Schadensbericht</h1>
            <p class="pdf-date">Datum: ${formattedDate}</p>
        `;
        pdfContent.appendChild(header);
        
        // Allgemeine Informationen
        const allgemeineInfos = createSection('Allgemeine Informationen', [
            { label: 'Kunde', value: report.kunde || '-' },
            { label: 'Schadensnummer', value: report.schadensnummer || '-' },
            { label: 'Kennzeichen', value: report.kennzeichen || '-' },
            { label: 'Besitzer', value: report.besitzer || '-' },
            { label: 'Fahrzeug', value: report.fahrzeug || '-' }
        ]);
        pdfContent.appendChild(allgemeineInfos);
        
        // Prüfung
        const pruefung = createSection('Prüfung', [
            { label: 'Art der Prüfung', value: report.pruefung || '-' },
            { label: 'Ort der Prüfung', value: report.pruefungsort || '-' },
            { label: 'Grund der Prüfung', value: report.pruefungsgrund || '-', multiline: true }
        ]);
        pdfContent.appendChild(pruefung);
        
        // Ergebnis und Bilder nebeneinander in einem Flexbox-Container
        const resultSection = document.createElement('div');
        resultSection.className = 'pdf-flex-container';
        
        // Ergebnis der Prüfung
        const ergebnis = document.createElement('div');
        ergebnis.className = 'pdf-section pdf-flex-item';
        ergebnis.innerHTML = `
            <h2 class="pdf-section-title">Ergebnis der Prüfung</h2>
            <div class="pdf-section-content">
                <div class="pdf-multiline">${report.ergebnis || '-'}</div>
            </div>
        `;
        resultSection.appendChild(ergebnis);
        
        // Bilder
        if (report.bilder && report.bilder.length > 0) {
            const bilder = document.createElement('div');
            bilder.className = 'pdf-section pdf-flex-item';
            bilder.innerHTML = `<h2 class="pdf-section-title">Ergebnis Bilder</h2>`;
            
            const bilderContent = document.createElement('div');
            bilderContent.className = 'pdf-section-content pdf-images';
            
            for (const bild of report.bilder) {
                if (bild.data) {
                    const imageContainer = document.createElement('div');
                    imageContainer.className = 'pdf-image-container';
                    imageContainer.innerHTML = `
                        <img src="${bild.data}" class="pdf-image" alt="${bild.beschreibung || 'Bild'}">
                        <div class="pdf-image-description">${bild.beschreibung || ''}</div>
                    `;
                    bilderContent.appendChild(imageContainer);
                }
            }
            
            bilder.appendChild(bilderContent);
            resultSection.appendChild(bilder);
        }
        
        pdfContent.appendChild(resultSection);
        
        // Füge den PDF-Inhalt zum Container hinzu
        container.appendChild(pdfContent);
        
    } catch (error) {
        console.error('Fehler beim Laden des Berichts:', error);
        showError('Der Bericht konnte nicht geladen werden: ' + error.message);
    }
    
    /**
     * Creates a section of the report
     * @param {string} title - The title of the section
     * @param {Array} fields - The fields to include in the section
     * @returns {HTMLElement} The created section element
     */
    function createSection(title, fields) {
        const section = document.createElement('div');
        section.className = 'pdf-section';
        
        const titleElement = document.createElement('h2');
        titleElement.className = 'pdf-section-title';
        titleElement.textContent = title;
        section.appendChild(titleElement);
        
        const content = document.createElement('div');
        content.className = 'pdf-section-content';
        
        for (const field of fields) {
            const fieldElement = document.createElement('div');
            fieldElement.className = 'pdf-field';
            
            const labelElement = document.createElement('div');
            labelElement.className = 'pdf-label';
            labelElement.textContent = field.label + ':';
            fieldElement.appendChild(labelElement);
            
            const valueElement = document.createElement('div');
            valueElement.className = field.multiline ? 'pdf-value pdf-multiline' : 'pdf-value';
            valueElement.textContent = field.value;
            fieldElement.appendChild(valueElement);
            
            content.appendChild(fieldElement);
        }
        
        section.appendChild(content);
        return section;
    }
}

/**
 * Downloads the report as a PDF
 */
function downloadPDF() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.classList.remove('d-none');
    
    const pdfContent = document.querySelector('.pdf-content');
    const reportId = getParameterByName('id');
    
    const options = {
        margin: [10, 10, 20, 10],
        filename: `Schadensbericht_${reportId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().from(pdfContent).set(options).save().then(() => {
        loadingIndicator.classList.add('d-none');
    }).catch(error => {
        console.error('PDF Download Fehler:', error);
        showError('Der PDF-Download ist fehlgeschlagen: ' + error.message);
        loadingIndicator.classList.add('d-none');
    });
}

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
 * Displays an error message
 * @param {string} message - The error message to display
 */
function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.textContent = message;
    errorContainer.classList.remove('d-none');
    
    // Scroll to error message
    errorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}