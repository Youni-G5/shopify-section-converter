/**
 * Content Script - Version debug pour traquer l'erreur
 */

let isSelectionMode = false;
let selectionOverlay = null;
let selectedElement = null;
let highlightBox = null;
let conversionMode = 'auto';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startSelection') {
    conversionMode = message.mode || 'auto';
    startSelectionMode();
    sendResponse({ success: true });
  } else if (message.action === 'stopSelection') {
    stopSelectionMode();
    sendResponse({ success: true });
  }
  return true;
});

function startSelectionMode() {
  if (isSelectionMode) return;
  
  isSelectionMode = true;
  document.body.style.cursor = 'crosshair';
  
  createOverlay();
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleClick);
  document.addEventListener('keydown', handleKeyDown);
  
  console.log('[Shopify Converter] Mode sélection activé -', conversionMode);
}

function stopSelectionMode() {
  if (!isSelectionMode) return;
  
  isSelectionMode = false;
  document.body.style.cursor = '';
  
  if (selectionOverlay) {
    selectionOverlay.remove();
    selectionOverlay = null;
  }
  
  if (highlightBox) {
    highlightBox.remove();
    highlightBox = null;
  }
  
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('click', handleClick);
  document.removeEventListener('keydown', handleKeyDown);
  
  console.log('[Shopify Converter] Mode sélection désactivé');
}

function createOverlay() {
  selectionOverlay = document.createElement('div');
  selectionOverlay.id = 'shopify-converter-overlay';
  selectionOverlay.innerHTML = `
    <div class="sc-panel">
      <div class="sc-panel-header">
        <span class="sc-title">🎯 Shopify Section Converter</span>
        <button class="sc-close" id="sc-close-btn">×</button>
      </div>
      <div class="sc-panel-body">
        <p class="sc-instruction">
          👆 Survolez et cliquez sur la section à capturer
        </p>
        <div class="sc-mode-badge">
          Mode: <strong>${conversionMode === 'auto' ? '🤖 Automatique' : conversionMode === 'api' ? '🔑 API' : '👋 Manuel'}</strong>
        </div>
        <div class="sc-info" id="sc-element-info">
          <div class="sc-info-item">
            <span class="sc-label">Tag:</span>
            <span class="sc-value" id="sc-tag">-</span>
          </div>
          <div class="sc-info-item">
            <span class="sc-label">Classes:</span>
            <span class="sc-value" id="sc-classes">-</span>
          </div>
          <div class="sc-info-item">
            <span class="sc-label">Dimensions:</span>
            <span class="sc-value" id="sc-dimensions">-</span>
          </div>
        </div>
        <div class="sc-controls">
          <button class="sc-btn sc-btn-secondary" id="sc-cancel-btn">
            ❌ Annuler (Esc)
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(selectionOverlay);
  
  document.getElementById('sc-close-btn').addEventListener('click', stopSelectionMode);
  document.getElementById('sc-cancel-btn').addEventListener('click', stopSelectionMode);
}

function handleMouseMove(e) {
  if (!isSelectionMode) return;
  if (e.target.closest('#shopify-converter-overlay')) return;
  
  const element = e.target;
  selectedElement = element;
  
  updateElementInfo(element);
  
  if (!highlightBox) {
    highlightBox = document.createElement('div');
    highlightBox.id = 'sc-highlight-box';
    document.body.appendChild(highlightBox);
  }
  
  const rect = element.getBoundingClientRect();
  highlightBox.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    left: ${rect.left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    border: 3px solid #4CAF50;
    background: rgba(76, 175, 80, 0.1);
    pointer-events: none;
    z-index: 999999;
    box-sizing: border-box;
  `;
}

function updateElementInfo(element) {
  const tag = element.tagName.toLowerCase();
  
  let classes = 'Aucune';
  if (element.className) {
    if (typeof element.className === 'string') {
      const classList = element.className.split(' ').filter(c => c.trim().length > 0);
      classes = classList.length > 0 ? classList.slice(0, 3).join(', ') : 'Aucune';
    } else if (element.className.baseVal !== undefined) {
      classes = element.className.baseVal || 'Aucune';
    }
  }
  
  const rect = element.getBoundingClientRect();
  const dimensions = `${Math.round(rect.width)}px × ${Math.round(rect.height)}px`;
  
  document.getElementById('sc-tag').textContent = tag;
  document.getElementById('sc-classes').textContent = classes;
  document.getElementById('sc-dimensions').textContent = dimensions;
}

function handleClick(e) {
  if (!isSelectionMode) return;
  if (e.target.closest('#shopify-converter-overlay')) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const element = e.target;
  console.log('[Shopify Converter] Élément sélectionné:', element);
  
  captureElement(element);
}

function handleKeyDown(e) {
  if (e.key === 'Escape') {
    stopSelectionMode();
  }
}

async function captureElement(element) {
  try {
    console.log('[DEBUG] 1. Démarrage capture');
    console.log('[DEBUG] 1.1. Element:', element);
    console.log('[DEBUG] 1.2. Element.tagName:', element.tagName);
    console.log('[DEBUG] 1.3. Element.className:', element.className);
    
    stopSelectionMode();
    showLoader('Capture en cours...');
    
    updateLoader('📸 Capture du screenshot...');
    console.log('[DEBUG] 2. Avant captureScreenshot');
    
    const screenshot = await captureScreenshotViaBackground(element);
    console.log('[DEBUG] 3. Après captureScreenshot:', screenshot ? 'OK' : 'NULL');
    
    updateLoader('📝 Extraction des données...');
    console.log('[DEBUG] 4. Extraction className');
    
    let className = '';
    if (element.className) {
      if (typeof element.className === 'string') {
        className = element.className;
      } else if (element.className.baseVal !== undefined) {
        className = element.className.baseVal;
      }
    }
    console.log('[DEBUG] 4.1. className extrait:', className);
    
    console.log('[DEBUG] 5. Création captureData');
    const captureData = {
      html: element.outerHTML,
      computedStyles: {}, // TEMPORAIREMENT VIDE pour debug
      boundingBox: element.getBoundingClientRect().toJSON(),
      tagName: element.tagName,
      className: className,
      screenshot: screenshot,
      url: window.location.href,
      timestamp: Date.now()
    };
    
    console.log('[DEBUG] 6. CaptureData créé:', captureData);
    console.log('[Shopify Converter] Screenshot capturé:', screenshot?.size || 'N/A');
    
    updateLoader('🚀 Envoi au background...');
    console.log('[DEBUG] 7. Avant sendMessage');
    
    chrome.runtime.sendMessage({
      action: 'elementCaptured',
      data: captureData,
      mode: conversionMode
    }, (response) => {
      console.log('[DEBUG] 8. Réponse reçue:', response);
      hideLoader();
      if (response && response.success) {
        showSuccessMessage(
          conversionMode === 'auto' ? 'Capture envoyée à Perplexity...' :
          conversionMode === 'api' ? 'Conversion en cours via API...' :
          'Section capturée avec succès !'
        );
      } else {
        showErrorMessage(response?.error || 'Erreur inconnue');
      }
    });
    
  } catch (error) {
    console.error('[DEBUG] ERREUR CAPTURÉE:', error);
    console.error('[DEBUG] Stack:', error.stack);
    hideLoader();
    showErrorMessage(error.message);
  }
}

async function captureScreenshotViaBackground(element) {
  try {
    const rect = element.getBoundingClientRect();
    
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'captureTabScreenshot' }, (response) => {
        if (response && response.dataUrl) {
          resolve(response);
        } else {
          reject(new Error('Impossible de capturer l\'onglet'));
        }
      });
    });
    
    const croppedDataUrl = await cropImage(response.dataUrl, rect);
    
    return {
      dataUrl: croppedDataUrl,
      width: Math.round(rect.width * 2),
      height: Math.round(rect.height * 2),
      naturalWidth: rect.width,
      naturalHeight: rect.height,
      size: estimateBase64Size(croppedDataUrl)
    };
    
  } catch (error) {
    console.error('[Screenshot] Erreur capture:', error);
    return null;
  }
}

async function cropImage(dataUrl, rect) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const scale = 2;
      canvas.width = rect.width * scale;
      canvas.height = rect.height * scale;
      ctx.scale(scale, scale);
      
      ctx.drawImage(
        img,
        rect.left, rect.top, rect.width, rect.height,
        0, 0, rect.width, rect.height
      );
      
      resolve(canvas.toDataURL('image/png', 0.9));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function estimateBase64Size(base64) {
  if (!base64) return 'N/A';
  const bytes = (base64.length * 3) / 4;
  if (bytes < 1024) return bytes.toFixed(0) + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function showLoader(message = 'Capture en cours...') {
  const loader = document.createElement('div');
  loader.id = 'sc-loader';
  loader.innerHTML = `
    <div class="sc-loader-content">
      <div class="sc-spinner"></div>
      <p id="sc-loader-message">${message}</p>
    </div>
  `;
  document.body.appendChild(loader);
}

function updateLoader(message) {
  const loaderMessage = document.getElementById('sc-loader-message');
  if (loaderMessage) {
    loaderMessage.textContent = message;
  }
}

function hideLoader() {
  const loader = document.getElementById('sc-loader');
  if (loader) loader.remove();
}

function showSuccessMessage(text) {
  const message = document.createElement('div');
  message.className = 'sc-message sc-success';
  message.innerHTML = '✅ ' + text;
  document.body.appendChild(message);
  
  setTimeout(() => message.remove(), 3000);
}

function showErrorMessage(error) {
  const message = document.createElement('div');
  message.className = 'sc-message sc-error';
  message.innerHTML = `❌ Erreur: ${error}`;
  document.body.appendChild(message);
  
  setTimeout(() => message.remove(), 5000);
}

console.log('[Shopify Converter] Content script chargé v1.1.4-DEBUG');
