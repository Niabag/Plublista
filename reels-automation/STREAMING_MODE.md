# 📹 Mode Streaming - Reels Automation

Cette application Electron vous permet de streamer facilement votre workflow de création de Reels en combinant VS Code et votre application web dans une seule interface.

## 🎯 Qu'est-ce que c'est ?

Le **Mode Streaming** lance une application Electron qui :
- 📝 Ouvre VS Code automatiquement (dans une fenêtre externe)
- 🌐 Affiche votre application web React dans une webview intégrée
- 🎥 Permet de capturer les deux dans OBS/logiciel de streaming
- ✨ Interface unifiée avec design professionnel

## 🚀 Installation

### 1. Installer les dépendances

```bash
npm install
```

Cela installera automatiquement Electron et toutes les dépendances nécessaires.

### 2. Vérifier que VS Code est dans le PATH

L'application essaie d'ouvrir VS Code avec la commande `code`. Vérifiez que VS Code est accessible :

```bash
code --version
```

Si cette commande ne fonctionne pas, ajoutez VS Code au PATH ou définissez la variable d'environnement `VSCODE_PATH` :

```bash
# Exemple Windows
set VSCODE_PATH=C:\Users\VotreNom\AppData\Local\Programs\Microsoft VS Code\Code.exe
```

## 🎬 Lancement

### Option 1 : Script batch (Recommandé)

Double-cliquez sur `start-stream.bat` ou lancez :

```bash
.\start-stream.bat
```

### Option 2 : Commande npm

```bash
npm run stream:start
```

Cela va :
1. ✅ Démarrer le serveur backend (Express)
2. ✅ Lancer l'application Electron
3. ✅ Ouvrir VS Code dans le dossier du projet
4. ✅ Charger l'application web dans l'interface

## 📐 Configuration du Stream

### Layout Recommandé

L'application s'ouvre en mode fenêtré (1920x1080). Vous avez deux options :

#### Option A : Capture de fenêtre unique (Plus simple)
1. Redimensionnez l'application Electron pour occuper tout l'écran
2. Placez VS Code dans le panneau gauche (externe)
3. Le panneau droit affiche automatiquement votre app web
4. Dans OBS : **Ajoutez une source "Capture d'écran"**

#### Option B : Layout personnalisé
1. Placez VS Code à gauche de votre écran
2. Placez l'application Electron à droite
3. Dans OBS : **Ajoutez deux sources "Capture de fenêtre"**
   - Source 1 : VS Code
   - Source 2 : Electron App

### Résolution recommandée pour Reels (Portrait 9:16)

Dans OBS :
- **Résolution de base** : 1080x1920 (vertical)
- **Disposition** :
  - VS Code : Position supérieure (60% de hauteur)
  - App Web : Position inférieure (40% de hauteur)
- **Ou** : Utilisez un layout horizontal 1920x1080 et recadrez en post-production

## 🎨 Personnalisation

### Modifier la taille de fenêtre

Éditez `electron-app/main.js` :

```javascript
mainWindow = new BrowserWindow({
  width: 1920,    // Largeur
  height: 1080,   // Hauteur
  fullscreen: false,
  // ...
});
```

### Changer l'URL de l'application web

Éditez `electron-app/index.html` :

```html
<webview id="webview" src="http://localhost:5173"></webview>
```

### Désactiver l'ouverture automatique de VS Code

Dans `electron-app/main.js`, commentez :

```javascript
// setTimeout(() => {
//   openVSCode();
// }, 1000);
```

## 🛠️ Fonctionnalités

### Interface Electron

- ✅ **Header** : Affiche le statut "Live" et le titre
- ✅ **Panel VS Code** : Instructions pour placement
- ✅ **Panel Web** : Webview intégré de votre application
- ✅ **Footer** : Statut et indicateurs
- ✅ **Auto-reload** : Recharge la webview toutes les 30s

### Détection d'erreurs

L'application recharge automatiquement la webview si :
- La connexion au serveur est perdue (erreur -102)
- Le serveur ne répond pas

## 🐛 Dépannage

### L'application ne démarre pas

**Problème** : Erreur `Cannot find module 'electron'`

**Solution** :
```bash
npm install --save-dev electron
```

### VS Code ne s'ouvre pas

**Problème** : VS Code n'est pas trouvé

**Solutions** :
1. Vérifiez que `code` fonctionne dans le terminal
2. Définissez la variable d'environnement :
   ```bash
   set VSCODE_PATH=C:\chemin\vers\Code.exe
   ```
3. Ouvrez VS Code manuellement après le lancement

### La webview est vide

**Problème** : `localhost:5173` ne répond pas

**Solutions** :
1. Vérifiez que le serveur backend est lancé :
   ```bash
   npm run dev:server
   ```
2. Vérifiez que le port 5173 n'est pas utilisé
3. Attendez quelques secondes et l'app reloadera automatiquement

### La fenêtre est trop petite

**Solution** : Redimensionnez manuellement ou modifiez la taille dans `main.js`

## 📊 Workflow de Streaming Complet

### Avant le Stream

1. ✅ Testez l'application : `.\start-stream.bat`
2. ✅ Configurez OBS avec les sources
3. ✅ Vérifiez l'audio et le micro
4. ✅ Préparez vos snippets de code

### Pendant le Stream

1. 🎥 Lancez l'enregistrement OBS
2. 💻 Codez dans VS Code (visible à gauche)
3. 👁️ Vérifiez le rendu en temps réel (visible à droite)
4. 🎬 Interagissez avec l'application web si nécessaire

### Après le Stream

1. ⏹️ Arrêtez l'enregistrement
2. ❌ Fermez l'application Electron
3. 🎞️ Éditez la vidéo selon les specs Instagram

## 💡 Conseils Pro

### Optimisation Visuelle

- **Thème VS Code** : Utilisez un thème dark contrasté (ex: One Dark Pro)
- **Font Size** : Augmentez la taille de police dans VS Code (14-16px)
- **Zoom Browser** : La webview supporte Ctrl + scroll pour zoomer
- **Curseur** : Installez une extension de curseur personnalisé dans VS Code

### Performance

- Fermez les applications inutiles
- Désactivez les notifications Windows
- Utilisez un second moniteur pour OBS

### Branding

- Ajoutez un overlay dans OBS avec votre logo
- Personnalisez les couleurs du header dans `index.html`
- Ajoutez votre pseudo/nom dans le footer

## 🔄 Mise à jour

Pour mettre à jour l'application après des modifications :

```bash
# Réinstaller les dépendances si besoin
npm install

# Relancer
.\start-stream.bat
```

## 📝 Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run stream:app` | Lance uniquement l'app Electron |
| `npm run stream:start` | Lance serveur + app Electron |
| `npm run dev:server` | Lance uniquement le serveur backend |
| `npm run dev` | Mode dev normal (sans Electron) |

## 🎓 Ressources

- [Documentation Electron](https://www.electronjs.org/docs)
- [Guide OBS Streaming](https://obsproject.com/wiki/)
- [Instagram Reels Specs](https://developers.facebook.com/docs/instagram-api/guides/reels)

---

**Créé avec** ❤️ **pour faciliter le streaming de code**

Pour toute question ou amélioration, créez une issue sur GitHub !
