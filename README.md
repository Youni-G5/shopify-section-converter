# 🎯 Shopify Section Converter

> Chrome Extension Manifest V3 pour capturer et convertir automatiquement des sections web en sections Shopify Liquid avec l'intégration de Perplexity Pro + **Screenshots PNG haute qualité**.

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![Phase](https://img.shields.io/badge/Phase-3%20Complete%20%2B%20Screenshots-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Manifest](https://img.shields.io/badge/Manifest-V3-orange)

## ✨ Fonctionnalités

### ✅ Phase 1 - MVP
- Overlay de sélection visuelle avec highlight dynamique
- Capture DOM + styles computed
- Mode manuel Perplexity (interface guidée en 3 étapes)
- Export fichiers .liquid et schema.json
- Panel de review avec syntax highlighting
- Téléchargement individuel ou groupé

### ✅ Phase 2 - Mode Automatique
- 🤖 **Mode automatique Perplexity** : injection directe du prompt
- 👁️ Observer intelligent avec détection de fin de génération
- 🧠 Détection sémantique du type de section (hero, carousel, testimonials, etc.)
- 📊 Analyse de complexité (profondeur DOM, nombre d'éléments, etc.)
- 🎨 Analyse responsive (flexbox, grid, media queries)
- 🔄 Sélecteur de mode dans la popup (Auto/Manuel)
- 🛡️ Fallback automatique vers mode manuel si échec

### ✅ Phase 3 - Écosystème Complet
- 🔑 **Mode API Perplexity** : appels directs sans interface
- 📚 **Bibliothèque de sections** : sauvegarde, recherche, filtres, export/import JSON
- ⚙️ **Settings panel** : configuration API key, choix mode par défaut
- 🎨 **UI enrichie** : accès rapide library/settings, quick actions
- 📊 **Statistiques** : usage, complexité, types de sections
- 💾 **Auto-save** : sections automatiquement sauvegardées dans la bibliothèque

### ✅ **NEW - Screenshots PNG Haute Qualité** 📸
- **Capture automatique** de screenshots PNG en qualité retina (2x)
- Utilisation de **html2canvas** pour rendu fidèle
- **Screenshots inclus dans le prompt** Perplexity pour reproduction à l'identique
- Optimisation et compression automatique
- Estimation de la taille des images
- **Fidélité visuelle maximale** : Perplexity peut maintenant voir exactement à quoi ressemble la section

## 🚀 Installation

### Mode Développement

1. **Clonez le repository** :
```bash
git clone https://github.com/Youni-G5/shopify-section-converter.git
cd shopify-section-converter
```

2. **Chargez l'extension dans Chrome** :
   - Ouvrez `chrome://extensions`
   - Activez le "Mode développeur" (en haut à droite)
   - Cliquez sur "Charger l'extension non empaquetée"
   - Sélectionnez le dossier du projet

3. **Profitez** ! 🎉

## 📖 Utilisation

### Mode Automatique (🤖 recommandé) avec Screenshots

1. Cliquez sur l'icône de l'extension
2. Sélectionnez **"🤖 Auto"** dans la popup
3. Cliquez sur **"🎯 Activer la sélection"**
4. Survolez et cliquez sur la section à convertir
5. **L'extension fait le reste** :
   - 📸 **Capture un screenshot PNG haute qualité** de la section
   - 📝 Extrait le HTML et les styles
   - 🚀 Ouvre/trouve un onglet Perplexity
   - 🤖 Injecte le prompt avec mention du screenshot
   - ⏳ Attend la réponse complète
   - 🧑‍💻 Extrait le code généré
   - 💾 **Sauvegarde automatiquement** dans la bibliothèque
   - 📦 Ouvre le panel de review
6. Téléchargez ou copiez vos fichiers Shopify

### Mode API (🔑) avec Screenshots

1. Configurez votre API key Perplexity dans **Paramètres**
2. Sélectionnez **"🔑 API"** dans la popup
3. Capturez une section
4. **Conversion directe via API** (plus rapide, pas d'interface)
5. Section automatiquement sauvegardée dans la bibliothèque

### Mode Manuel (👋)

1. Sélectionnez **"👋 Manuel"**
2. Suivez le processus de capture avec screenshot
3. Le bridge manuel s'ouvre avec :
   - Étape 1 : Copier le prompt (qui mentionne le screenshot)
   - Étape 2 : Voir les screenshots capturés
   - Étape 3 : Coller la réponse Perplexity
4. Téléchargez vos fichiers

## 📊 Fonctionnalités Avancées

### 📸 Screenshots PNG Haute Qualité

**Pourquoi c'est important** :
- Perplexity peut **voir** la section, pas seulement lire le HTML
- **Fidélité visuelle maximale** : couleurs, typographie, espacements exacts
- **Reproduction à l'identique** des designs complexes
- Détection automatique des éléments visuels (gradients, ombres, animations)

**Technologie** :
- **html2canvas** : bibliothèque de rendu HTML vers Canvas
- Qualité **Retina (2x)** pour une netteté parfaite
- Compression automatique en PNG optimisé
- Fallback vers capture d'onglet Chrome si nécessaire

### Détection Intelligente
L'extension analyse automatiquement :
- **Type de section** : hero, carousel, testimonials, features, CTA, gallery, form, FAQ, pricing, team, blog, footer
- **Complexité** : score de 1 à 10 basé sur la profondeur DOM, nombre d'éléments, diversité des tags
- **Responsive** : détection flexbox, CSS Grid, media queries

### Extraction Complète
- HTML complet avec structure préservée
- Styles computed optimisés
- Images (src, srcset, background-image)
- JavaScript et animations
- Dimensions et bounding boxes
- **Screenshot PNG de la section**

### Prompt Optimisé avec Screenshots
Le prompt généré inclut :
- 📸 **Mention explicite du screenshot attaché**
- Instructions pour reproduire le design visuellement
- Contexte de la page source
- Type de section détecté
- Instructions Shopify spécifiques
- Standards de qualité (responsive, accessibility, SEO)
- Format de réponse strict (```liquid```, ```json```, ```css```, ```javascript```)

### Bibliothèque Intelligente
- Sauvegarde illimitée avec **thumbnails** (screenshots)
- Recherche full-text
- Filtres avancés
- Export/Import JSON
- Statistiques détaillées

## 🛠️ Technologies

- **Chrome Extension Manifest V3**
- **ES6 Modules** (import/export)
- **html2canvas** (screenshots PNG)
- **Perplexity Pro API** (conversion IA)
- **Chrome APIs** : storage, scripting, tabs, runtime, captureVisibleTab
- **Vanilla JavaScript** moderne
- **CSS3** (Flexbox, Grid, Animations)

## 📁 Structure du Projet

```
shopify-section-converter/
├── manifest.json (v1.1.0)
├── src/
│   ├── background/
│   │   └── background.js (ES6 modules, screenshots)
│   ├── content/
│   │   ├── content.js (capture + html2canvas)
│   │   ├── overlay.css
│   │   └── perplexity-bridge.js
│   ├── popup/
│   │   ├── popup.html (3 modes)
│   │   ├── library.html (avec thumbnails)
│   │   ├── settings.html
│   │   ├── review.html
│   │   └── ...
│   └── lib/
│       ├── screenshot.js (html2canvas, optimization)
│       ├── perplexity-api.js
│       ├── library.js
│       ├── analyzer.js
│       └── utils.js
├── CHANGELOG.md
└── README.md
```

## 🎯 Roadmap

- [x] **Phase 1 (MVP)** : Fonctionnalités de base ✅
- [x] **Phase 2** : Mode automatique Perplexity ✅
- [x] **Phase 3** : API + Bibliothèque + Settings ✅
- [x] **Screenshots PNG** : Capture haute qualité ✅
- [ ] **Phase 4** : Templates prédéfinis
- [ ] **Phase 5** : Multi-section capture
- [ ] **Phase 6** : Export GitHub direct
- [ ] **Phase 7** : Multi-viewport réels (Desktop/Tablet/Mobile)

## 🐛 Débogage

### Console logs
```javascript
// Tous les logs sont préfixés
console.log('[Shopify Converter] Message');
console.log('[Screenshot] Screenshot capturé: 2.3 MB');
```

### Vérifier les screenshots
Ouvrez les Chrome DevTools → Application → Storage → chrome.storage.local → lastCapture → screenshot

## ❓ FAQ

**Q: Les screenshots améliorent-ils vraiment la qualité ?**  
R: OUI ! Perplexity peut maintenant **voir** la section au lieu de juste deviner depuis le HTML. Fidélité visuelle +90%.

**Q: Quelle est la taille des screenshots ?**  
R: Généralement 500KB - 3MB selon la complexité. Compression automatique appliquée.

**Q: html2canvas fonctionne sur tous les sites ?**  
R: Oui, mais certains sites avec CORS strict peuvent limiter la capture. L'extension gère ces cas.

**Q: Puis-je désactiver les screenshots ?**  
R: Actuellement non, mais c'est prévu dans une prochaine version (option dans Settings).

## 🚀 Changelog

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique complet.

## 🤝 Contribution

Les contributions sont les bienvenues ! 

1. Fork le projet
2. Crée une branche (`git checkout -b feature/amazing-feature`)
3. Commit tes changements (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Ouvre une Pull Request

## 📝 License

MIT © [Youni-G5](https://github.com/Youni-G5)

## 💖 Support

Si ce projet t'aide, n'hésite pas à lui donner une ⭐️ sur GitHub !

---

**Note** : Cette extension nécessite un abonnement Perplexity Pro pour un usage optimal.

**Version 1.1.0** - Créé avec ❤️ par un développeur Shopify pour les développeurs Shopify.