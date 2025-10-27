# 📝 Format de Code - Body Seulement

## 🎯 Nouveau Format Simplifié

Le système a été modifié pour accepter **uniquement le contenu du `<body>`**.

La structure HTML de base (DOCTYPE, html, head, body) est **déjà présente** et s'affiche automatiquement.

## ✅ Ce que vous devez fournir

Donnez **UNIQUEMENT** le contenu qui va dans le `<body>` :

### ✅ Correct - Body seulement

```html
<button>Bien joué</button>
<h1>Mon Titre</h1>
<p>Texte ici</p>
```

### ✅ Correct - HTML complet (le système extraira le body)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test</title>
</head>
<body>
    <button>Bien joué</button>
</body>
</html>
```

Le système détectera automatiquement les balises `<body>` et n'affichera que le contenu.

## 📺 Ce qui s'affiche à l'écran

### Partie Code (Haut)
```
  1  <button>Bien joué</button>
  2  <h1>Mon Titre</h1>
  3  <p>Texte ici</p>
```

**Uniquement le contenu du body** s'écrit progressivement.

### Partie Résultat (Bas)

Le navigateur affiche le résultat avec cette structure automatique :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
</head>
<body>
    <!-- Votre contenu s'insère ici en temps réel -->
    <button>Bien joué</button>
</body>
</html>
```

## 🎨 Avec du Style CSS

Si vous voulez du CSS, incluez une balise `<style>` dans le body :

```html
<style>
  button {
    background: blue;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
  }
</style>

<button>Cliquez-moi</button>
```

## 🎬 Workflow Simplifié

1. **Créez un Reel** depuis l'interface
2. **Collez votre code body** dans le formulaire
3. **L'animation se lance** :
   - Le code s'écrit ligne par ligne (8 secondes)
   - Le résultat s'affiche en temps réel
   - Structure HTML de base déjà présente

## 💡 Avantages

- ✅ **Plus simple** : Pas besoin d'écrire le DOCTYPE à chaque fois
- ✅ **Plus court** : Code plus concis à l'écran
- ✅ **Focus sur l'essentiel** : On voit directement le contenu utile
- ✅ **Flexible** : Accepte quand même le HTML complet

## 📋 Exemples

### Exemple 1 : Bouton Simple

```html
<button onclick="alert('Hello!')">Cliquez-moi</button>
```

### Exemple 2 : Card avec Style

```html
<style>
  .card {
    width: 200px;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
</style>

<div class="card">
  <h3>Ma Card</h3>
  <p>Contenu de la card</p>
</div>
```

### Exemple 3 : Animation CSS

```html
<style>
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
  
  .box {
    width: 100px;
    height: 100px;
    background: linear-gradient(45deg, #667eea, #764ba2);
    animation: bounce 1s infinite;
  }
</style>

<div class="box"></div>
```

## 🚀 Résultat

Vous obtenez une vidéo avec :
- **Code propre et concis** en haut
- **Résultat fonctionnel** en bas
- **Animation fluide** de typing
- **Rendu en temps réel**

---

**Format portrait 9:16 parfait pour Instagram Reels !** 📱
