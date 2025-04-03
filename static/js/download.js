/**
 * Download-Funktionalität für die Schadensbericht App
 */

document.addEventListener('DOMContentLoaded', function() {
  const downloadButton = document.getElementById('downloadAppButton');
  
  if (downloadButton) {
    downloadButton.addEventListener('click', function() {
      // Download initiieren
      window.location.href = '/download';
    });
  }
});