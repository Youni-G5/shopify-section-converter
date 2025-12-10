# 🎯 Shopify Section Converter

> Chrome Extension Manifest V3 pour capturer et convertir automatiquement des sections web en sections Shopify Liquid avec l'intégration de Perplexity Pro.

## 🚀 Phase 1 - MVP

### Fonctionnalités actuelles

- ✅ Overlay de sélection visuelle
- ✅ Capture DOM + styles computed
- ✅ Mode manuel Perplexity (interface guidée)
- ✅ Export fichiers .liquid et schema.json
- ✅ Capture multi-viewport (Desktop/Tablet/Mobile)

### Installation (Mode Développement)

1. Clonez le repository:
```bash
git clone https://github.com/Youni-G5/shopify-section-converter.git
cd shopify-section-converter
```

2. Chargez l'extension dans Chrome:
   - Ouvrez `chrome://extensions`
   - Activez le "Mode développeur"
   - Cliquez sur "Charger l'extension non empaquetée"
   - Sélectionnez le dossier du projet

### 📖 Utilisation

1. **Naviguez** vers une page web avec une section à capturer
2. **Cliquez** sur l'icône de l'extension
3. **Activez** le mode de sélection
4. **Sélectionnez** la section désirée avec la souris
5. **Validez** la capture
6. **Suivez** les instructions du bridge Perplexity
7. **Téléchargez** vos fichiers générés

### 🛠️ Technologies

- **Chrome Extension Manifest V3**
- **Vanilla JavaScript** (ES6+)
- **Perplexity Pro** (AI conversion)
- **CSS3** (Flexbox, Grid)

### 📁 Structure du Projet

```
src/
├── background/        # Service worker
├── content/          # Scripts d'injection
├── popup/            # Interface popup
├── lib/              # Librairies utilitaires
└── assets/           # Images, icônes
```

### 🎯 Roadmap

- [ ] **Phase 1 (MVP)**: Fonctionnalités de base ✅ En cours
- [ ] **Phase 2**: Mode automatique Perplexity
- [ ] **Phase 3**: Mode API Perplexity
- [ ] **Phase 4**: Bibliothèque de sections
- [ ] **Phase 5**: Multi-section capture

### 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

### 📄 License

MIT © Youni-G5

---

**Note**: Cette extension nécessite un abonnement Perplexity Pro pour fonctionner de manière optimale.