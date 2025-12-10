# 🎯 Shopify Section Converter

> Chrome Extension Manifest V3 pour capturer et convertir automatiquement des sections web en sections Shopify Liquid avec l'intégration de Perplexity Pro.

![Phase](https://img.shields.io/badge/Phase-2%20Complete-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Manifest](https://img.shields.io/badge/Manifest-V3-orange)

## ✨ Fonctionnalités

### ✅ Phase 1 - MVP (Complète)
- Overlay de sélection visuelle avec highlight dynamique
- Capture DOM + styles computed
- Mode manuel Perplexity (interface guidée en 3 étapes)
- Export fichiers .liquid et schema.json
- Panel de review avec syntax highlighting
- Téléchargement individuel ou groupé

### ✅ Phase 2 - Mode Automatique (Complète)
- 🤖 **Mode automatique Perplexity** : injection directe du prompt
- 👁️ Observer intelligent avec détection de fin de génération
- 📸 Capture multi-viewport (Desktop/Tablet/Mobile)
- 🧠 Détection sémantique du type de section (hero, carousel, testimonials, etc.)
- 📊 Analyse de complexité (profondeur DOM, nombre d'éléments, etc.)
- 🎨 Analyse responsive (flexbox, grid, media queries)
- 🔄 Sélecteur de mode dans la popup (Auto/Manuel)
- 🛡️ Fallback automatique vers mode manuel si échec

### 🚧 Phase 3 - En cours
- API Perplexity (appels directs)
- Bibliothèque de sections sauvegardées
- Export vers GitHub repo
- Amélioration du prompt avec templates

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

### Mode Automatique (🤖 recommandé)

1. Cliquez sur l'icône de l'extension
2. Sélectionnez **"🤖 Auto"** dans la popup
3. Cliquez sur **"🎯 Activer la sélection"**
4. Survolez et cliquez sur la section à convertir
5. **L'extension fait le reste** :
   - Ouvre/trouve un onglet Perplexity
   - Injecte le prompt automatiquement
   - Attend la réponse complète
   - Extrait le code généré
   - Ouvre le panel de review
6. Téléchargez ou copiez vos fichiers Shopify

### Mode Manuel (👋)

1. Cliquez sur l'icône de l'extension
2. Sélectionnez **"👋 Manuel"**
3. Suivez le processus de capture
4. Le bridge manuel s'ouvre avec :
   - Étape 1 : Copier le prompt
   - Étape 2 : Ouvrir Perplexity et coller
   - Étape 3 : Copier la réponse et la coller
5. Téléchargez vos fichiers

## 📊 Fonctionnalités Avancées

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

### Prompt Optimisé
Le prompt généré inclut :
- Contexte de la page source
- Type de section détecté
- Instructions Shopify spécifiques
- Standards de qualité (responsive, accessibility, SEO)
- Format de réponse strict (```liquid```, ```json```, ```css```, ```javascript```)

## 🛠️ Technologies

- **Chrome Extension Manifest V3**
- **Vanilla JavaScript** (ES6+ avec modules)
- **Perplexity Pro** (AI conversion)
- **CSS3** (Flexbox, Grid, Animations)
- **Chrome APIs** : storage, scripting, tabs, runtime

## 📁 Structure du Projet

```
shopify-section-converter/
├── manifest.json           # Configuration Manifest V3
├── src/
│   ├── background/
│   │   └── background.js    # Service worker (orchestration)
│   ├── content/
│   │   ├── content.js       # Script d'injection (overlay)
│   │   ├── overlay.css      # Styles overlay
│   │   └── perplexity-bridge.js  # Script Perplexity
│   ├── popup/
│   │   ├── popup.html       # Interface popup principale
│   │   ├── popup.js         # Logique popup
│   │   ├── perplexity-bridge.html  # Bridge manuel
│   │   ├── perplexity-bridge.js    # Logique bridge
│   │   ├── review.html      # Panel review & export
│   │   └── review.js        # Logique review
│   ├── lib/
│   │   ├── screenshot.js    # Capture multi-viewport
│   │   ├── analyzer.js      # Analyse sémantique
│   │   └── utils.js         # Utilitaires
│   └── assets/
│       └── icons/           # Icônes extension
├── package.json
├── .gitignore
└── README.md
```

## 🎯 Roadmap

- [x] **Phase 1 (MVP)** : Fonctionnalités de base ✅
- [x] **Phase 2** : Mode automatique Perplexity ✅
- [ ] **Phase 3** : API Perplexity + Bibliothèque 🚧
- [ ] **Phase 4** : Multi-section capture
- [ ] **Phase 5** : Export GitHub direct
- [ ] **Phase 6** : Templates & patterns

## 🐛 Débogage

### Console logs
```javascript
// Tous les logs sont préfixés par [Shopify Converter]
console.log('[Shopify Converter] Message');
```

### Chrome DevTools
1. Clic droit sur l'icône → "Inspecter la popup"
2. Onglet "Console" pour voir les logs
3. Onglet "Application" → "Storage" pour voir chrome.storage

### Rechargement
Après modifications :
1. `chrome://extensions`
2. Cliquez sur l'icône de rechargement 🔄

## ❓ FAQ

**Q: L'injection automatique ne fonctionne pas**  
R: Vérifie que tu es bien connecté à Perplexity Pro et que l'onglet Perplexity est actif.

**Q: Le code généré n'est pas parfait**  
R: L'IA fait de son mieux ! Tu peux affiner le prompt ou basculer en mode manuel pour plus de contrôle.

**Q: Puis-je utiliser sans Perplexity Pro ?**  
R: Oui, mais les résultats seront moins optimisés. Perplexity Pro offre de meilleurs résultats avec accès web.

**Q: Combien de sections puis-je capturer ?**  
R: Autant que tu veux ! Chaque capture est indépendante.

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

**Note** : Cette extension nécessite un abonnement Perplexity Pro pour un usage optimal du mode automatique.

**Créé avec ❤️ par un développeur Shopify pour les développeurs Shopify.**