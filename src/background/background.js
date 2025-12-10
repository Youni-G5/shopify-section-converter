/**
 * Background Service Worker
 * - Orchestration de la capture
 * - Bridge Perplexity (mode manuel uniquement en Phase 1)
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Shopify Converter] Extension installée');
});

// Action sur clic de l'icône (ouvre la popup définie dans manifest)

// Messages provenant du popup ou du content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startSelectionFromPopup') {
    // Envoyer un message au content script de l'onglet actif
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: 'startSelection' }, (res) => {
        sendResponse(res || { success: true });
      });
    });
    return true;
  }

  if (message.action === 'elementCaptured') {
    // Stocker la capture et ouvrir le bridge manuel
    handleElementCaptured(message.data)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function handleElementCaptured(captureData) {
  console.log('[Shopify Converter] elementCaptured reçu dans le background', captureData);

  // En Phase 1, on se contente de stocker la capture pour le bridge manuel
  await chrome.storage.local.set({
    lastCapture: captureData
  });

  // Ouvrir la fenêtre du bridge manuel (sera complétée en 4.2)
  await chrome.windows.create({
    url: chrome.runtime.getURL('src/popup/perplexity-bridge.html'),
    type: 'popup',
    width: 900,
    height: 700,
    focused: true
  });
}
