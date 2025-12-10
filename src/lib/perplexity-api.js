/**
 * Perplexity API Client - Phase 3
 * Appels directs à l'API Perplexity sans interface
 */

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export class PerplexityAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Convertir une capture en section Shopify via l'API
   */
  async convert(captureData) {
    if (!this.apiKey) {
      throw new Error('API key Perplexity non configurée');
    }

    const prompt = this.buildPrompt(captureData);

    try {
      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-pro', // Model Pro pour Perplexity Pro
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert développeur Shopify spécialisé dans la conversion de sections web en sections Shopify Liquid. Tu génères du code propre, maintenable et conforme aux standards Shopify 2025.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2, // Bas pour plus de cohérence
          max_tokens: 8000,
          return_images: false,
          return_related_questions: false,
          search_domain_filter: ['shopify.dev', 'github.com'],
          search_recency_filter: 'month' // Dernières infos Shopify
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API Error: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      return this.parseResponse(content);

    } catch (error) {
      console.error('[Perplexity API] Erreur:', error);
      throw error;
    }
  }

  /**
   * Construire le prompt optimisé
   */
  buildPrompt(capture) {
    const { html, url, tagName, className, blockType, complexity } = capture;

    return `
CONVERSION SHOPIFY SECTION

CONTEXTE:
- Page source: ${url}
- Élément: <${tagName} class="${className}">
- Type détecté: ${blockType?.type || 'generic'}
- Complexité: ${complexity?.score || 5}/10

OBJECTIFS:
1. Générer un fichier .liquid Shopify production-ready
2. Créer un schema.json complet avec settings et blocks
3. CSS responsif (breakpoints Shopify: 750px, 990px)
4. JavaScript moderne si nécessaire

EXIGENCES SHOPIFY:
- Utiliser {{ section.settings.* }} pour les options
- Implémenter {% for block in section.blocks %} pour éléments répétables
- Ajouter {{ block.shopify_attributes }} sur chaque block
- Filters d'images: {{ 'image.jpg' | image_url: width: 800 }}
- Accessibilité WCAG AA (aria-labels, alt texts)
- Support multilingue avec {{ 'key' | t }}

FORMAT DE RÉPONSE STRICT:

\`\`\`liquid
[Code complet du fichier .liquid]
\`\`\`

\`\`\`json
[Schema.json complet et valide]
\`\`\`

\`\`\`css
[CSS optimisé si nécessaire]
\`\`\`

\`\`\`javascript
[JavaScript moderne si nécessaire]
\`\`\`

HTML CAPTURÉ:
\`\`\`html
${html.substring(0, 8000)}
\`\`\`

Génère maintenant le code Shopify complet.
`;
  }

  /**
   * Parser la réponse de l'API
   */
  parseResponse(content) {
    const extractBlock = (lang) => {
      const regex = new RegExp('```' + lang + '\\n([\\s\\S]*?)```', 'i');
      const match = content.match(regex);
      return match ? match[1].trim() : '';
    };

    return {
      liquid: extractBlock('liquid'),
      schema: extractBlock('json'),
      css: extractBlock('css'),
      js: extractBlock('javascript'),
      fullResponse: content,
      timestamp: Date.now()
    };
  }

  /**
   * Tester la connexion API
   */
  async testConnection() {
    try {
      const response = await fetch(PERPLEXITY_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Récupérer l'API key depuis le storage
 */
export async function getAPIKey() {
  const data = await chrome.storage.sync.get('perplexityAPIKey');
  return data.perplexityAPIKey || null;
}

/**
 * Sauvegarder l'API key
 */
export async function saveAPIKey(apiKey) {
  await chrome.storage.sync.set({ perplexityAPIKey: apiKey });
}

/**
 * Supprimer l'API key
 */
export async function deleteAPIKey() {
  await chrome.storage.sync.remove('perplexityAPIKey');
}
