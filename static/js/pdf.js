/**
 * PDF generation functions for the damage report system
 */

document.addEventListener('DOMContentLoaded', function() {
  // Schaltflächen-Event-Handler einrichten
  const backButton = document.getElementById('backButton');
  const printPDF = document.getElementById('printPDF');
  const downloadPDF = document.getElementById('downloadPDF');
  
  if (backButton) {
    backButton.addEventListener('click', function() {
      window.history.back();
    });
  }
  
  if (printPDF) {
    printPDF.addEventListener('click', function() {
      window.print();
    });
  }
  
  if (downloadPDF) {
    downloadPDF.addEventListener('click', function() {
      const element = document.getElementById('reportContent');
      const opt = {
        margin: [15, 15, 15, 15],
        filename: 'schadensbericht.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    });
  }
  
  // Bericht aufbauen
  buildReport();
});

/**
 * Builds the report content for PDF generation
 */
async function buildReport() {
  const berichtId = getParameterByName('id');
  if (!berichtId) {
    document.getElementById('reportContent').innerText = 'Keine Bericht-ID angegeben.';
    return;
  }
  
  try {
    const bericht = await getReport(Number(berichtId));
    if (!bericht) {
      document.getElementById('reportContent').innerText = 'Bericht nicht gefunden.';
      return;
    }
    
    // Setze die Farben für bessere Druckqualität (weißer Hintergrund, schwarze Schrift)
    document.body.style.backgroundColor = 'white';
    
    const container = document.getElementById('reportContent');
    container.innerHTML = '';
    container.style.backgroundColor = 'white';
    container.style.color = 'black';
    container.style.borderRadius = '5px';

    /**
     * Creates a section of the report
     * @param {string} title - The title of the section
     * @param {Array} fields - The fields to include in the section
     * @returns {HTMLElement} The created section element
     */
    function createSection(title, fields) {
      const sec = document.createElement('div');
      sec.className = 'section container';
      const titleEl = document.createElement('div');
      titleEl.className = 'section-title';
      titleEl.innerText = title;
      sec.appendChild(titleEl);
      
      fields.forEach(field => {
        if (bericht[field.key]) {
          const fieldDiv = document.createElement('div');
          fieldDiv.className = 'field';
          fieldDiv.innerHTML = '<span class="label">' + field.label + ':</span> ' + bericht[field.key];
          sec.appendChild(fieldDiv);
        }
      });
      
      return sec;
    }

    // Add all sections to the report
    container.appendChild(createSection('Projektdaten', [
      { label: 'Projekt', key: 'projekt' },
      { label: 'Unsere Projekt Nr.', key: 'unsere_projekt_nr' },
      { label: 'Sachbearbeiter', key: 'sachbearbeiter' },
      { label: 'Telefon', key: 'telefon' },
      { label: 'AG Projekt Nr.', key: 'ag_projekt_nr' },
      { label: 'Versicherung', key: 'versicherung' },
      { label: 'Datum', key: 'datum' },
      { label: 'Einsatzzeit', key: 'einsatzzeit' },
      { label: 'Fahrzeit', key: 'fahrzeit' },
      { label: 'Messtechniker', key: 'messtechniker' }
    ]));

    container.appendChild(createSection('Auftraggeber', [
      { label: 'Firma / Name', key: 'firma' },
      { label: 'Straße', key: 'firma_strasse' },
      { label: 'PLZ', key: 'firma_plz' },
      { label: 'Ort', key: 'firma_ort' },
      { label: 'Mail', key: 'mail' }
    ]));

    container.appendChild(createSection('Schadenort', [
      { label: 'Straße', key: 'schaden_strasse' },
      { label: 'PLZ', key: 'schaden_plz' },
      { label: 'Ort', key: 'schaden_ort' }
    ]));

    container.appendChild(createSection('Weitere betroffene Wohneinheiten', [
      { label: 'Name', key: 'kontakt_name' },
      { label: 'Mobil', key: 'kontakt_mobil' }
    ]));

    container.appendChild(createSection('Schadenursache', [
      { label: 'Schadenursache', key: 'schadenursache' }
    ]));

    // Ergebnis der Prüfung und Ergebnis Bilder sollen nebeneinander angezeigt werden
    const flexRow = document.createElement('div');
    flexRow.className = 'flex-row';
    
    // Linke Spalte: Ergebnis der Prüfung
    const leftColumn = document.createElement('div');
    leftColumn.className = 'flex-column';
    leftColumn.appendChild(createSection('Ergebnis der Prüfung', [
      { label: 'Whg./Raum', key: 'raum' },
      { label: 'Geschoss', key: 'geschoss' },
      { label: 'Öffnung möglich', key: 'oeffnung' },
      { label: 'Leitungsmaterial', key: 'leitungsmaterial' },
      { label: 'Leitungssystem', key: 'leitungssystem' },
      { label: 'Detailangabe', key: 'detail' }
    ]));
    
    // Rechte Spalte: Ergebnis Bilder
    const rightColumn = document.createElement('div');
    rightColumn.className = 'flex-column';

    // Ergebnis Bilder in die rechte Spalte einfügen
    const ergebnisBildSection = document.createElement('div');
    ergebnisBildSection.className = 'section container';
    const ergebnisBildTitle = document.createElement('div');
    ergebnisBildTitle.className = 'section-title';
    ergebnisBildTitle.innerText = 'Ergebnis Bilder';
    ergebnisBildSection.appendChild(ergebnisBildTitle);
    
    let hasResultImages = false;
    for (let i = 1; i <= 3; i++) {
      if (bericht['ergebnis_bild' + i]) {
        hasResultImages = true;
        const resDiv = document.createElement('div');
        resDiv.className = 'field';
        resDiv.innerHTML = '<span class="label">Ergebnis Bild ' + i + ':</span><br>';
        const resImg = document.createElement('img');
        resImg.className = 'image';
        resImg.src = bericht['ergebnis_bild' + i];
        resDiv.appendChild(resImg);
        resDiv.innerHTML += '<div class="small"><strong>Beschreibung:</strong> ' + (bericht['ergebnis_bild' + i + '_beschreibung'] || '') + '</div>';
        ergebnisBildSection.appendChild(resDiv);
      }
    }
    
    // Falls keine Bilder vorhanden sind, Hinweis anzeigen
    if (!hasResultImages) {
      const noImagesMsg = document.createElement('div');
      noImagesMsg.className = 'field';
      noImagesMsg.innerHTML = 'Keine Ergebnis-Bilder vorhanden.';
      ergebnisBildSection.appendChild(noImagesMsg);
    }
    
    rightColumn.appendChild(ergebnisBildSection);
    
    // Beide Spalten zur Flex-Row hinzufügen
    flexRow.appendChild(leftColumn);
    flexRow.appendChild(rightColumn);
    
    // Flex-Row zum Container hinzufügen
    container.appendChild(flexRow);

    container.appendChild(createSection('Messprotokoll', [
      { label: 'Anlass (Notfall)', key: 'notfall' },
      { label: 'Gemeldet wurde', key: 'meldung' },
      { label: 'Eingesetzte Messverfahren', key: 'verfahren' }
    ]));

    container.appendChild(createSection('PLUS+ Leistungen', [
      { label: 'Notabdichtung', key: 'plus_notabdichtung' },
      { label: 'Reparatur', key: 'plus_reparatur' },
      { label: 'Gebrauchsfähigkeit hergestellt', key: 'plus_gebrauch' },
      { label: 'Verstopfung behoben / Rohrreinigung', key: 'plus_verstopfung' },
      { label: 'Fliesen zerstörungsfrei entfernt', key: 'plus_fliesen' },
      { label: 'Ersatzfliesen vorhanden', key: 'plus_ersatz' },
      { label: 'Schuttentsorgung', key: 'plus_schutt' },
      { label: 'Abdeckmaterial', key: 'plus_abdeck' },
      { label: 'Rohrreinigung', key: 'plus_rohr' },
      { label: 'Sofortmaßnahme Sporenblocker', key: 'plus_sporen' },
      { label: 'Schimmelpilztest', key: 'plus_schimmel' },
      { label: 'Skizze', key: 'plus_skizze' },
      { label: 'Videodokumentation', key: 'plus_video' },
      { label: 'Baustelleneinrichtung', key: 'plus_baustelle' }
    ]));

    // Add image sections
    const bildSection = document.createElement('div');
    bildSection.className = 'section container';
    const bildTitle = document.createElement('div');
    bildTitle.className = 'section-title';
    bildTitle.innerText = 'Bilddokumentation';
    bildSection.appendChild(bildTitle);
    
    let hasImages = false;
    for (let i = 1; i <= 10; i++) {
      if (bericht['bild' + i]) {
        hasImages = true;
        const imgDiv = document.createElement('div');
        imgDiv.className = 'field';
        imgDiv.innerHTML = '<span class="label">Bild ' + i + ':</span><br>';
        const img = document.createElement('img');
        img.className = 'image';
        img.src = bericht['bild' + i];
        imgDiv.appendChild(img);
        imgDiv.innerHTML += '<div class="small"><strong>Etage:</strong> ' + (bericht['bild' + i + '_etage'] || '') +
                            ' | <strong>Raum:</strong> ' + (bericht['bild' + i + '_raum'] || '') +
                            ' | <strong>Beschreibung:</strong> ' + (bericht['bild' + i + '_beschreibung'] || '') + '</div>';
        bildSection.appendChild(imgDiv);
      }
    }
    
    if (hasImages) {
      container.appendChild(bildSection);
    }

    // Aktionen für die PDF-Operationen erstellen (wird NICHT in die PDF aufgenommen)
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'pdf-actions mt-4';
    actionsDiv.innerHTML = `
      <h3>PDF-Aktionen</h3>
      <div class="d-flex gap-2 mt-3">
        <button id="downloadPdfBtn" class="btn btn-primary">PDF herunterladen</button>
        <button id="printPdfBtn" class="btn btn-secondary">PDF drucken</button>
        <button id="emailPdfBtn" class="btn btn-info">Per E-Mail senden</button>
        <a href="/" class="btn btn-outline-dark">Zurück zur Startseite</a>
      </div>
    `;
    
    // Wir erstellen eine Kopie des Containers ohne die Aktionen für die PDF-Generierung
    const pdfContainer = container.cloneNode(true);
    
    // Nachdem die PDF-Inhalte erstellt wurden, fügen wir die Aktionen zum original Container hinzu
    // Diese werden dann nur in der Webansicht angezeigt, nicht im PDF
    container.appendChild(actionsDiv);
    
    // Configure PDF generation options
    const opt = {
      margin: 10,
      filename: 'Schadensbericht_' + berichtId + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // PDF generieren und für Aktionen verfügbar machen
    // Wichtig: Wir verwenden pdfContainer (ohne Aktionsbuttons) für die PDF-Generierung
    let pdfInstance = html2pdf().set(opt).from(pdfContainer);
    
    // Blob-URL des PDFs abrufen
    pdfInstance.outputPdf('bloburl').then(function(pdfUrl) {
      // PDF-Aktionen einrichten
      document.getElementById('downloadPdfBtn').addEventListener('click', function() {
        // PDF direkt herunterladen
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = 'Schadensbericht_' + berichtId + '.pdf';
        link.click();
      });
      
      document.getElementById('printPdfBtn').addEventListener('click', function() {
        // Erstelle eine separate Druckversion für bessere Druckqualität
        const contentToPrint = document.getElementById('reportContent').cloneNode(true);
        
        // Entferne die PDF-Aktionsbuttons aus der Druckansicht
        const actionsToRemove = contentToPrint.querySelector('.pdf-actions');
        if (actionsToRemove) {
          actionsToRemove.remove();
        }
        
        // Erstelle ein neues Fenster mit optimiertem Druckinhalt
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Schadensbericht Druck</title>
              <link rel="stylesheet" href="/static/css/pdf.css">
              <style>
                body {
                  background-color: white;
                  color: black;
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 20px;
                }
                @media print {
                  @page { 
                    margin-top: 3.5cm;    /* Platz für Kopfzeile */
                    margin-bottom: 2.5cm; /* Platz für Fußzeile */
                    margin-left: 1.5cm;
                    margin-right: 1.5cm;
                  }
                  #printContent {
                    padding-top: 0.5cm;    /* Zusätzlicher Abstand innerhalb des Inhalts */
                    padding-bottom: 0.5cm;
                  }
                }
              </style>
            </head>
            <body>
              <div id="printContent">${contentToPrint.innerHTML}</div>
              <script>
                // Automatisch drucken und danach schließen
                window.onload = function() {
                  setTimeout(function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                  }, 500);
                };
              </script>
            </body>
            </html>
          `);
          printWindow.document.close();
        } else {
          alert('Bitte erlauben Sie Pop-ups, um das Drucken zu ermöglichen.');
        }
      });
      
      document.getElementById('emailPdfBtn').addEventListener('click', function() {
        // Zuerst PDF speichern, dann E-Mail-Option anbieten
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = 'Schadensbericht_' + berichtId + '.pdf';
        link.click();
        
        // Kurze Verzögerung, damit das PDF erst heruntergeladen wird
        setTimeout(function() {
          // Einfache E-Mail-Option über mailto-Link
          const subject = encodeURIComponent('Schadensbericht ' + (bericht.projekt || ''));
          const body = encodeURIComponent('Sehr geehrte Damen und Herren,\n\nanbei der Schadensbericht.\n\nMit freundlichen Grüßen');
          
          // Standardmäßiger E-Mail-Client wird geöffnet
          window.location.href = `mailto:?subject=${subject}&body=${body}`;
          
          // Information anzeigen
          alert('Das PDF wurde heruntergeladen. Bitte fügen Sie es manuell als Anhang in die geöffnete E-Mail ein.');
        }, 1000);
      });
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des PDFs:', error);
    document.getElementById('reportContent').innerText = 'Fehler beim Erstellen des PDFs: ' + error.message;
  }
}

// Die buildReport-Funktion wird jetzt über das DOMContentLoaded-Event weiter oben aufgerufen
