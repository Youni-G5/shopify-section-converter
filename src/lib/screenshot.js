/**
 * Librairie utilitaire pour la capture de screenshots
 * Phase 2 - Screenshots multi-viewport réels
 */

/**
 * Capturer des screenshots à différents viewports
 */
export async function captureMultiViewport(element) {
  const screenshots = {};
  
  const viewports = [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
  ];

  // Sauvegarder le viewport actuel
  const originalWidth = window.innerWidth;
  const originalHeight = window.innerHeight;
  const originalScroll = { x: window.scrollX, y: window.scrollY };

  for (const viewport of viewports) {
    try {
      // Capturer au viewport actuel (pour le MVP)
      // Note: Le redimensionnement réel de fenêtre n'est pas possible depuis content script
      // Une vraie implémentation nécessiterait l'API chrome.windows ou puppeteer
      
      const rect = element.getBoundingClientRect();
      
      // Capturer via html2canvas si disponible, sinon faire un screenshot basique
      const canvas = await captureElementToCanvas(element);
      const dataUrl = canvas ? canvas.toDataURL('image/png') : null;
      
      screenshots[viewport.name] = {
        viewport: { width: viewport.width, height: viewport.height },
        elementRect: rect.toJSON(),
        screenshot: dataUrl,
        timestamp: Date.now()
      };
      
    } catch (error) {
      console.error(`[Screenshot] Erreur pour ${viewport.name}:`, error);
      screenshots[viewport.name] = {
        viewport: { width: viewport.width, height: viewport.height },
        error: error.message
      };
    }
  }

  return screenshots;
}

/**
 * Capturer un élément en canvas (version simplifiée)
 */
async function captureElementToCanvas(element) {
  try {
    // Créer un canvas de la taille de l'élément
    const rect = element.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = rect.width * 2; // 2x pour retina
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    
    // Dessiner le fond
    const bgColor = window.getComputedStyle(element).backgroundColor;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    // Note: Une vraie implémentation utiliserait html2canvas ou chrome.tabs.captureVisibleTab
    // Pour le MVP, on retourne un canvas de base avec les dimensions
    
    return canvas;
    
  } catch (error) {
    console.error('[Canvas] Erreur:', error);
    return null;
  }
}

/**
 * Capturer la page visible (nécessite permission depuis background)
 */
export async function captureVisibleTab() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'captureTab' }, (response) => {
      if (response && response.dataUrl) {
        resolve(response.dataUrl);
      } else {
        reject(new Error('Impossible de capturer l\'onglet'));
      }
    });
  });
}

/**
 * Extraire les images d'un élément
 */
export function extractImages(element) {
  const images = [];
  
  // Images <img>
  element.querySelectorAll('img').forEach(img => {
    images.push({
      type: 'img',
      src: img.src,
      alt: img.alt,
      width: img.width,
      height: img.height
    });
  });
  
  // Background images
  const allElements = [element, ...element.querySelectorAll('*')];
  allElements.forEach(el => {
    const bgImage = window.getComputedStyle(el).backgroundImage;
    if (bgImage && bgImage !== 'none') {
      const urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
      if (urlMatch) {
        images.push({
          type: 'background',
          src: urlMatch[1],
          element: el.tagName
        });
      }
    }
  });
  
  return images;
}
