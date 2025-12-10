document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('startSelection');

  btn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'startSelectionFromPopup' }, (res) => {
      window.close();
    });
  });

  console.log('[Shopify Converter] Popup chargée');
});
