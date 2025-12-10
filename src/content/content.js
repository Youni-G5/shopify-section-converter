/**
 * Content Script - Overlay de sélection visuelle
 * Injecté sur toutes les pages (sauf Perplexity)
 */

let isSelectionMode = false;
let selectionOverlay = null;
let selectedElement = null;
let highlightBox = null;

// Écouter les messages du background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startSelection') {
    startSelectionMode();
    sendResponse({ success: true });
  } else if (message.action === 'stopSelection') {
    stopSelectionMode();
    sendResponse({ success: true });
  }
  return true;
});

/**
 * Démarrer le mode de sélection
 */
function startSelectionMode() {
  if (isSelectionMode) return;
  
  isSelectionMode = true;
  document.body.style.cursor = 'crosshair';
  
  // Créer l'overlay
  createOverlay();
  
  // Ajouter les event listeners
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleClick);
  document.addEventListener('keydown', handleKeyDown);
  
  console.log('[Shopify Converter] Mode sélection activé');
}

/**
 * Arrêter le mode de sélection
 */
function stopSelectionMode() {
  if (!isSelectionMode) return;
  
  isSelectionMode = false;
  document.body.style.cursor = '';
  
  // Supprimer l'overlay
  if (selectionOverlay) {
    selectionOverlay.remove();
    selectionOverlay = null;
  }
  
  if (highlightBox) {
    highlightBox.remove();
    highlightBox = null;
  }
  
  // Retirer les event listeners
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('click', handleClick);
  document.removeEventListener('keydown', handleKeyDown);
  
  console.log('[Shopify Converter] Mode sélection désactivé');
}

/**
 * Créer l'overlay de sélection
 */
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
  
  // Event listeners pour les boutons
  document.getElementById('sc-close-btn').addEventListener('click', stopSelectionMode);
  document.getElementById('sc-cancel-btn').addEventListener('click', stopSelectionMode);
}

/**
 * Highlight de l'élément sous la souris
 */
function handleMouseMove(e) {
  if (!isSelectionMode) return;
  
  // Ignorer si on survole le panel
  if (e.target.closest('#shopify-converter-overlay')) return;
  
  const element = e.target;
  selectedElement = element;
  
  // Mettre à jour les infos
  updateElementInfo(element);
  
  // Créer ou mettre à jour la highlight box
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

/**
 * Mettre à jour les informations de l'élément
 */
function updateElementInfo(element) {
  const tag = element.tagName.toLowerCase();
  const classes = element.className ? element.className.toString().split(' ').slice(0, 3).join(', ') : 'Aucune';
  const rect = element.getBoundingClientRect();
  const dimensions = `${Math.round(rect.width)}px × ${Math.round(rect.height)}px`;
  
  document.getElementById('sc-tag').textContent = tag;
  document.getElementById('sc-classes').textContent = classes;
  document.getElementById('sc-dimensions').textContent = dimensions;
}

/**
 * Gérer le clic pour capturer
 */
function handleClick(e) {
  if (!isSelectionMode) return;
  
  // Ignorer si on clique sur le panel
  if (e.target.closest('#shopify-converter-overlay')) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const element = e.target;
  
  console.log('[Shopify Converter] Élément sélectionné:', element);
  
  // Capturer l'élément
  captureElement(element);
}

/**
 * Gérer les touches clavier
 */
function handleKeyDown(e) {
  if (e.key === 'Escape') {
    stopSelectionMode();
  }
}

/**
 * Capturer l'élément sélectionné
 */
async function captureElement(element) {
  try {
    console.log('[Shopify Converter] Démarrage de la capture...');
    
    // Arrêter le mode sélection
    stopSelectionMode();
    
    // Afficher un loader
    showLoader();
    
    // Capturer les données
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
    
    console.log('[Shopify Converter] Données capturées:', captureData);
    
    // Envoyer au background script
    chrome.runtime.sendMessage({
      action: 'elementCaptured',
      data: captureData
    }, (response) => {
      hideLoader();
      if (response && response.success) {
        showSuccessMessage();
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

/**
 * Récupérer les styles computed récursivement
 */
function getComputedStylesRecursive(element, depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return {};
  
  const styles = {};
  const computed = window.getComputedStyle(element);
  
  // Propriétés CSS importantes
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

/**
 * Capturer des screenshots multi-viewport
 */
async function captureScreenshots(element) {
  // Pour le MVP, on capture juste la position actuelle
  // Les screenshots multi-viewport seront implémentés plus tard
  const rect = element.getBoundingClientRect();
  
  return {
    desktop: {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      elementRect: rect.toJSON()
    }
  };
}

/**
 * Afficher un loader
 */
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

/**
 * Masquer le loader
 */
function hideLoader() {
  const loader = document.getElementById('sc-loader');
  if (loader) loader.remove();
}

/**
 * Afficher un message de succès
 */
function showSuccessMessage() {
  const message = document.createElement('div');
  message.className = 'sc-message sc-success';
  message.innerHTML = '✅ Section capturée avec succès !';
  document.body.appendChild(message);
  
  setTimeout(() => message.remove(), 3000);
}

/**
 * Afficher un message d'erreur
 */
function showErrorMessage(error) {
  const message = document.createElement('div');
  message.className = 'sc-message sc-error';
  message.innerHTML = `❌ Erreur: ${error}`;
  document.body.appendChild(message);
  
  setTimeout(() => message.remove(), 5000);
}

console.log('[Shopify Converter] Content script chargé');