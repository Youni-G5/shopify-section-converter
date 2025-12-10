// Popup principale - Phase 3

let selectedMode = 'auto';

document.addEventListener('DOMContentLoaded', async () => {
  // Récupérer le mode sauvegardé
  const data = await chrome.storage.sync.get('conversionMode');
  selectedMode = data.conversionMode || 'auto';

  // Mettre à jour l'UI
  updateModeUI();

  // Event listeners pour les modes
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      selectedMode = e.currentTarget.getAttribute('data-mode');
      await chrome.storage.sync.set({ conversionMode: selectedMode });
      updateModeUI();
    });
  });

  // Bouton de sélection
  document.getElementById('startSelection').addEventListener('click', async () => {
    // Vérifier si le mode API est configuré
    if (selectedMode === 'api') {
      const apiData = await chrome.storage.sync.get('perplexityAPIKey');
      if (!apiData.perplexityAPIKey) {
        alert('⚠️ API key Perplexity non configurée.\nRendez-vous dans Paramètres pour la configurer.');
        return;
      }
    }
    
    chrome.runtime.sendMessage({ 
      action: 'startSelectionFromPopup',
      mode: selectedMode 
    }, () => {
      window.close();
    });
  });
  
  // Bibliothèque
  document.getElementById('libraryBtn').addEventListener('click', async () => {
    await chrome.windows.create({
      url: chrome.runtime.getURL('src/popup/library.html'),
      type: 'popup',
      width: 1200,
      height: 800,
      focused: true
    });
    window.close();
  });
  
  // Paramètres
  document.getElementById('settingsBtn').addEventListener('click', async () => {
    await chrome.windows.create({
      url: chrome.runtime.getURL('src/popup/settings.html'),
      type: 'popup',
      width: 450,
      height: 600,
      focused: true
    });
    window.close();
  });
  
  // Dernière capture
  document.getElementById('lastCaptureBtn').addEventListener('click', async () => {
    const data = await chrome.storage.local.get('lastConversion');
    if (data.lastConversion) {
      await chrome.windows.create({
        url: chrome.runtime.getURL('src/popup/review.html'),
        type: 'popup',
        width: 1000,
        height: 700,
        focused: true
      });
      window.close();
    } else {
      alert('⚠️ Aucune capture récente trouvée.');
    }
  });
  
  // Stats
  document.getElementById('statsBtn').addEventListener('click', async () => {
    await chrome.windows.create({
      url: chrome.runtime.getURL('src/popup/library.html'),
      type: 'popup',
      width: 1200,
      height: 800,
      focused: true
    });
    window.close();
  });

  console.log('[Shopify Converter] Popup Phase 3 chargée - Mode:', selectedMode);
});

function updateModeUI() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-mode') === selectedMode) {
      btn.classList.add('active');
    }
  });
}
