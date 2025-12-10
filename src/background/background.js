/**
 * Background Service Worker - Fix manuel mode
 */

import { PerplexityAPI, getAPIKey } from '../lib/perplexity-api.js';
import { saveSection } from '../lib/library.js';
import { detectBlockType, analyzeComplexity } from '../lib/analyzer.js';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Shopify Converter] Extension installée - Version 1.1.6');
});

// Messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startSelectionFromPopup') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) {
        sendResponse({ success: false, error: 'Aucun onglet actif' });
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, { 
        action: 'startSelection',
        mode: message.mode 
      }, (res) => {
        if (chrome.runtime.lastError) {
          console.error('[Background] Erreur sendMessage:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse(res || { success: true });
        }
      });
    });
    return true;
  }

  if (message.action === 'elementCaptured') {
    handleElementCaptured(message.data, message.mode || 'manual')
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error('[Background] Erreur handleElementCaptured:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (message.action === 'captureTabScreenshot') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('[Background] Erreur captureVisibleTab:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
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
  console.log('[Shopify Converter] elementCaptured - mode:', mode, 'screenshot:', captureData.screenshot ? 'OUI' : 'NON');

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

    // IMPORTANT: Stocker avec la clé correcte pour le bridge
    await chrome.storage.local.set({ 
      lastCapture: captureData,
      // Aussi sauvegarder pour compatibilité
      capturedElement: captureData
    });

    console.log('[Background] Données sauvegardées:', {
      blockType: blockType.type,
      complexity: complexity.score,
      hasScreenshot: !!captureData.screenshot
    });

    // Router selon le mode
    if (mode === 'api') {
      await convertWithPerplexityAPI(captureData);
    } else if (mode === 'auto') {
      await convertWithPerplexityAuto(captureData);
    } else {
      // Mode manuel - ouvrir directement le bridge
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
    // Sauvegarder quand même les données de base
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

    console.log('[Perplexity Auto] Onglet Perplexity prêt, injection du script...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    await chrome.scripting.executeScript({
      target: { tabId: perplexityTab.id },
      func: submitToPerplexity,
      args: [prompt, captureData.screenshot?.dataUrl]
    });

    console.log('[Perplexity Auto] Script injecté avec succès');

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
    console.log('[Perplexity] Onglet existant trouvé, activation...');
    await chrome.tabs.update(tabs[0].id, { active: true });
    await chrome.tabs.reload(tabs[0].id);
    await new Promise(resolve => setTimeout(resolve, 3000));
    return tabs[0];
  } else {
    console.log('[Perplexity] Création d\'un nouvel onglet...');
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

${screenshot ? '📸 UN SCREENSHOT DE LA SECTION EST ATTACHÉ. Utilise-le pour reproduire le design à l\'identique.' : ''}

CONTEXTE:
- Page source: ${url}
- Élément: <${tagName} class="${className}">
- Type détecté: ${blockType?.type || 'generic'} (confiance: ${Math.round((blockType?.confidence || 0) * 100)}%)
- Complexité: ${complexity?.score || 5}/10
- Dimensions: ${screenshot ? `${screenshot.naturalWidth}x${screenshot.naturalHeight}px` : 'N/A'}

OBJECTIFS:
1. REPRODUIRE VISUELLEMENT la section à l'identique en te basant sur le screenshot
2. Générer un fichier .liquid Shopify production-ready
3. Créer un schema.json complet avec settings et blocks
4. CSS responsif (breakpoints Shopify: 750px, 990px)
5. JavaScript moderne si nécessaire

EXIGENCES SHOPIFY:
- Utiliser {{ section.settings.* }} pour les options éditables
- Implémenter {% for block in section.blocks %} pour éléments répétables
- Ajouter {{ block.shopify_attributes }} sur chaque block
- Filters d'images: {{ 'image.jpg' | image_url: width: 800 }}
- Accessibilité WCAG AA (aria-labels, alt texts complets)
- Support multilingue avec {{ 'key' | t }}

FIDÉLITÉ VISUELLE:
- Reproduis exactement les couleurs, typographie, espacements du screenshot
- Respecte la hiérarchie visuelle et les proportions
- Gère le responsive design intelligemment

FORMAT DE RÉPONSE STRICT:

\`\`\`liquid
[Code complet du fichier .liquid]
\`\`\`

\`\`\`json
[Schema.json complet et valide]
\`\`\`

\`\`\`css
[CSS optimisé reproduisant le design du screenshot]
\`\`\`

\`\`\`javascript
[JavaScript moderne si nécessaire]
\`\`\`

HTML CAPTURÉ (référence structure):
\`\`\`html
${html.substring(0, 6000)}
\`\`\`

Génère maintenant le code Shopify en respectant le screenshot.
`;
}

function submitToPerplexity(prompt, screenshotDataUrl) {
  console.log('[Perplexity Injection] Script exécuté');

  setTimeout(async () => {
    try {
      const textarea = document.querySelector('textarea[placeholder*="Ask"]') ||
                       document.querySelector('textarea[aria-label*="Ask"]') ||
                       document.querySelector('textarea');

      if (!textarea) {
        throw new Error('Textarea introuvable');
      }

      textarea.value = prompt;
      textarea.focus();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      await new Promise(r => setTimeout(r, 500));

      const submitButton = document.querySelector('button[type="submit"]') ||
                          document.querySelector('button[aria-label*="Send"]') ||
                          Array.from(document.querySelectorAll('button')).find(
                            btn => btn.textContent.trim().toLowerCase().includes('ask')
                          );

      if (!submitButton) {
        throw new Error('Bouton submit introuvable');
      }

      submitButton.click();
      console.log('[Perplexity Injection] Prompt soumis');

      observePerplexityResponse();

    } catch (error) {
      console.error('[Perplexity Injection] Erreur:', error);
      chrome.runtime.sendMessage({
        action: 'perplexity_error',
        error: error.message
      });
    }
  }, 1000);
}

function observePerplexityResponse() {
  let responseStarted = false;
  let lastContent = '';
  let stableCount = 0;

  const observer = new MutationObserver(() => {
    const responseElement = document.querySelector('[data-testid="answer-container"]') ||
                           document.querySelector('.prose') ||
                           document.querySelector('[class*="answer"]');

    if (!responseElement) return;

    const currentContent = responseElement.textContent;

    if (!responseStarted && currentContent.trim().length > 0) {
      responseStarted = true;
      console.log('[Perplexity Observer] Réponse démarrée');
    }

    if (currentContent === lastContent) {
      stableCount++;
    } else {
      stableCount = 0;
      lastContent = currentContent;
    }

    if (responseStarted && stableCount >= 3) {
      observer.disconnect();
      console.log('[Perplexity Observer] Réponse complète');

      const extractedCode = extractCodeFromResponse(responseElement);

      chrome.runtime.sendMessage({
        action: 'perplexity_response',
        data: extractedCode
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  setTimeout(() => {
    observer.disconnect();
    chrome.runtime.sendMessage({
      action: 'perplexity_error',
      error: 'Timeout: La réponse a pris trop de temps'
    });
  }, 120000);
}

function extractCodeFromResponse(element) {
  const fullText = element.innerText;

  function extractBlock(lang) {
    const regex = new RegExp('```' + lang + '\\n([\\s\\S]*?)```', 'i');
    const match = fullText.match(regex);
    return match ? match[1].trim() : '';
  }

  return {
    liquid: extractBlock('liquid'),
    schema: extractBlock('json'),
    css: extractBlock('css'),
    js: extractBlock('javascript'),
    fullResponse: fullText
  };
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
