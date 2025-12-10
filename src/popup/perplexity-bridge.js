// Bridge manuel Perplexity - Phase 1 MVP

function buildPromptFromCapture(capture) {
  const html = capture.html || '';
  const url = capture.url || '';
  const tag = capture.tagName || '';
  const classes = capture.className || '';

  return [
    'Tu es un expert développeur Shopify. Je vais te donner une section HTML que je veux convertir en section Shopify Liquid.',
    '',
    `Page source: ${url}`,
    `Élément sélectionné: <${tag} class="${classes}">`,
    '',
    'Ton objectif :',
    '- Générer un fichier .liquid de section Shopify prêt à l’emploi.',
    '- Générer un schema.json complet pour la section.',
    '- Rendre le tout responsif et propre.',
    '',
    'Retourne ta réponse UNIQUEMENT sous ces 4 blocs de code dans cet ordre :',
    '```liquid',
    '[Code complet du fichier .liquid]',
    '```',
    '```json',
    '[Schema.json complet]',
    '```',
    '```css',
    '[CSS optionnel]',
    '```',
    '```javascript',
    '[JS optionnel]',
    '```',
    '',
    'Voici le HTML capturé :',
    '```html',
    html,
    '```'
  ].join('\n');
}

function parsePerplexityResponse(response) {
  function extractBlock(lang) {
    const regex = new RegExp('```' + lang + '\n([\s\S]*?)```', 'i');
    const match = response.match(regex);
    return match ? match[1].trim() : '';
  }

  return {
    liquid: extractBlock('liquid'),
    schema: extractBlock('json'),
    css: extractBlock('css'),
    js: extractBlock('javascript'),
    fullResponse: response
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.local.get('lastCapture');
  const capture = data.lastCapture;

  if (!capture) {
    document.body.innerHTML = '<div class="container"><h2>Aucune capture trouvée. Relance une capture.</h2></div>';
    return;
  }

  const prompt = buildPromptFromCapture(capture);
  const promptTextarea = document.getElementById('prompt');
  const screenshotsContainer = document.getElementById('screenshots');

  promptTextarea.value = prompt;

  // Simuler 3 "screenshots" textuels pour Phase 1 (vu que la capture réelle viendra plus tard)
  const labels = ['Desktop', 'Tablet', 'Mobile'];
  labels.forEach((label) => {
    const div = document.createElement('div');
    div.className = 'screenshot-item';
    div.innerHTML = `
      <div class="screenshot-label">${label}</div>
      <div>
        Viewport: ${window.innerWidth}×${window.innerHeight}<br/>
        Rect: ${Math.round(capture.boundingBox.width)}×${Math.round(capture.boundingBox.height)}
      </div>
    `;
    screenshotsContainer.appendChild(div);
  });

  // Copier le prompt
  document.getElementById('copyPrompt').addEventListener('click', async () => {
    await navigator.clipboard.writeText(prompt);
    const btn = document.getElementById('copyPrompt');
    btn.textContent = '✅ Copié !';
    document.querySelectorAll('.status')[0].textContent = 'Fait';
    document.querySelectorAll('.status')[0].className = 'status done';
    setTimeout(() => { btn.textContent = '📋 Copier le Prompt'; }, 2000);
  });

  // Ouvrir Perplexity
  document.getElementById('openPerplexity').addEventListener('click', () => {
    window.open('https://www.perplexity.ai', '_blank');
  });

  // Traiter la réponse
  document.getElementById('processResponse').addEventListener('click', () => {
    const response = document.getElementById('response').value;
    const statusDiv = document.getElementById('processingStatus');

    if (!response.trim()) {
      alert('Colle la réponse de Perplexity avant de continuer.');
      return;
    }

    statusDiv.innerHTML = '<div class="info-box">Traitement de la réponse...</div>';

    try {
      const parsed = parsePerplexityResponse(response);

      if (!parsed.liquid && !parsed.schema) {
        throw new Error('Aucun bloc liquid ou json trouvé dans la réponse.');
      }

      // Marquer l’étape comme terminée
      document.querySelectorAll('.status')[2].textContent = 'Fait';
      document.querySelectorAll('.status')[2].className = 'status done';

      statusDiv.innerHTML = '<div class="info-box success-box">Conversion réussie. Code prêt à être exporté.</div>';

      // Pour la Phase 1, on se contente de stocker le résultat pour un usage futur
      chrome.storage.local.set({ lastConversion: parsed });
    } catch (error) {
      statusDiv.innerHTML = `<div class="info-box" style="background:#ffebee;color:#c62828;">Erreur: ${error.message}</div>`;
    }
  });

  // Annuler
  document.getElementById('cancel').addEventListener('click', () => {
    window.close();
  });
});
