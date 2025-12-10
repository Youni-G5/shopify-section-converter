/**
 * Background Service Worker - Phase 2
 * - Mode automatique Perplexity
 * - Injection et observation
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Shopify Converter] Extension installée - Phase 2');
});

// Messages provenant du popup ou du content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startSelectionFromPopup') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: 'startSelection' }, (res) => {
        sendResponse(res || { success: true });
      });
    });
    return true;
  }

  if (message.action === 'elementCaptured') {
    handleElementCaptured(message.data, message.mode || 'manual')
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.action === 'perplexity_response') {
    // Réponse du script d'observation Perplexity
    handlePerplexityResponse(message.data)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.action === 'perplexity_error') {
    console.error('[Perplexity Auto] Erreur:', message.error);
    sendResponse({ success: false, error: message.error });
    return true;
  }
});

async function handleElementCaptured(captureData, mode) {
  console.log('[Shopify Converter] elementCaptured - mode:', mode);

  await chrome.storage.local.set({ lastCapture: captureData });

  if (mode === 'auto') {
    // Mode automatique: injection dans Perplexity
    await convertWithPerplexityAuto(captureData);
  } else {
    // Mode manuel: ouvrir le bridge
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

    // 1. Trouver ou créer un onglet Perplexity
    const perplexityTab = await findOrCreatePerplexityTab();

    // 2. Construire le prompt
    const prompt = buildPromptFromCapture(captureData);

    // 3. Stocker pour l'injection
    await chrome.storage.local.set({
      pendingConversion: {
        prompt: prompt,
        timestamp: Date.now()
      }
    });

    // 4. Injecter le script d'automatisation
    await chrome.scripting.executeScript({
      target: { tabId: perplexityTab.id },
      func: submitToPerplexity,
      args: [prompt]
    });

    console.log('[Perplexity Auto] Script injecté, en attente de la réponse...');

  } catch (error) {
    console.error('[Perplexity Auto] Erreur:', error);
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

async function findOrCreatePerplexityTab() {
  const tabs = await chrome.tabs.query({ url: 'https://www.perplexity.ai/*' });

  if (tabs.length > 0) {
    // Utiliser l'onglet existant
    await chrome.tabs.update(tabs[0].id, { active: true });
    await new Promise(resolve => setTimeout(resolve, 1000));
    return tabs[0];
  } else {
    // Créer un nouvel onglet
    const tab = await chrome.tabs.create({
      url: 'https://www.perplexity.ai',
      active: true
    });
    await new Promise(resolve => setTimeout(resolve, 3000)); // Attendre chargement
    return tab;
  }
}

function buildPromptFromCapture(capture) {
  const html = capture.html || '';
  const url = capture.url || '';
  const tag = capture.tagName || '';
  const classes = capture.className || '';

  return [
    'Tu es un expert développeur Shopify. Convertis cette section HTML en section Shopify Liquid complète.',
    '',
    `Page source: ${url}`,
    `Élément: <${tag} class="${classes}">`,
    '',
    'Objectifs:',
    '1. Fichier .liquid avec syntaxe Shopify ({{ section.settings.* }}, {% for block in section.blocks %})',
    '2. Schema.json complet avec settings, blocks, presets',
    '3. CSS responsif optimisé (breakpoints 750px, 990px)',
    '4. JavaScript moderne si nécessaire',
    '',
    'FORMAT OBLIGATOIRE:',
    '```liquid',
    '[code]',
    '```',
    '```json',
    '[schema]',
    '```',
    '```css',
    '[styles]',
    '```',
    '```javascript',
    '[script]',
    '```',
    '',
    'HTML capturé:',
    '```html',
    html.substring(0, 5000), // Limiter pour éviter dépassement
    '```'
  ].join('\n');
}

// Fonction injectée dans Perplexity
function submitToPerplexity(prompt) {
  console.log('[Perplexity Injection] Script exécuté');

  // Attendre que la page soit prête
  setTimeout(async () => {
    try {
      // Trouver le textarea
      const textarea = document.querySelector('textarea[placeholder*="Ask"]') ||
                       document.querySelector('textarea[aria-label*="Ask"]') ||
                       document.querySelector('textarea');

      if (!textarea) {
        throw new Error('Textarea introuvable');
      }

      // Remplir le textarea
      textarea.value = prompt;
      textarea.focus();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));

      await new Promise(r => setTimeout(r, 500));

      // Trouver et cliquer sur le bouton submit
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

      // Démarrer l'observation de la réponse
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

// Observer la réponse (injecté via submitToPerplexity)
function observePerplexityResponse() {
  let responseStarted = false;
  let lastContent = '';
  let stableCount = 0;

  const observer = new MutationObserver(() => {
    // Chercher l'élément de réponse
    const responseElement = document.querySelector('[data-testid="answer-container"]') ||
                           document.querySelector('.prose') ||
                           document.querySelector('[class*="answer"]');

    if (!responseElement) return;

    const currentContent = responseElement.textContent;

    if (!responseStarted && currentContent.trim().length > 0) {
      responseStarted = true;
      console.log('[Perplexity Observer] Réponse démarrée');
    }

    // Détecter la stabilité (contenu ne change plus)
    if (currentContent === lastContent) {
      stableCount++;
    } else {
      stableCount = 0;
      lastContent = currentContent;
    }

    // Si stable pendant 3 itérations (~3s), considérer terminé
    if (responseStarted && stableCount >= 3) {
      observer.disconnect();
      console.log('[Perplexity Observer] Réponse complète');

      // Extraire le code
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

  // Timeout de sécurité (2 minutes)
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
  console.log('[Perplexity Auto] Réponse reçue');

  // Stocker la conversion
  await chrome.storage.local.set({ lastConversion: data });

  // Ouvrir le panel de review
  await chrome.windows.create({
    url: chrome.runtime.getURL('src/popup/review.html'),
    type: 'popup',
    width: 1000,
    height: 700,
    focused: true
  });
}
