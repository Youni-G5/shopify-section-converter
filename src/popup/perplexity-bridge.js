/**
 * Bridge manuel Perplexity - HTML complet
 */

function buildPromptFromCapture(capture) {
  const { html, url, tagName, className, blockType, complexity, screenshot, computedStyle } = capture;

  // Extraire les styles CSS importants
  const importantStyles = extractImportantStyles(computedStyle);

  return `
CONVERSION SHOPIFY SECTION AVEC SCREENSHOT

${screenshot ? '📸 UN SCREENSHOT PROPRE DE LA SECTION EST DISPONIBLE. Utilise-le pour reproduire le design à l\'identique.' : ''}

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

STYLES CSS APPLIQUÉS (référence):
\`\`\`css
${importantStyles}
\`\`\`

HTML COMPLET DE LA SECTION:
\`\`\`html
${html}
\`\`\`

Génère maintenant le code Shopify en respectant le screenshot attaché.
`;
}

function extractImportantStyles(computedStyle) {
  if (!computedStyle) return '/* Pas de styles capturés */';

  const important = [
    'display', 'position', 'width', 'height', 'max-width', 'max-height',
    'padding', 'margin', 'background', 'background-color', 'color',
    'font-family', 'font-size', 'font-weight', 'line-height',
    'text-align', 'border', 'border-radius', 'box-shadow',
    'flex-direction', 'justify-content', 'align-items', 'gap',
    'grid-template-columns', 'grid-gap'
  ];

  let css = '';
  for (let prop of important) {
    if (computedStyle[prop] && computedStyle[prop] !== 'none' && computedStyle[prop] !== 'normal') {
      css += `  ${prop}: ${computedStyle[prop]};\n`;
    }
  }

  return css || '/* Styles par défaut */';
}

function parsePerplexityResponse(response) {
  function extractBlock(lang) {
    const regex = new RegExp('```' + lang + '\\n([\\s\\S]*?)```', 'i');
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

  console.log('[Bridge] Données de capture:', {
    hasScreenshot: !!capture.screenshot,
    blockType: capture.blockType?.type,
    complexity: capture.complexity?.score,
    htmlLength: capture.html?.length,
    htmlComplete: !capture.html?.includes('... (tronqué)')
  });

  const prompt = buildPromptFromCapture(capture);
  const promptTextarea = document.getElementById('prompt');
  const screenshotsContainer = document.getElementById('screenshots');

  promptTextarea.value = prompt;

  // Afficher le screenshot capturé (PROPRE maintenant)
  if (capture.screenshot && capture.screenshot.dataUrl) {
    const screenshotDiv = document.createElement('div');
    screenshotDiv.className = 'screenshot-item';
    screenshotDiv.innerHTML = `
      <div class="screenshot-label">📸 Screenshot capturé (propre, sans UI)</div>
      <img src="${capture.screenshot.dataUrl}" alt="Section capturée" style="width: 100%; border-radius: 8px; border: 1px solid #ddd;" />
      <div style="margin-top: 8px; font-size: 12px; color: #666;">
        Dimensions: ${capture.screenshot.naturalWidth} × ${capture.screenshot.naturalHeight}px<br/>
        Taille: ${capture.screenshot.size}
      </div>
    `;
    screenshotsContainer.appendChild(screenshotDiv);
  } else {
    screenshotsContainer.innerHTML = '<div class="info-box">⚠️ Aucun screenshot disponible pour cette capture.</div>';
  }

  // Informations sur le HTML
  const htmlInfo = document.createElement('div');
  htmlInfo.className = 'info-box';
  htmlInfo.style.marginTop = '16px';
  htmlInfo.innerHTML = `
    <strong>✅ Capture complète :</strong><br/>
    • Type détecté: ${capture.blockType?.type || 'generic'} (${Math.round((capture.blockType?.confidence || 0) * 100)}% confiance)<br/>
    • Complexité: ${capture.complexity?.score || 'N/A'}/10<br/>
    • Tag: &lt;${capture.tagName}&gt;<br/>
    • HTML: ${capture.html?.length || 0} caractères (${capture.html?.includes('... (tronqué)') ? '⚠️ tronqué' : '✅ complet'})<br/>
    • Source: ${capture.url}
  `;
  screenshotsContainer.appendChild(htmlInfo);

  // Copier le prompt
  document.getElementById('copyPrompt').addEventListener('click', async () => {
    await navigator.clipboard.writeText(prompt);
    const btn = document.getElementById('copyPrompt');
    btn.textContent = '✅ Copié !';
    document.querySelectorAll('.status')[0].textContent = 'Fait';
    document.querySelectorAll('.status')[0].className = 'status done';
    setTimeout(() => { btn.textContent = '📋 Copier le Prompt'; }, 2000);
  });

  // Ouvrir Perplexity avec instruction
  document.getElementById('openPerplexity').addEventListener('click', async () => {
    window.open('https://www.perplexity.ai', '_blank');
    
    document.querySelectorAll('.status')[1].textContent = 'Fait';
    document.querySelectorAll('.status')[1].className = 'status done';

    if (capture.screenshot && capture.screenshot.dataUrl) {
      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'btn btn-primary';
      downloadBtn.style.marginTop = '12px';
      downloadBtn.textContent = '💾 Télécharger le Screenshot';
      downloadBtn.onclick = () => {
        const link = document.createElement('a');
        link.href = capture.screenshot.dataUrl;
        link.download = `shopify-section-${Date.now()}.png`;
        link.click();
      };
      
      const instructionDiv = document.createElement('div');
      instructionDiv.className = 'info-box';
      instructionDiv.style.marginTop = '16px';
      instructionDiv.style.background = '#e3f2fd';
      instructionDiv.innerHTML = `
        <strong>👉 IMPORTANT :</strong><br/>
        1. Colle le prompt dans Perplexity<br/>
        2. Télécharge le screenshot ci-dessous<br/>
        3. Attache-le à ta question Perplexity (📎 bouton clip)<br/>
        4. Envoie la question
      `;
      
      const container = document.getElementById('screenshots');
      container.appendChild(instructionDiv);
      container.appendChild(downloadBtn);
    }
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

      document.querySelectorAll('.status')[2].textContent = 'Fait';
      document.querySelectorAll('.status')[2].className = 'status done';

      statusDiv.innerHTML = `
        <div class="info-box success-box">
          <strong>✅ Conversion réussie !</strong><br/>
          • Liquid: ${parsed.liquid ? parsed.liquid.split('\n').length + ' lignes' : 'Non trouvé'}<br/>
          • Schema: ${parsed.schema ? 'Présent' : 'Non trouvé'}<br/>
          • CSS: ${parsed.css ? parsed.css.split('\n').length + ' lignes' : 'Non trouvé'}<br/>
          • JS: ${parsed.js ? parsed.js.split('\n').length + ' lignes' : 'Non trouvé'}<br/><br/>
          Code prêt à être exporté dans la bibliothèque.
        </div>
      `;

      chrome.storage.local.set({ 
        lastConversion: parsed,
        lastConversionTimestamp: Date.now()
      });

      const openLibBtn = document.createElement('button');
      openLibBtn.className = 'btn btn-primary';
      openLibBtn.style.marginTop = '12px';
      openLibBtn.textContent = '📚 Ouvrir la Bibliothèque';
      openLibBtn.onclick = () => {
        chrome.runtime.openOptionsPage();
      };
      statusDiv.appendChild(openLibBtn);

    } catch (error) {
      statusDiv.innerHTML = `<div class="info-box" style="background:#ffebee;color:#c62828;">Erreur: ${error.message}</div>`;
    }
  });

  document.getElementById('cancel').addEventListener('click', () => {
    window.close();
  });
});
