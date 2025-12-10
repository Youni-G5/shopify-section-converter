/**
 * Librairie d'analyse sémantique de blocs
 * Phase 2 - Détection intelligente du type de section
 */

/**
 * Détecter le type de bloc/section
 */
export function detectBlockType(element) {
  const patterns = {
    hero: {
      keywords: ['hero', 'banner', 'jumbotron', 'header-image', 'masthead'],
      tags: ['header', 'section'],
      score: 0
    },
    carousel: {
      keywords: ['carousel', 'slider', 'swiper', 'slideshow', 'slick'],
      tags: ['div', 'section'],
      score: 0
    },
    testimonials: {
      keywords: ['testimonial', 'review', 'quote', 'feedback', 'customer'],
      tags: ['section', 'div', 'article'],
      score: 0
    },
    features: {
      keywords: ['feature', 'benefit', 'icon-box', 'service', 'why-us'],
      tags: ['section', 'div'],
      score: 0
    },
    cta: {
      keywords: ['cta', 'call-to-action', 'signup', 'subscribe', 'get-started'],
      tags: ['section', 'div', 'aside'],
      score: 0
    },
    gallery: {
      keywords: ['gallery', 'grid', 'masonry', 'portfolio', 'showcase'],
      tags: ['section', 'div'],
      score: 0
    },
    form: {
      keywords: ['form', 'contact', 'subscribe', 'newsletter', 'signup'],
      tags: ['form', 'section'],
      score: 0
    },
    faq: {
      keywords: ['faq', 'accordion', 'collapse', 'questions', 'q-a'],
      tags: ['section', 'div', 'dl'],
      score: 0
    },
    pricing: {
      keywords: ['pricing', 'plan', 'package', 'tier', 'subscription'],
      tags: ['section', 'div'],
      score: 0
    },
    team: {
      keywords: ['team', 'member', 'staff', 'about-us', 'crew'],
      tags: ['section', 'div'],
      score: 0
    },
    blog: {
      keywords: ['blog', 'article', 'post', 'news', 'updates'],
      tags: ['article', 'section'],
      score: 0
    },
    footer: {
      keywords: ['footer', 'bottom', 'copyright', 'site-footer'],
      tags: ['footer', 'div'],
      score: 0
    }
  };

  const tagName = element.tagName.toLowerCase();
  const className = element.className.toString().toLowerCase();
  const id = element.id.toLowerCase();
  const textContent = element.textContent.substring(0, 200).toLowerCase();

  // Calculer les scores
  Object.keys(patterns).forEach(type => {
    const pattern = patterns[type];
    
    // Vérifier les tags
    if (pattern.tags.includes(tagName)) {
      pattern.score += 2;
    }
    
    // Vérifier les keywords dans class et id
    pattern.keywords.forEach(keyword => {
      if (className.includes(keyword)) pattern.score += 5;
      if (id.includes(keyword)) pattern.score += 5;
      if (textContent.includes(keyword)) pattern.score += 1;
    });
    
    // Bonus pour la structure HTML spécifique
    if (type === 'carousel' && element.querySelector('.slide, .swiper-slide, .carousel-item')) {
      pattern.score += 10;
    }
    if (type === 'gallery' && element.querySelectorAll('img').length > 3) {
      pattern.score += 8;
    }
    if (type === 'form' && element.querySelector('form')) {
      pattern.score += 10;
    }
    if (type === 'faq' && element.querySelectorAll('.accordion, details, .collapse').length > 0) {
      pattern.score += 10;
    }
  });

  // Trouver le type avec le score le plus élevé
  let detectedType = 'generic';
  let maxScore = 0;

  Object.keys(patterns).forEach(type => {
    if (patterns[type].score > maxScore) {
      maxScore = patterns[type].score;
      detectedType = type;
    }
  });

  // Si score trop faible, considérer comme générique
  if (maxScore < 5) {
    detectedType = 'generic';
  }

  return {
    type: detectedType,
    confidence: Math.min(maxScore / 20, 1), // Normaliser entre 0 et 1
    scores: patterns
  };
}

/**
 * Analyser la complexité d'un élément
 */
export function analyzeComplexity(element) {
  const depth = calculateDOMDepth(element);
  const elementCount = element.querySelectorAll('*').length;
  const uniqueTags = new Set([...element.querySelectorAll('*')].map(el => el.tagName)).size;
  const hasJS = element.querySelector('script') !== null;
  const hasVideo = element.querySelector('video, iframe[src*="youtube"], iframe[src*="vimeo"]') !== null;
  const imageCount = element.querySelectorAll('img').length;
  
  let score = 0;
  
  // Profondeur DOM
  if (depth > 10) score += 3;
  else if (depth > 5) score += 2;
  else score += 1;
  
  // Nombre d'éléments
  if (elementCount > 100) score += 3;
  else if (elementCount > 50) score += 2;
  else score += 1;
  
  // Diversité des tags
  if (uniqueTags > 15) score += 2;
  else if (uniqueTags > 10) score += 1;
  
  // Fonctionnalités spéciales
  if (hasJS) score += 2;
  if (hasVideo) score += 2;
  if (imageCount > 10) score += 2;
  
  return {
    score: Math.min(score, 10), // Max 10
    depth: depth,
    elementCount: elementCount,
    uniqueTags: uniqueTags,
    hasJavaScript: hasJS,
    hasVideo: hasVideo,
    imageCount: imageCount,
    difficulty: score < 4 ? 'easy' : score < 7 ? 'medium' : 'hard'
  };
}

function calculateDOMDepth(element, currentDepth = 0) {
  const children = element.children;
  if (children.length === 0) return currentDepth;
  
  let maxDepth = currentDepth;
  for (let child of children) {
    const childDepth = calculateDOMDepth(child, currentDepth + 1);
    maxDepth = Math.max(maxDepth, childDepth);
  }
  
  return maxDepth;
}

/**
 * Analyser le responsive design
 */
export function analyzeResponsive(element) {
  const styles = window.getComputedStyle(element);
  const breakpoints = [];
  
  // Détecter les media queries appliquées
  const sheets = document.styleSheets;
  for (let sheet of sheets) {
    try {
      const rules = sheet.cssRules || sheet.rules;
      for (let rule of rules) {
        if (rule.type === CSSRule.MEDIA_RULE) {
          breakpoints.push(rule.conditionText);
        }
      }
    } catch (e) {
      // CORS peut bloquer l'accès à certaines stylesheets
    }
  }
  
  return {
    usesFlexbox: styles.display === 'flex' || hasFlexChildren(element),
    usesCSSGrid: styles.display === 'grid' || hasGridChildren(element),
    breakpoints: [...new Set(breakpoints)],
    isResponsive: breakpoints.length > 0 || styles.display === 'flex' || styles.display === 'grid'
  };
}

function hasFlexChildren(element) {
  return Array.from(element.children).some(child => 
    window.getComputedStyle(child).display === 'flex'
  );
}

function hasGridChildren(element) {
  return Array.from(element.children).some(child => 
    window.getComputedStyle(child).display === 'grid'
  );
}
