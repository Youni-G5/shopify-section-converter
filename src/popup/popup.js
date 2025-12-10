// Popup - Phase 2 avec sélecteur de mode

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
    // Envoyer le mode au background
    chrome.runtime.sendMessage({ 
      action: 'startSelectionFromPopup',
      mode: selectedMode 
    }, () => {
      window.close();
    });
  });

  console.log('[Shopify Converter] Popup Phase 2 chargée - Mode:', selectedMode);
});

function updateModeUI() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-mode') === selectedMode) {
      btn.classList.add('active');
    }
  });
}
