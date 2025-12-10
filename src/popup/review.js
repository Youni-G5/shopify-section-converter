// Review & Export - Phase 1 MVP

const fileIcons = {
  liquid: '💧',
  json: '📋',
  css: '🎨',
  javascript: '⚡'
};

const fileNames = {
  liquid: 'section.liquid',
  json: 'schema.json',
  css: 'styles.css',
  javascript: 'script.js'
};

let conversionData = null;

document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.local.get('lastConversion');
  conversionData = data.lastConversion;

  if (!conversionData) {
    document.querySelector('.container').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <h3>Aucune conversion disponible</h3>
        <p>Effectue d'abord une capture et conversion via Perplexity.</p>
      </div>
    `;
    return;
  }

  renderCodeBlocks();
  updateStats();
  setupTabs();
  setupActions();
});

function renderCodeBlocks() {
  const container = document.getElementById('codeBlocks');
  const blocks = ['liquid', 'json', 'css', 'javascript'];

  blocks.forEach(type => {
    const code = conversionData[type === 'json' ? 'schema' : type];
    if (!code) return;

    const block = document.createElement('div');
    block.className = 'code-block';
    block.innerHTML = `
      <div class="code-header">
        <span class="filename">
          <span>${fileIcons[type]}</span>
          <span>${fileNames[type]}</span>
        </span>
        <button class="btn btn-copy" data-code="${type}">📋 Copier</button>
      </div>
      <pre><code>${escapeHtml(code)}</code></pre>
    `;
    container.appendChild(block);
  });

  // Event listeners pour les boutons copy
  document.querySelectorAll('[data-code]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const type = e.currentTarget.getAttribute('data-code');
      const code = conversionData[type === 'json' ? 'schema' : type];
      await navigator.clipboard.writeText(code);
      e.currentTarget.textContent = '✅ Copié';
      setTimeout(() => {
        e.currentTarget.textContent = '📋 Copier';
      }, 2000);
    });
  });
}

function updateStats() {
  const liquid = conversionData.liquid || '';
  const schema = conversionData.schema || '';
  const css = conversionData.css || '';
  const js = conversionData.js || '';

  document.getElementById('liquidLines').textContent = liquid.split('\n').length + ' lignes';
  
  try {
    const schemaObj = JSON.parse(schema);
    const settingsCount = (schemaObj.settings || []).length;
    document.getElementById('schemaSettings').textContent = settingsCount + ' settings';
  } catch {
    document.getElementById('schemaSettings').textContent = 'N/A';
  }

  document.getElementById('cssLines').textContent = css ? css.split('\n').length + ' lignes' : 'Aucun';
  document.getElementById('jsStatus').textContent = js ? 'Présent' : 'Aucun';
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      
      // Désactiver tous les tabs
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Activer le tab cliqué
      tab.classList.add('active');
      document.getElementById('tab-' + targetTab).classList.add('active');
    });
  });
}

function setupActions() {
  document.getElementById('closeBtn').addEventListener('click', () => {
    window.close();
  });

  document.getElementById('downloadAll').addEventListener('click', async () => {
    await downloadAsZip();
  });

  document.getElementById('copyAllBtn').addEventListener('click', async () => {
    const allCode = [
      '// ========== section.liquid ==========',
      conversionData.liquid || '',
      '',
      '// ========== schema.json ==========',
      conversionData.schema || '',
      '',
      '// ========== styles.css ==========',
      conversionData.css || '',
      '',
      '// ========== script.js ==========',
      conversionData.js || ''
    ].join('\n');

    await navigator.clipboard.writeText(allCode);
    
    const btn = document.getElementById('copyAllBtn');
    btn.textContent = '✅ Tout copié';
    setTimeout(() => {
      btn.textContent = '📋 Copier tout';
    }, 2000);
  });
}

async function downloadAsZip() {
  // Pour Phase 1, on télécharge chaque fichier séparément
  // Dans Phase 2+, on pourrait utiliser JSZip
  const files = [
    { name: 'section.liquid', content: conversionData.liquid },
    { name: 'schema.json', content: conversionData.schema },
    { name: 'styles.css', content: conversionData.css },
    { name: 'script.js', content: conversionData.js }
  ];

  files.forEach(file => {
    if (!file.content) return;
    
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  });

  const btn = document.getElementById('downloadAll');
  btn.textContent = '✅ Téléchargé';
  setTimeout(() => {
    btn.textContent = '💾 Télécharger tout (.zip)';
  }, 2000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
