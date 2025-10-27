# ✅ Tests à Faire Avant Utilisation

## 🎯 Objectif

Tester que chaque composant fonctionne **avant** de créer votre premier Reel complet.

## ⚡ Tests Rapides (5 minutes)

### 1️⃣ Test Python
```powershell
python --version
```
**Attendu:** `Python 3.9.x` ou plus

**Si ça échoue:**
```powershell
# Installer Python
winget install Python.Python.3.11
```

### 2️⃣ Test Dépendances Python
```powershell
pip install -r scripts/requirements.txt
```
**Attendu:** Installations réussies

### 3️⃣ Test OBS WebSocket
```powershell
# IMPORTANT: Lancez OBS d'abord !
# Puis testez:
python scripts/obs_control.py status
```
**Attendu:** `Recording: No`

**Si erreur "Connection refused":**
1. Ouvrez OBS
2. Tools → WebSocket Server Settings
3. Vérifiez que c'est activé
4. Port = 4455
5. Le mot de passe dans `.env` correspond

### 4️⃣ Test VS Code
```powershell
# Vérifier le chemin
& "C:\Users\VotreNom\AppData\Local\Programs\Microsoft VS Code\Code.exe" --version
```
**Attendu:** Version de VS Code

**Si erreur:** Mettez à jour le chemin dans `config.yaml`:
```yaml
paths:
  vscode: "VOTRE_CHEMIN_ICI"
```

### 5️⃣ Test FFmpeg
```powershell
ffmpeg -version
```
**Attendu:** Version de FFmpeg

**Si erreur "not recognized":**
```powershell
winget install Gyan.FFmpeg
```

## 🧪 Test du Pipeline Complet (10 minutes)

### Prérequis
- ✅ OBS **lancé** et configuré
- ✅ Scène verticale (1080×1920) créée dans OBS
- ✅ WebSocket activé dans OBS
- ✅ Tous les tests ci-dessus passés

### Étape 1: Préparer OBS

1. **Lancez OBS**
2. **Créez une scène "Reel"** si pas encore fait:
   - Clic droit dans Scenes → Add
   - Nom: "Reel Recording"
3. **Configurez la résolution**:
   - Settings → Video
   - Base Resolution: **1080×1920** (vertical!)
   - Output Resolution: **1080×1920**
4. **Ajoutez les sources** (optionnel pour test):
   - Window Capture → VS Code
   - Window Capture → Chrome/Edge

### Étape 2: Tester l'enregistrement OBS

```powershell
# Démarrer
python scripts/obs_control.py start
# Attendre 5 secondes
timeout /t 5
# Arrêter
python scripts/obs_control.py stop
```

**Vérifiez:** Un fichier vidéo a été créé dans le dossier d'enregistrement OBS

### Étape 3: Tester la frappe automatique

```powershell
# 1. Ouvrir VS Code avec un fichier vide
code test.html

# 2. Focus sur VS Code (cliquez dedans)

# 3. Lancer le test (vous avez 3 secondes pour focus!)
python scripts/type_sim.py --file snippets/001_glassmorphism.html
```

**Attendu:** Le code s'écrit tout seul dans VS Code!

### Étape 4: Tester le navigateur

```powershell
python scripts/browser_demo.py --file snippets/001_glassmorphism.html
```

**Attendu:** Chrome/Edge s'ouvre en plein écran avec la page

**Pour fermer:** Alt+F4 ou Ctrl+C dans le terminal

### Étape 5: Test Pipeline COMPLET

**ATTENTION:** Ce test va:
- Ouvrir VS Code
- Démarrer l'enregistrement OBS
- Taper du code
- Ouvrir le navigateur
- Créer une vidéo

```powershell
# S'assurer qu'OBS est lancé
python scripts/orchestrator.py --job-id 999 --code-file snippets/001_glassmorphism.html --title "Test Pipeline"
```

**Durée attendue:** ~1-2 minutes (selon la longueur du code)

**Vérifiez:**
1. ✅ VS Code s'est ouvert
2. ✅ OBS a enregistré
3. ✅ Le code a été tapé
4. ✅ Le navigateur s'est ouvert
5. ✅ Un fichier existe dans `out/final/job-999.mp4`

## 🌐 Test de l'Interface Web

### Démarrer l'application

```powershell
npm run dev
```

**Attendu:**
```
Server running on http://localhost:3000
Vite dev server on http://localhost:5173
```

### Ouvrir l'interface

1. Ouvrez **http://localhost:5173** dans votre navigateur
2. Vous devriez voir le **Dashboard**

### Créer un Reel de test

1. Cliquez **"New Reel"**
2. Collez ce code simple:
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: #667eea;
            font-family: Arial;
        }
        h1 { color: white; font-size: 3em; }
    </style>
</head>
<body>
    <h1>Test Reel! 🎬</h1>
</body>
</html>
```
3. Titre: "Test Simple"
4. Hashtags: "#test"
5. **NE PAS** cocher la planification pour l'instant
6. Cliquez **"Next"** puis **"Start Recording"**

### Surveiller les logs

Dans le terminal où tourne `npm run dev`, vous devriez voir:

```
🚀 Démarrage de l'automatisation...
✅ Workspace créé
🎬 Lancement de l'orchestrateur Python...
📁 STEP 1: Workspace ready
💻 STEP 2: Opening VS Code
🎥 STEP 3: Starting OBS recording
...
```

**Important:** Les logs Python s'affichent maintenant en temps réel!

### Vérifier dans l'interface

1. Allez sur la page du job (cliquez dessus dans le dashboard)
2. Vous devriez voir:
   - Timeline des étapes
   - Logs en temps réel
   - Progression

## ❌ Si ça ne fonctionne pas

### Problème: "python not found"

**Dans `.env`, ajoutez:**
```env
PYTHON_PATH=python
# OU si vous avez py launcher:
PYTHON_PATH=py -3
```

Redémarrez le serveur.

### Problème: Rien ne se lance

**Vérifiez les logs du serveur** dans le terminal `npm run dev`

Cherchez des erreurs comme:
- `spawn ENOENT` → Python non trouvé
- `Connection refused` → OBS non lancé ou WebSocket désactivé
- `File not found` → Chemin incorrect dans config.yaml

### Problème: "Le processus s'est terminé avec le code 1"

**Testez chaque script individuellement** (voir section Tests Rapides ci-dessus)

Le script qui échoue vous dira quel composant a un problème.

### Problème: VS Code ne s'ouvre pas

**Trouvez le bon chemin:**
```powershell
where code
# OU
Get-Command code
```

**Mettez à jour `config.yaml`** avec le bon chemin.

## ✅ Checklist Finale

Avant de créer votre premier vrai Reel:

- [ ] ✅ Python fonctionne (`python --version`)
- [ ] ✅ OBS lance et WebSocket OK (`python scripts/obs_control.py status`)
- [ ] ✅ VS Code s'ouvre (`code --version`)
- [ ] ✅ FFmpeg installé (`ffmpeg -version`)
- [ ] ✅ Dépendances installées (`pip list | grep obs`)
- [ ] ✅ Test orchestrateur complet réussi
- [ ] ✅ Interface web fonctionne (http://localhost:5173)
- [ ] ✅ Création de test réussie via l'interface
- [ ] ✅ Vidéo générée visible dans `out/final/`

## 🎉 Tout fonctionne ?

**Félicitations!** Vous êtes prêt à créer vos premiers Reels automatisés!

**Prochaines étapes:**
1. 📚 Lisez [SCHEDULING_GUIDE.md](./SCHEDULING_GUIDE.md) pour la planification
2. 🎨 Ajoutez votre logo dans `assets/brand/logo.png`
3. 🎵 Ajoutez des musiques dans `assets/music/`
4. 📸 Créez vos premiers vrais Reels!

**Pour l'API Instagram** (optionnel pour l'instant):
- Suivez [SETUP_GUIDE.md](./SETUP_GUIDE.md) section "Instagram API Setup"
- Vous pouvez créer et tester des vidéos SANS l'API
- L'API est nécessaire uniquement pour la publication automatique

## 🐛 Besoin d'aide ?

Consultez [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) pour les problèmes courants.

---

**Bon test! 🚀**
