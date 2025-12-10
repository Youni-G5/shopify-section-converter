/**
 * Content Script - Correction capture propre + HTML complet
 */

import { detectBlockType } from '../lib/analyzer.js';

let isSelecting = false;
let currentMode = 'manual';
let overlay = null;
let highlightBox = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startSelection') {
    currentMode = message.mode || 'manual';
    startSelection();
    sendResponse({ success: true });
  }
  return true;
});

function startSelection() {
  if (isSelecting) return;
  isSelecting = true;

  createOverlay();
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeyDown);
}

function createOverlay() {
  // Overlay semi-transparent
  overlay = document.createElement('div');
  overlay.id = 'shopify-converter-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    z-index: 999998;
    cursor: crosshair;
    pointer-events: none;
  `;
  document.body.appendChild(overlay);

  // Box de highlight
  highlightBox = document.createElement('div');
  highlightBox.id = 'shopify-converter-highlight';
  highlightBox.style.cssText = `
    position: absolute;
    border: 3px solid #00ff00;
    background: rgba(0, 255, 0, 0.1);
    pointer-events: none;
    z-index: 999999;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 255, 0, 0.5);
    transition: all 0.1s ease;
  `;
  document.body.appendChild(highlightBox);
}

function handleMouseMove(e) {
  if (!isSelecting) return;

  const element = document.elementFromPoint(e.clientX, e.clientY);
  if (!element || element === overlay || element === highlightBox) return;

  const rect = element.getBoundingClientRect();
  highlightBox.style.left = rect.left + window.scrollX + 'px';
  highlightBox.style.top = rect.top + window.scrollY + 'px';
  highlightBox.style.width = rect.width + 'px';
  highlightBox.style.height = rect.height + 'px';
}

async function handleClick(e) {
  if (!isSelecting) return;

  e.preventDefault();
  e.stopPropagation();

  const element = document.elementFromPoint(e.clientX, e.clientY);
  if (!element || element === overlay || element === highlightBox) return;

  // IMPORTANT: Masquer l'UI AVANT la capture
  if (overlay) overlay.style.display = 'none';
  if (highlightBox) highlightBox.style.display = 'none';

  // Attendre que le DOM se mette à jour
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    await captureElement(element);
  } catch (error) {
    console.error('[Content] Erreur capture:', error);
  }

  cleanup();
}

function handleKeyDown(e) {
  if (e.key === 'Escape') {
    cleanup();
  }
}

async function captureElement(element) {
  const rect = element.getBoundingClientRect();

  // Capturer le screenshot SANS l'overlay
  let screenshotData = null;
  try {
    const response = await chrome.runtime.sendMessage({ action: 'captureTabScreenshot' });
    if (response && response.dataUrl) {
      screenshotData = await cropScreenshot(response.dataUrl, rect);
    }
  } catch (error) {
    console.warn('[Content] Screenshot failed:', error);
  }

  // Extraire le HTML COMPLET (sans limite)
  const html = element.outerHTML;
  console.log('[Content] HTML capturé:', html.length, 'caractères');

  // Extraire le CSS appliqué
  const computedStyle = window.getComputedStyle(element);
  const cssProps = {};
  for (let prop of computedStyle) {
    cssProps[prop] = computedStyle.getPropertyValue(prop);
  }

  const captureData = {
    html: html, // HTML COMPLET, pas de troncature
    url: window.location.href,
    tagName: element.tagName,
    className: element.className,
    id: element.id,
    boundingBox: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left
    },
    computedStyle: cssProps,
    screenshot: screenshotData,
    timestamp: Date.now()
  };

  console.log('[Content] Envoi au background - HTML:', html.length, 'chars, Screenshot:', !!screenshotData);

  chrome.runtime.sendMessage({
    action: 'elementCaptured',
    data: captureData,
    mode: currentMode
  });
}

async function cropScreenshot(dataUrl, rect) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const dpr = window.devicePixelRatio || 1;
      const cropX = rect.left * dpr;
      const cropY = rect.top * dpr;
      const cropWidth = rect.width * dpr;
      const cropHeight = rect.height * dpr;

      canvas.width = cropWidth;
      canvas.height = cropHeight;

      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );

      const croppedDataUrl = canvas.toDataURL('image/png');
      const sizeKB = Math.round((croppedDataUrl.length * 0.75) / 1024);

      resolve({
        dataUrl: croppedDataUrl,
        naturalWidth: rect.width,
        naturalHeight: rect.height,
        size: `${sizeKB} KB`
      });
    };
    img.src = dataUrl;
  });
}

function cleanup() {
  isSelecting = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('keydown', handleKeyDown);

  if (overlay) {
    overlay.remove();
    overlay = null;
  }
  if (highlightBox) {
    highlightBox.remove();
    highlightBox = null;
  }
}
