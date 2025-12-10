/**
 * Screenshot Manager - Amélioration Phase 3+
 * Capture de screenshots réels PNG pour améliorer la qualité de conversion
 */

/**
 * Capturer un screenshot de l'élément sélectionné avec html2canvas
 */
export async function captureElementScreenshot(element) {
  try {
    // Charger html2canvas dynamiquement si nécessaire
    if (typeof html2canvas === 'undefined') {
      await loadHtml2Canvas();
    }

    const rect = element.getBoundingClientRect();
    
    // Scroll vers l'élément si nécessaire
    const originalScroll = { x: window.scrollX, y: window.scrollY };
    element.scrollIntoView({ behavior: 'instant', block: 'center' });
    await sleep(300);

    // Capturer avec html2canvas
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: 2, // Retina quality
      logging: false,
      useCORS: true,
      allowTaint: true,
      imageTimeout: 0,
      removeContainer: true
    });

    // Restaurer le scroll original
    window.scrollTo(originalScroll.x, originalScroll.y);

    // Convertir en base64
    const dataUrl = canvas.toDataURL('image/png', 0.9);

    return {
      dataUrl: dataUrl,
      width: canvas.width,
      height: canvas.height,
      naturalWidth: rect.width,
      naturalHeight: rect.height,
      size: estimateBase64Size(dataUrl)
    };

  } catch (error) {
    console.error('[Screenshot] Erreur html2canvas:', error);
    return null;
  }
}

/**
 * Capturer via l'API Chrome (tab screenshot)
 */
export async function captureTabScreenshot() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'captureTabScreenshot' }, (response) => {
      if (response && response.dataUrl) {
        resolve(response.dataUrl);
      } else {
        reject(new Error('Impossible de capturer l\'onglet'));
      }
    });
  });
}

/**
 * Capturer l'élément avec crop de la tab screenshot
 */
export async function captureElementFromTab(element) {
  try {
    // Capturer la tab complète
    const tabScreenshot = await captureTabScreenshot();
    
    // Obtenir la position de l'élément
    const rect = element.getBoundingClientRect();
    
    // Créer un canvas pour cropper
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const scale = 2; // Retina
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    ctx.scale(scale, scale);
    
    // Charger l'image
    const img = await loadImage(tabScreenshot);
    
    // Crop sur l'élément
    ctx.drawImage(
      img,
      rect.left, rect.top, rect.width, rect.height,
      0, 0, rect.width, rect.height
    );
    
    return {
      dataUrl: canvas.toDataURL('image/png', 0.9),
      width: canvas.width,
      height: canvas.height,
      method: 'tab-crop'
    };
    
  } catch (error) {
    console.error('[Screenshot] Erreur tab capture:', error);
    return null;
  }
}

/**
 * Capturer multi-viewport réels
 */
export async function captureMultiViewportReal(element) {
  const screenshots = {};
  
  // Viewport actuel (le plus fiable)
  console.log('[Screenshot] Capture viewport actuel...');
  const current = await captureElementScreenshot(element);
  if (current) {
    screenshots.current = current;
  }
  
  // Note: Les autres viewports nécessiteraient de redimensionner la fenêtre
  // ce qui n'est pas possible depuis un content script
  // On peut simuler avec des media queries CSS
  
  return screenshots;
}

/**
 * Charger html2canvas dynamiquement
 */
function loadHtml2Canvas() {
  return new Promise((resolve, reject) => {
    if (typeof html2canvas !== 'undefined') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Impossible de charger html2canvas'));
    document.head.appendChild(script);
  });
}

/**
 * Charger une image
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Estimer la taille d'un base64
 */
function estimateBase64Size(base64) {
  const bytes = (base64.length * 3) / 4;
  if (bytes < 1024) return bytes.toFixed(0) + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Optimiser un screenshot (compression)
 */
export async function optimizeScreenshot(dataUrl, maxWidth = 1920) {
  const img = await loadImage(dataUrl);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Redimensionner si trop grand
  let width = img.width;
  let height = img.height;
  
  if (width > maxWidth) {
    const ratio = maxWidth / width;
    width = maxWidth;
    height = height * ratio;
  }
  
  canvas.width = width;
  canvas.height = height;
  
  ctx.drawImage(img, 0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.85); // JPEG pour meilleure compression
}
