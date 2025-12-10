// Bibliothèque UI - Phase 3
import { getLibrary, searchSections, getLibraryStats, exportLibrary, importLibrary, deleteSection } from '../lib/library.js';

let currentSections = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadLibrary();
  setupEventListeners();
});

async function loadLibrary() {
  const library = await getLibrary();
  currentSections = library.sections;
  
  await renderSections(currentSections);
  await updateStats();
}

async function renderSections(sections) {
  const grid = document.getElementById('sectionsGrid');
  const emptyState = document.getElementById('emptyState');
  
  if (sections.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  
  grid.style.display = 'grid';
  emptyState.style.display = 'none';
  
  grid.innerHTML = sections.map(section => {
    const icon = getTypeIcon(section.blockType);
    const date = new Date(section.capturedDate).toLocaleDateString('fr-FR');
    
    return `
      <div class="section-card" data-id="${section.id}">
        <div class="card-thumbnail">
          ${icon}
          <span class="card-type-badge">${section.blockType}</span>
        </div>
        <div class="card-body">
          <div class="card-title">${section.name}</div>
          <div class="card-meta">
            ${section.sourceDomain} • ${date}
          </div>
          <div class="card-tags">
            ${section.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
          <div class="card-footer">
            <span>📊 ${section.complexity}/10</span>
            <span>🔄 ${section.stats.usedCount}x</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Event listeners sur les cartes
  grid.querySelectorAll('.section-card').forEach(card => {
    card.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      await openSectionDetail(id);
    });
  });
}

async function updateStats() {
  const stats = await getLibraryStats();
  
  document.getElementById('totalSections').textContent = stats.totalSections;
  document.getElementById('totalUsage').textContent = stats.totalUsage;
  document.getElementById('avgComplexity').textContent = stats.averageComplexity.toFixed(1);
}

function setupEventListeners() {
  // Recherche
  let searchTimeout;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => performSearch(), 300);
  });
  
  // Filtres
  document.getElementById('typeFilter').addEventListener('change', performSearch);
  document.getElementById('sortFilter').addEventListener('change', performSearch);
  
  // Export
  document.getElementById('exportBtn').addEventListener('click', async () => {
    const json = await exportLibrary();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopify-sections-library-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
  
  // Import
  document.getElementById('importBtn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const text = await file.text();
      try {
        const count = await importLibrary(text);
        alert(`${count} section(s) importée(s) avec succès`);
        await loadLibrary();
      } catch (error) {
        alert('Erreur lors de l\'importation: ' + error.message);
      }
    });
    input.click();
  });
}

async function performSearch() {
  const query = document.getElementById('searchInput').value;
  const blockType = document.getElementById('typeFilter').value;
  const sortBy = document.getElementById('sortFilter').value;
  
  const results = await searchSections(query, {
    blockType: blockType || undefined,
    sortBy: sortBy
  });
  
  await renderSections(results);
}

async function openSectionDetail(id) {
  // Ouvrir review.html avec cette section
  const section = currentSections.find(s => s.id === id);
  if (!section) return;
  
  // Charger la section dans lastConversion pour review.html
  await chrome.storage.local.set({ 
    lastConversion: {
      liquid: section.files.liquid,
      schema: section.files.schema,
      css: section.files.css,
      js: section.files.js
    }
  });
  
  // Ouvrir review.html
  await chrome.windows.create({
    url: chrome.runtime.getURL('src/popup/review.html'),
    type: 'popup',
    width: 1000,
    height: 700,
    focused: true
  });
}

function getTypeIcon(type) {
  const icons = {
    hero: '🎆',
    carousel: '🎠',
    testimonials: '💬',
    features: '⭐',
    cta: '👉',
    gallery: '🖼️',
    form: '📝',
    faq: '❓',
    pricing: '💰',
    team: '👥',
    blog: '📰',
    footer: '👇',
    generic: '📦'
  };
  return icons[type] || icons.generic;
}
