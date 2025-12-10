/**
 * Background Service Worker v1.2.2 - Fix erreurs
 */

import { PerplexityAPI, getAPIKey } from '../lib/perplexity-api.js';
import { saveSection } from '../lib/library.js';
import { detectBlockType, analyzeComplexity } from '../lib/analyzer.js';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Shopify Converter] Extension installée - Version 1.2.2');
});

// Messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startSelectionFromPopup') {
    console.log('[Background] Démarrage sélection - mode:', message.mode);
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) {
        sendResponse({ success: false, error: 'Aucun onglet actif' });
        return;
      }
      
      console.log('[Background] Envoi au content script - tabId:', tabs[0].id);
      
      chrome.tabs.sendMessage(tabs[0].id, { 
        action: 'startSelection',
        mode: message.mode 
      }, (res) => {
        if (chrome.runtime.lastError) {
          console.error('[Background] Erreur:', chrome.runtime.lastError.message);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('[Background] Content script répond:', res);
          sendResponse(res || { success: true });
        }
      });
    });
    return true;
  }

  if (message.action === 'elementCaptured') {
    console.log('[Background] Élément capturé reçu');
    handleElementCaptured(message.data, message.mode || 'manual')
      .then(() => {
        console.log('[Background] Traitement terminé');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('[Background] Erreur handleElementCaptured:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (message.action === 'captureTabScreenshot') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('[Background] Erreur captureVisibleTab:', chrome.runtime.lastError.message);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('[Background] Screenshot capturé');
        sendResponse({ dataUrl: dataUrl });
      }
    });
    return true;
  }

  if (message.action === 'perplexity_response') {
    handlePerplexityResponse(message.data)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.action === 'perplexity_error') {
    console.error('[Perplexity] Erreur:', message.error);
    sendResponse({ success: false, error: message.error });
    return true;
  }
});

async function handleElementCaptured(captureData, mode) {
  console.log('[Background] handleElementCaptured - mode:', mode, 'screenshot:', !!captureData.screenshot);

  try {
    // Analyser la section
    const blockType = detectBlockType({ 
      tagName: captureData.tagName,
      className: captureData.className,
      outerHTML: captureData.html 
    });
    
    const complexity = analyzeComplexity({
      outerHTML: captureData.html,
      querySelectorAll: () => []
    });

    // Enrichir les données
    captureData.blockType = blockType;
    captureData.complexity = complexity;

    // Sauvegarder
    await chrome.storage.local.set({ 
      lastCapture: captureData,
      capturedElement: captureData
    });

    console.log('[Background] Données sauvegardées:', {
      blockType: blockType.type,
      complexity: complexity.score,
      hasScreenshot: !!captureData.screenshot,
      htmlLength: captureData.html.length
    });

    // Router selon le mode
    if (mode === 'api') {
      await convertWithPerplexityAPI(captureData);
    } else if (mode === 'auto') {
      await convertWithPerplexityAuto(captureData);
    } else {
      // Mode manuel
      console.log('[Background] Ouverture du bridge manuel...');
      await chrome.windows.create({
        url: chrome.runtime.getURL('src/popup/perplexity-bridge.html'),
        type: 'popup',
        width: 900,
        height: 700,
        focused: true
      });
    }
  } catch (error) {
    console.error('[Background] Erreur dans handleElementCaptured:', error);
    // Sauvegarder quand même
    await chrome.storage.local.set({ 
      lastCapture: captureData,
      capturedElement: captureData
    });
    // Fallback vers mode manuel
    await chrome.windows.create({
      url: chrome.runtime.getURL('src/popup/perplexity-bridge.html'),
      type: 'popup',
      width: 900,
      height: 700,
      focused: true
    });
  }
}

async function convertWithPerplexityAPI(captureData) {
  try {
    console.log('[Perplexity API] Démarrage conversion...');

    const apiKey = await getAPIKey();
    if (!apiKey) {
      throw new Error('API key non configurée');
    }

    const api = new PerplexityAPI(apiKey);
    const result = await api.convert(captureData);

    await chrome.storage.local.set({ lastConversion: result });

    await saveSection({
      name: `Section ${captureData.blockType?.type || 'generic'}`,
      url: captureData.url,
      blockType: captureData.blockType,
      complexity: captureData.complexity,
      liquid: result.liquid,
      schema: result.schema,
      css: result.css,
      js: result.js,
      thumbnail: captureData.screenshot?.dataUrl,
      conversionMethod: 'api'
    });

    await chrome.windows.create({
      url: chrome.runtime.getURL('src/popup/review.html'),
      type: 'popup',
      width: 1000,
      height: 700,
      focused: true
    });

  } catch (error) {
    console.error('[Perplexity API] Erreur:', error);
    await chrome.windows.create({
      url: chrome.runtime.getURL('src/popup/perplexity-bridge.html'),
      type: 'popup',
      width: 900,
      height: 700,
      focused: true
    });
  }
}

async function convertWithPerplexityAuto(captureData) {
  try {
    console.log('[Perplexity Auto] Démarrage conversion automatique...');

    const perplexityTab = await findOrCreatePerplexityTab();
    const prompt = buildPromptWithScreenshot(captureData);

    await chrome.storage.local.set({
      pendingConversion: {
        prompt: prompt,
        screenshot: captureData.screenshot,
        timestamp: Date.now()
      }
    });

    console.log('[Perplexity Auto] Injection du script...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    await chrome.scripting.executeScript({
      target: { tabId: perplexityTab.id },
      func: submitToPerplexity,
      args: [prompt, captureData.screenshot?.dataUrl]
    });

    console.log('[Perplexity Auto] Script injecté');

  } catch (error) {
    console.error('[Perplexity Auto] Erreur:', error);
    await chrome.windows.create({
      url: chrome.runtime.getURL('src/popup/perplexity-bridge.html'),
      type: 'popup',
      width: 900,
      height: 700,
      focused: true
    });
  }
}

async function findOrCreatePerplexityTab() {
  const tabs = await chrome.tabs.query({ url: 'https://www.perplexity.ai/*' });

  if (tabs.length > 0) {
    console.log('[Perplexity] Onglet existant');
    await chrome.tabs.update(tabs[0].id, { active: true });
    await chrome.tabs.reload(tabs[0].id);
    await new Promise(resolve => setTimeout(resolve, 3000));
    return tabs[0];
  } else {
    console.log('[Perplexity] Nouvel onglet');
    const tab = await chrome.tabs.create({
      url: 'https://www.perplexity.ai',
      active: true
    });
    await new Promise(resolve => setTimeout(resolve, 5000));
    return tab;
  }
}

function buildPromptWithScreenshot(capture) {
  const { html, url, tagName, className, blockType, complexity, screenshot } = capture;

  return `
CONVERSION SHOPIFY SECTION AVEC SCREENSHOT

${screenshot ? '📸 SCREENSHOT ATTACHÉ' : ''}

CONTEXTE:
- Page: ${url}
- Élément: <${tagName} class="${className}">
- Type: ${blockType?.type || 'generic'}
- Complexité: ${complexity?.score || 5}/10

OBJECTIFS:
1. Reproduire visuellement à l'identique
2. Générer .liquid Shopify
3. Créer schema.json complet
4. CSS responsif
5. JavaScript si nécessaire

FORMAT:
\`\`\`liquid
[Code]
\`\`\`
\`\`\`json
[Schema]
\`\`\`
\`\`\`css
[CSS]
\`\`\`
\`\`\`javascript
[JS]
\`\`\`

HTML:
\`\`\`html
${html.substring(0, 8000)}
\`\`\`
`;
}

function submitToPerplexity(prompt, screenshotDataUrl) {
  console.log('[Perplexity Injection] Exécution');

  setTimeout(async () => {
    try {
      const textarea = document.querySelector('textarea[placeholder*="Ask"]') ||
                       document.querySelector('textarea');

      if (!textarea) throw new Error('Textarea introuvable');

      textarea.value = prompt;
      textarea.focus();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      await new Promise(r => setTimeout(r, 500));

      const submitButton = document.querySelector('button[type="submit"]') ||
                          Array.from(document.querySelectorAll('button')).find(
                            btn => btn.textContent.toLowerCase().includes('ask')
                          );

      if (!submitButton) throw new Error('Bouton submit introuvable');

      submitButton.click();
      console.log('[Perplexity Injection] Prompt soumis');

    } catch (error) {
      console.error('[Perplexity Injection] Erreur:', error);
    }
  }, 1000);
}

async function handlePerplexityResponse(data) {
  console.log('[Perplexity] Réponse reçue');
  await chrome.storage.local.set({ lastConversion: data });

  const capture = await chrome.storage.local.get('lastCapture');
  if (capture.lastCapture) {
    await saveSection({
      name: `Section ${capture.lastCapture.blockType?.type || 'generic'}`,
      url: capture.lastCapture.url,
      blockType: capture.lastCapture.blockType,
      complexity: capture.lastCapture.complexity,
      liquid: data.liquid,
      schema: data.schema,
      css: data.css,
      js: data.js,
      thumbnail: capture.lastCapture.screenshot?.dataUrl,
      conversionMethod: 'auto'
    });
  }

  await chrome.windows.create({
    url: chrome.runtime.getURL('src/popup/review.html'),
    type: 'popup',
    width: 1000,
    height: 700,
    focused: true
  });
}
