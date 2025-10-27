# 🔧 Guide de Dépannage

## ⚠️ Problème: Rien ne se lance, tout va trop vite

### Symptômes
- Les étapes se valident en 3 secondes
- OBS ne démarre pas
- VS Code ne s'ouvre pas
- Aucun logiciel ne se lance

### Cause
Le backend était en mode "simulation" - maintenant corrigé!

### Solution
1. **Redémarrez le serveur**
```powershell
# Arrêter avec Ctrl+C puis
npm run dev
```

2. **Vérifiez que Python est installé**
```powershell
python --version
# Devrait afficher: Python 3.x.x
```

3. **Testez l'orchestrateur manuellement**
```powershell
python scripts/orchestrator.py --help
```

## 🐍 Python non trouvé

### Erreur
```
'python' is not recognized as an internal or external command
```

### Solution

#### Option 1: Installer Python via Microsoft Store
```powershell
winget install Python.Python.3.11
```

#### Option 2: Télécharger depuis python.org
1. Allez sur https://www.python.org/downloads/
2. Téléchargez Python 3.11+
3. **IMPORTANT**: Cochez **"Add Python to PATH"** pendant l'installation
4. Redémarrez votre terminal

#### Option 3: Utiliser py launcher (si déjà installé)
Éditez `.env`:
```env
PYTHON_PATH=py -3
```

### Vérification
```powershell
python --version
pip --version
```

## 🎥 OBS ne démarre pas

### Vérifiez qu'OBS est installé
```powershell
# Vérifier le chemin
"C:\Program Files\obs-studio\bin\64bit\obs64.exe"
```

### Vérifiez WebSocket
1. Ouvrez OBS
2. **Tools → WebSocket Server Settings**
3. Vérifiez:
   - ✅ Enable WebSocket server
   - Port: `4455`
   - Mot de passe configuré

### Testez la connexion
```powershell
python scripts/obs_control.py status
```

**Résultat attendu:**
```
Recording: No
```

**Si erreur:**
- Vérifiez qu'OBS est lancé
- Vérifiez le mot de passe dans `.env`
- Vérifiez le port 4455

## 💻 VS Code ne s'ouvre pas

### Vérifiez le chemin dans config.yaml

```yaml
paths:
  vscode: "C:\\Users\\VotreName\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe"
```

### Trouvez le bon chemin
```powershell
# Rechercher Code.exe
where code
# OU
Get-Command code | Select-Object Source
```

### Chemins courants
- **User install**: `%LOCALAPPDATA%\Programs\Microsoft VS Code\Code.exe`
- **System install**: `C:\Program Files\Microsoft VS Code\Code.exe`

### Test manuel
```powershell
& "C:\Users\VotreName\AppData\Local\Programs\Microsoft VS Code\Code.exe" test.html
```

## 📝 Erreur PowerShell: Scripts désactivés

### Erreur
```
execution of scripts is disabled on this system
```

### Solution
Ouvrez PowerShell **en administrateur**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Redémarrez votre terminal puis:
```powershell
npm install
```

## 🎬 FFmpeg non trouvé

### Erreur
```
'ffmpeg' is not recognized
```

### Installation

#### Option 1: Via Chocolatey
```powershell
choco install ffmpeg
```

#### Option 2: Via Winget
```powershell
winget install Gyan.FFmpeg
```

#### Option 3: Manuelle
1. Télécharger: https://www.gyan.dev/ffmpeg/builds/
2. Extraire dans `C:\ffmpeg`
3. Ajouter `C:\ffmpeg\bin` au PATH système
4. Redémarrer le terminal

### Vérification
```powershell
ffmpeg -version
```

## 📦 Dépendances Python manquantes

### Erreur
```
ModuleNotFoundError: No module named 'obswebsocket'
```

### Solution
```powershell
pip install -r scripts/requirements.txt
```

### Si pip n'est pas trouvé
```powershell
python -m pip install -r scripts/requirements.txt
```

### Dépendances requises
- `obs-websocket-py` - Contrôle OBS
- `pyautogui` - Simulation de frappe
- `pyyaml` - Configuration
- `requests` - API Instagram

## 🔍 Logs en temps réel

### Voir les logs du serveur
```powershell
npm run dev:server
```

### Voir les logs Python
Le serveur Node affiche maintenant les logs Python en temps réel dans la console!

### Logs de job spécifique
Allez sur la page de détails du job dans l'interface web - section **"Logs"**

## 🧪 Tests étape par étape

### Test 1: OBS Control
```powershell
# OBS doit être lancé
python scripts/obs_control.py start
# Attendre 5 secondes
python scripts/obs_control.py stop
```

### Test 2: Typing Simulation
```powershell
# Ouvrir VS Code d'abord
code test.html
# Puis lancer (focus VS Code!)
python scripts/type_sim.py --file snippets/001_glassmorphism.html
```

### Test 3: Browser Demo
```powershell
python scripts/browser_demo.py --file snippets/001_glassmorphism.html
```

### Test 4: FFmpeg Processing
```powershell
# Créer un fichier test vidéo d'abord
powershell -File scripts/compose_ffmpeg.ps1 -In input.mp4 -Out output.mp4
```

### Test 5: Pipeline complet
```powershell
python scripts/orchestrator.py --job-id 999 --code-file snippets/001_glassmorphism.html --title "Test"
```

## 📊 Checklist de vérification

Avant de créer un Reel, vérifiez:

- [ ] ✅ Python installé (`python --version`)
- [ ] ✅ Dépendances Python installées (`pip list`)
- [ ] ✅ Node.js installé (`node --version`)
- [ ] ✅ Dépendances npm installées (`npm list`)
- [ ] ✅ OBS lancé et WebSocket activé
- [ ] ✅ VS Code installé
- [ ] ✅ FFmpeg dans PATH (`ffmpeg -version`)
- [ ] ✅ Chemins corrects dans `config.yaml`
- [ ] ✅ `.env` configuré avec mot de passe OBS
- [ ] ✅ Scripts PowerShell activés

## 🚨 Problèmes courants

### "Le processus s'est terminé avec le code 1"

**Causes possibles:**
1. Python non trouvé
2. Dépendance manquante
3. OBS non lancé
4. Chemin VS Code incorrect
5. FFmpeg non trouvé

**Solution:**
Vérifiez les logs dans l'interface - ils indiqueront l'étape qui a échoué.

### "OBS WebSocket connection failed"

**Vérifications:**
1. OBS est lancé ✅
2. WebSocket est activé ✅
3. Port = 4455 ✅
4. Mot de passe correct dans `.env` ✅
5. Firewall ne bloque pas le port ✅

### "TypeError: spawn is not a function"

**Cause:** Version Node.js trop ancienne

**Solution:**
```powershell
node --version
# Si < 18, mettre à jour
winget install OpenJS.NodeJS.LTS
```

### Vidéo créée mais durée incorrecte

**Cause:** La durée cible n'est pas respectée par la simulation de frappe

**Solutions:**
1. Ajustez `target_duration_s` dans `config.yaml`
2. Ajustez `min_delay_s` et `max_delay_s` pour la frappe
3. Code trop court → ajoutez plus de contenu
4. Code trop long → réduisez ou augmentez la durée cible

## 📞 Obtenir de l'aide

### Informations à fournir

Quand vous signalez un bug, incluez:

1. **Version de chaque outil:**
```powershell
node --version
python --version
npm --version
ffmpeg -version
```

2. **Logs complets** de la console serveur

3. **Logs du job** depuis l'interface web

4. **Configuration** (sans les secrets!):
```powershell
# Anonymisez les mots de passe avant de partager
type config.yaml
type .env
```

5. **Description des étapes** pour reproduire le problème

### Fichiers de log

Les logs sont dans:
- **Console Node:** stdout du terminal `npm run dev`
- **Interface web:** Page Job Details → Section Logs
- **Fichiers vidéo:** `out/raw/`, `out/final/`

## 💡 Astuces de débogage

### Mode verbeux Python
```powershell
# Voir tous les outputs Python
set PYTHONUNBUFFERED=1
npm run dev
```

### Tester chaque script indépendamment
Ne testez pas le pipeline complet d'abord. Testez:
1. ✅ OBS control
2. ✅ VS Code opening
3. ✅ Typing sim
4. ✅ Browser launch
5. ✅ FFmpeg
6. ✅ Pipeline complet

### Réduire la durée pour les tests
Dans `config.yaml`:
```yaml
reel:
  target_duration_s: 15  # Au lieu de 45
```

Ça accélère les tests!

### Logs détaillés
Chaque script Python log ses actions. Suivez-les en temps réel dans la console Node.

---

**Si le problème persiste après ces vérifications, créez une issue GitHub avec tous les détails! 🐛**
