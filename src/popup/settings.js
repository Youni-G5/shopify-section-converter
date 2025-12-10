// Settings - Phase 3
import { getAPIKey, saveAPIKey, deleteAPIKey, PerplexityAPI } from '../lib/perplexity-api.js';
import { getLibraryStats } from '../lib/library.js';

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

async function loadSettings() {
  // Charger l'API key
  const apiKey = await getAPIKey();
  if (apiKey) {
    document.getElementById('apiKey').value = apiKey;
    showApiStatus('success', '✅ API key configurée');
  } else {
    showApiStatus('warning', '⚠️ Aucune API key configurée');
  }
  
  // Charger le mode par défaut
  const data = await chrome.storage.sync.get('conversionMode');
  const mode = data.conversionMode || 'auto';
  document.querySelector(`input[value="${mode}"]`).checked = true;
  
  // Stats bibliothèque
  const stats = await getLibraryStats();
  document.getElementById('libraryStat').textContent = 
    `${stats.totalSections} section(s) sauvegardée(s) • ${stats.totalUsage} utilisation(s)`;
}

function setupEventListeners() {
  // Sauvegarder API key
  document.getElementById('saveApiKey').addEventListener('click', async () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    
    if (!apiKey) {
      showApiStatus('error', '❌ Veuillez entrer une API key');
      return;
    }
    
    await saveAPIKey(apiKey);
    showApiStatus('success', '✅ API key sauvegardée avec succès');
  });
  
  // Tester API key
  document.getElementById('testApiKey').addEventListener('click', async () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    
    if (!apiKey) {
      showApiStatus('error', '❌ Veuillez entrer une API key');
      return;
    }
    
    showApiStatus('warning', '⏳ Test en cours...');
    
    const api = new PerplexityAPI(apiKey);
    const isValid = await api.testConnection();
    
    if (isValid) {
      showApiStatus('success', '✅ Connexion réussie !');
    } else {
      showApiStatus('error', '❌ Connexion échouée. Vérifiez votre API key.');
    }
  });
  
  // Supprimer API key
  document.getElementById('deleteApiKey').addEventListener('click', async () => {
    if (!confirm('Voulez-vous vraiment supprimer l\'API key ?')) return;
    
    await deleteAPIKey();
    document.getElementById('apiKey').value = '';
    showApiStatus('warning', '⚠️ API key supprimée');
  });
  
  // Changer le mode
  document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', async (e) => {
      await chrome.storage.sync.set({ conversionMode: e.target.value });
    });
  });
  
  // Ouvrir bibliothèque
  document.getElementById('openLibrary').addEventListener('click', async () => {
    await chrome.windows.create({
      url: chrome.runtime.getURL('src/popup/library.html'),
      type: 'popup',
      width: 1200,
      height: 800,
      focused: true
    });
  });
}

function showApiStatus(type, message) {
  const statusDiv = document.getElementById('apiStatus');
  statusDiv.className = `status ${type}`;
  statusDiv.textContent = message;
  statusDiv.style.display = 'block';
}
