/**
 * Content Script - Phase 2 avec mode auto
 */

let isSelectionMode = false;
let selectionOverlay = null;
let selectedElement = null;
let highlightBox = null;
let conversionMode = 'auto';

// Écouter les messages du background script
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
          Mode: <strong>${conversionMode === 'auto' ? '🤖 Automatique' : '👋 Manuel'}</strong>
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
  const classes = element.className ? element.className.toString().split(' ').slice(0, 3).join(', ') : 'Aucune';
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
    console.log('[Shopify Converter] Démarrage de la capture...');
    
    stopSelectionMode();
    showLoader();
    
    const captureData = {
      html: element.outerHTML,
      computedStyles: getComputedStylesRecursive(element),
      boundingBox: element.getBoundingClientRect().toJSON(),
      tagName: element.tagName,
      className: element.className,
      screenshots: await captureScreenshots(element),
      url: window.location.href,
      timestamp: Date.now()
    };
    
    console.log('[Shopify Converter] Données capturées, mode:', conversionMode);
    
    chrome.runtime.sendMessage({
      action: 'elementCaptured',
      data: captureData,
      mode: conversionMode
    }, (response) => {
      hideLoader();
      if (response && response.success) {
        showSuccessMessage(conversionMode === 'auto' ? 
          'Capture envoyée à Perplexity...' : 
          'Section capturée avec succès !'
        );
      } else {
        showErrorMessage(response?.error || 'Erreur inconnue');
      }
    });
    
  } catch (error) {
    console.error('[Shopify Converter] Erreur lors de la capture:', error);
    hideLoader();
    showErrorMessage(error.message);
  }
}

function getComputedStylesRecursive(element, depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return {};
  
  const styles = {};
  const computed = window.getComputedStyle(element);
  
  const importantProps = [
    'display', 'position', 'width', 'height', 'margin', 'padding',
    'background', 'backgroundColor', 'backgroundImage', 'backgroundSize',
    'color', 'fontSize', 'fontFamily', 'fontWeight', 'lineHeight',
    'border', 'borderRadius', 'boxShadow', 'textAlign',
    'flex', 'flexDirection', 'justifyContent', 'alignItems',
    'grid', 'gridTemplateColumns', 'gridGap'
  ];
  
  importantProps.forEach(prop => {
    styles[prop] = computed.getPropertyValue(prop);
  });
  
  return styles;
}

async function captureScreenshots(element) {
  const rect = element.getBoundingClientRect();
  
  return {
    desktop: {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      elementRect: rect.toJSON()
    }
  };
}

function showLoader() {
  const loader = document.createElement('div');
  loader.id = 'sc-loader';
  loader.innerHTML = `
    <div class="sc-loader-content">
      <div class="sc-spinner"></div>
      <p>Capture en cours...</p>
    </div>
  `;
  document.body.appendChild(loader);
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

console.log('[Shopify Converter] Content script Phase 2 chargé');
