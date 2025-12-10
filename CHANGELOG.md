# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

## [1.1.0] - 2025-12-10

### ✨ Ajouté
- **Screenshots PNG haute qualité** : Capture automatique avec html2canvas
  - Qualité Retina (2x) pour netteté parfaite
  - Compression et optimisation automatiques
  - Integration dans le prompt Perplexity pour fidélité visuelle maximale
- **Prompt amélioré** : Mention explicite des screenshots pour reproduction à l'identique
- **Auto-save bibliothèque** : Sections automatiquement sauvegardées après conversion
- **Thumbnails** : Screenshots utilisés comme vignettes dans la bibliothèque
- **Loader avec étapes** : Feedback visuel pendant capture (screenshot, extraction, envoi)

### 🔧 Amélioré
- Manifest V3 mis à jour pour support ES6 modules
- Background worker avec imports ES6
- Content script avec import dynamique de html2canvas
- Gestion d'erreurs améliorée pour screenshots
- Prompt optimisé avec contexte visuel

### 🐛 Corrigé
- Problème de modules ES6 dans background worker
- CORS pour CDN html2canvas

## [1.0.0] - 2025-12-10

### Phase 3 - Écosystème Complet

#### ✨ Ajouté
- **Mode API Perplexity** : Appels directs sans interface
  - Client API Perplexity complet
  - Test de connexion
  - Gestion sécurisée de l'API key
- **Bibliothèque de sections**
  - Sauvegarde illimitée
  - Recherche full-text
  - Filtres par type et complexité
  - Tri avancé (date, nom, usage, complexité)
  - Export/Import JSON
  - Statistiques détaillées
  - Nettoyage automatique des anciennes sections
- **Interface Settings**
  - Configuration API key
  - Sélection mode par défaut
  - Accès bibliothèque
  - Statistiques globales
- **Popup améliorée**
  - Accès rapide Library et Settings
  - Sélecteur 3 modes (Manuel/Auto/API)
  - Quick actions (dernière capture, stats)
  - Validation API key pour mode API

#### 📚 Librairies
- `perplexity-api.js` : Client API complet
- `library.js` : Gestionnaire de bibliothèque
- `screenshot.js` : Capture multi-viewport
- `analyzer.js` : Détection sémantique
- `utils.js` : Utilitaires divers

### Phase 2 - Mode Automatique

#### ✨ Ajouté
- **Mode automatique Perplexity**
  - Injection automatique du prompt
  - Détection textarea et bouton submit
  - Observer intelligent (MutationObserver)
  - Détection fin de génération par stabilité
  - Extraction automatique des blocs de code
- **Analyse intelligente**
  - Détection type de section (10+ types)
  - Score de complexité (1-10)
  - Analyse responsive (flexbox, grid)
- **Fallback automatique** vers mode manuel si échec
- **Sélecteur de mode** dans la popup

#### 🔧 Amélioré
- Background worker avec gestion 3 modes
- Prompt enrichi avec contexte
- UI overlay avec badge de mode actif

### Phase 1 - MVP

#### ✨ Ajouté
- **Overlay de sélection visuelle**
  - Highlight dynamique
  - Infos élément en temps réel
  - Raccourcis clavier (Esc)
- **Capture DOM complète**
  - HTML + styles computed
  - Bounding boxes
  - Métadonnées
- **Mode manuel Perplexity**
  - Bridge en 3 étapes
  - Génération prompt
  - Parsing réponse
- **Panel de review**
  - Syntax highlighting
  - Statistiques code
  - Export fichiers individuels
  - Copie rapide
- **Architecture de base**
  - Manifest V3
  - Background service worker
  - Content scripts
  - Popup interface

---

## Conventions

Ce changelog suit le format [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

Types de changements :
- `✨ Ajouté` : Nouvelles fonctionnalités
- `🔧 Amélioré` : Modifications de fonctionnalités existantes
- `🐛 Corrigé` : Corrections de bugs
- `🛡️ Sécurité` : Correctifs de sécurité
- `🗑️ Supprimé` : Fonctionnalités retirées
- `⚠️ Déprécié` : Fonctionnalités déconseillées