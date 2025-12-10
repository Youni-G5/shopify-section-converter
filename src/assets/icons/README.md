# Icônes de l'extension

Ce dossier contient les icônes de l'extension Shopify Section Converter.

## Génération rapide des icônes

Pour générer rapidement les icônes PNG depuis le SVG, vous pouvez :

### Option 1 : Utiliser un outil en ligne
1. Ouvrir https://convertio.co/fr/svg-png/
2. Uploader `icon.svg`
3. Générer aux tailles : 16x16, 32x32, 48x48, 128x128
4. Renommer en icon16.png, icon32.png, icon48.png, icon128.png

### Option 2 : Utiliser ImageMagick (si installé)
```bash
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 32x32 icon32.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png
```

### Option 3 : Solution temporaire (pour développement)

En attendant de générer les vraies icônes, vous pouvez créer des fichiers PNG de base :

1. Créer un fichier PNG vide de 128x128 pixels avec n'importe quel éditeur d'image
2. Le copier 4 fois et redimensionner aux tailles requises
3. Ou utiliser les icônes par défaut de Chrome temporairement

## Design de l'icône

- **Couleurs** : Gradient violet (#667eea → #764ba2)
- **Texte** : "SC" (Shopify Converter)
- **Style** : Moderne, coins arrondis
- **Background** : Gradient

## Tailles requises

- **16x16** : Favicon barre d'adresse
- **32x32** : Petite icône toolbar
- **48x48** : Icône extension popup
- **128x128** : Chrome Web Store et détails extension