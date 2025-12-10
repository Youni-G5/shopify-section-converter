/**
 * Gestionnaire de bibliothèque de sections - Phase 3
 * Sauvegarde, recherche, gestion des sections capturées
 */

/**
 * Sauvegarder une section dans la bibliothèque
 */
export async function saveSection(sectionData) {
  const library = await getLibrary();
  
  const section = {
    id: generateId(),
    name: sectionData.name || `Section ${library.sections.length + 1}`,
    description: sectionData.description || '',
    tags: sectionData.tags || [],
    sourceUrl: sectionData.url,
    sourceDomain: extractDomain(sectionData.url),
    capturedDate: Date.now(),
    blockType: sectionData.blockType?.type || 'generic',
    complexity: sectionData.complexity?.score || 5,
    thumbnail: sectionData.thumbnail || null,
    files: {
      liquid: sectionData.liquid || '',
      schema: sectionData.schema || '',
      css: sectionData.css || '',
      js: sectionData.js || ''
    },
    metadata: {
      conversionMethod: sectionData.conversionMethod || 'manual',
      conversionTime: sectionData.conversionTime || 0,
      elementCount: sectionData.elementCount || 0,
      imageCount: sectionData.imageCount || 0
    },
    stats: {
      usedCount: 0,
      lastUsed: null,
      rating: 0
    }
  };
  
  library.sections.push(section);
  library.lastUpdated = Date.now();
  
  await chrome.storage.local.set({ library });
  return section;
}

/**
 * Récupérer toute la bibliothèque
 */
export async function getLibrary() {
  const data = await chrome.storage.local.get('library');
  return data.library || {
    sections: [],
    lastUpdated: Date.now(),
    version: 1
  };
}

/**
 * Récupérer une section par ID
 */
export async function getSection(id) {
  const library = await getLibrary();
  return library.sections.find(s => s.id === id);
}

/**
 * Mettre à jour une section
 */
export async function updateSection(id, updates) {
  const library = await getLibrary();
  const index = library.sections.findIndex(s => s.id === id);
  
  if (index === -1) {
    throw new Error('Section introuvable');
  }
  
  library.sections[index] = {
    ...library.sections[index],
    ...updates,
    updatedDate: Date.now()
  };
  
  library.lastUpdated = Date.now();
  await chrome.storage.local.set({ library });
  
  return library.sections[index];
}

/**
 * Supprimer une section
 */
export async function deleteSection(id) {
  const library = await getLibrary();
  library.sections = library.sections.filter(s => s.id !== id);
  library.lastUpdated = Date.now();
  await chrome.storage.local.set({ library });
}

/**
 * Rechercher des sections
 */
export async function searchSections(query, filters = {}) {
  const library = await getLibrary();
  let results = library.sections;
  
  // Filtre par texte
  if (query) {
    const lowerQuery = query.toLowerCase();
    results = results.filter(s => 
      s.name.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery) ||
      s.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
      s.sourceDomain.toLowerCase().includes(lowerQuery)
    );
  }
  
  // Filtre par type
  if (filters.blockType) {
    results = results.filter(s => s.blockType === filters.blockType);
  }
  
  // Filtre par complexité
  if (filters.complexity) {
    const [min, max] = filters.complexity;
    results = results.filter(s => s.complexity >= min && s.complexity <= max);
  }
  
  // Filtre par tags
  if (filters.tags && filters.tags.length > 0) {
    results = results.filter(s => 
      filters.tags.some(tag => s.tags.includes(tag))
    );
  }
  
  // Tri
  if (filters.sortBy) {
    results.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date-desc':
          return b.capturedDate - a.capturedDate;
        case 'date-asc':
          return a.capturedDate - b.capturedDate;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'complexity-desc':
          return b.complexity - a.complexity;
        case 'complexity-asc':
          return a.complexity - b.complexity;
        case 'used-desc':
          return b.stats.usedCount - a.stats.usedCount;
        default:
          return 0;
      }
    });
  }
  
  return results;
}

/**
 * Incrémenter le compteur d'utilisation
 */
export async function incrementUsageCount(id) {
  const library = await getLibrary();
  const section = library.sections.find(s => s.id === id);
  
  if (section) {
    section.stats.usedCount++;
    section.stats.lastUsed = Date.now();
    library.lastUpdated = Date.now();
    await chrome.storage.local.set({ library });
  }
}

/**
 * Noter une section
 */
export async function rateSection(id, rating) {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating doit être entre 1 et 5');
  }
  
  return await updateSection(id, { 'stats.rating': rating });
}

/**
 * Exporter la bibliothèque
 */
export async function exportLibrary() {
  const library = await getLibrary();
  const json = JSON.stringify(library, null, 2);
  return json;
}

/**
 * Importer une bibliothèque
 */
export async function importLibrary(json) {
  try {
    const imported = JSON.parse(json);
    
    // Validation basique
    if (!imported.sections || !Array.isArray(imported.sections)) {
      throw new Error('Format de bibliothèque invalide');
    }
    
    // Fusionner avec la bibliothèque existante
    const current = await getLibrary();
    const existingIds = new Set(current.sections.map(s => s.id));
    
    // Ajouter uniquement les nouvelles sections
    const newSections = imported.sections.filter(s => !existingIds.has(s.id));
    current.sections.push(...newSections);
    current.lastUpdated = Date.now();
    
    await chrome.storage.local.set({ library: current });
    return newSections.length;
    
  } catch (error) {
    throw new Error('Erreur lors de l\'importation: ' + error.message);
  }
}

/**
 * Obtenir les statistiques de la bibliothèque
 */
export async function getLibraryStats() {
  const library = await getLibrary();
  
  const typeCount = {};
  library.sections.forEach(s => {
    typeCount[s.blockType] = (typeCount[s.blockType] || 0) + 1;
  });
  
  return {
    totalSections: library.sections.length,
    typeDistribution: typeCount,
    totalUsage: library.sections.reduce((sum, s) => sum + s.stats.usedCount, 0),
    averageComplexity: library.sections.reduce((sum, s) => sum + s.complexity, 0) / library.sections.length || 0,
    mostUsed: library.sections.sort((a, b) => b.stats.usedCount - a.stats.usedCount).slice(0, 5),
    recentlyCaptured: library.sections.sort((a, b) => b.capturedDate - a.capturedDate).slice(0, 5)
  };
}

/**
 * Nettoyer les anciennes sections
 */
export async function cleanOldSections(daysOld = 90) {
  const library = await getLibrary();
  const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
  
  const beforeCount = library.sections.length;
  library.sections = library.sections.filter(s => 
    s.capturedDate > cutoffDate || s.stats.usedCount > 0
  );
  const afterCount = library.sections.length;
  
  if (beforeCount !== afterCount) {
    library.lastUpdated = Date.now();
    await chrome.storage.local.set({ library });
  }
  
  return beforeCount - afterCount;
}

// Helpers

function generateId() {
  return 'sec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}
