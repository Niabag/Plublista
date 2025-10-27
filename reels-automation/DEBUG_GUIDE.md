# 🔧 Guide de Débogage - Reels Automation

Ce guide vous aide à diagnostiquer et résoudre les problèmes dans le système d'automatisation de Reels.

## 🚀 Démarrage Rapide

### 1. Validation de l'environnement

Avant de lancer l'automatisation, validez votre environnement :

```powershell
# Vérifier l'environnement
cd scripts
.\validate_environment.ps1

# Vérifier et corriger automatiquement
.\validate_environment.ps1 -FixIssues
```

Ou utilisez le helper Python :

```bash
py scripts/debug_helper.py --validate
py scripts/debug_helper.py --validate --fix
```

### 2. Déboguer FFmpeg

Si vous avez des problèmes de post-processing :

```powershell
# Test complet FFmpeg
.\scripts\debug_ffmpeg.ps1

# Tester avec un fichier vidéo spécifique
.\scripts\debug_ffmpeg.ps1 -InputFile "path\to\video.mp4" -OutputFile "path\to\output.mp4"
```

### 3. Analyser les logs

Pour analyser les erreurs dans les logs :

```bash
# Copier vos logs dans un fichier
# Puis analyser
py scripts/debug_helper.py --analyze-logs --log-file "error.log"
```

### 4. Tester un fichier vidéo

Pour vérifier qu'un fichier vidéo est valide :

```bash
py scripts/debug_helper.py --test-video "path/to/video.mp4"
```

## 🐛 Problèmes Courants

### Problème 1: "Error opening input file -af"

**Symptômes:**
- L'étape de post-processing échoue
- Message d'erreur : `Error opening input file -af`

**Cause:**
- Problème de construction de commande PowerShell FFmpeg
- Un fichier intermédiaire (step1 ou step2) n'existe pas

**Solution:**
1. Vérifier les logs détaillés dans `compose_ffmpeg.ps1` (maintenant avec DEBUG)
2. Vérifier que les fichiers intermédiaires existent :
   ```powershell
   ls out/final/step*.mp4
   ```
3. Relancer avec les nouveaux logs activés

**Exemple de sortie DEBUG:**
```
📌 Step 1: Adding brand overlay...
   [DEBUG] Input: C:\path\to\input.mp4
   [DEBUG] Logo: assets\brand\logo.png
   [DEBUG] Output: out\final\step1_brand.mp4
   [DEBUG] Command: ffmpeg -i C:\path\to\input.mp4 -i assets\brand\logo.png ...
```

### Problème 2: FFmpeg non trouvé

**Symptômes:**
- "FFmpeg not found in PATH"
- Scripts échouent immédiatement

**Solution:**
```powershell
# Option 1: Installer via WinGet
winget install Gyan.FFmpeg

# Option 2: Vérifier si déjà installé
.\scripts\debug_ffmpeg.ps1

# Option 3: Ajouter manuellement au PATH
$env:Path += ";C:\path\to\ffmpeg\bin"
```

### Problème 3: Fichiers intermédiaires manquants

**Symptômes:**
- Step 3 échoue avec "file not found"
- Step 1 ou 2 a échoué silencieusement

**Solution:**
1. Les nouveaux logs DEBUG montrent maintenant chaque étape
2. Vérifier les assets :
   ```powershell
   # Vérifier logo
   Test-Path assets\brand\logo.png
   
   # Vérifier musique
   Test-Path assets\music\tech-energy.mp3
   ```

### Problème 4: VS Code ne s'ouvre pas

**Symptômes:**
- "Open VS Code failed"

**Solution:**
```bash
# Vérifier que 'code' est disponible
code --version

# Si non disponible, réinstaller VS Code avec l'option PATH
# Ou utiliser le chemin complet dans config.yaml
```

### Problème 5: OBS ne démarre pas l'enregistrement

**Symptômes:**
- "OBS recording failed"

**Solution:**
1. Vérifier OBS est lancé
2. Vérifier WebSocket est activé (Tools > obs-websocket Settings)
3. Vérifier le port dans `config.yaml` (défaut: 4455)

## 📊 Comprendre les Logs

### Logs Normaux (SUCCESS)

```
[11:57:40] [INFO] Starting Reels automation for Job #2
[11:57:40] [SUCCESS] ✅ Open VS Code completed
[11:57:55] [SUCCESS] ✅ Paste code completed
```

### Logs de Débogage (DEBUG)

Les nouveaux logs incluent des informations détaillées :

```
📌 Step 1: Adding brand overlay...
   [DEBUG] Input: C:\Users\...\video.mp4
   [DEBUG] Logo: assets\brand\logo.png
   [DEBUG] Output: out\final\step1_brand.mp4
   [DEBUG] Command: ffmpeg -i ... -filter_complex ... -map ...
   Brand overlay added successfully
```

### Logs d'Erreur (ERROR)

```
[11:58:20] [ERROR] ❌ Post-process video failed
   ERROR: Audio normalization failed
   FFmpeg exit code: 1
   [DEBUG] Failed command: ffmpeg -i step2_music.mp4 -af loudnorm=...
   Last error lines:
     Error opening input file -af
```

## 🛠️ Outils de Débogage

### 1. `validate_environment.ps1`

Valide tout l'environnement :
- FFmpeg, Python, Node.js
- Fichiers de configuration
- Dépendances Python
- Répertoires assets
- VS Code, OBS

### 2. `debug_ffmpeg.ps1`

Tests FFmpeg spécifiques :
- Installation et version
- Chemins des fichiers assets
- Analyse des fichiers vidéo
- Test de syntaxe des commandes

### 3. `debug_helper.py`

Interface Python unifiée :
- Validation complète
- Débogage FFmpeg
- Analyse de logs
- Test de fichiers vidéo

### 4. Logs dans `compose_ffmpeg.ps1`

Le script amélioré affiche maintenant :
- Chemins complets des fichiers
- Commandes FFmpeg exactes
- État de chaque étape
- Messages d'erreur détaillés

## 📝 Workflow de Débogage

### Quand un job échoue :

1. **Sauvegarder les logs**
   ```bash
   # Copier les logs de la console dans un fichier
   ```

2. **Valider l'environnement**
   ```bash
   py scripts/debug_helper.py --validate
   ```

3. **Analyser les logs**
   ```bash
   py scripts/debug_helper.py --analyze-logs --log-file error.log
   ```

4. **Déboguer le composant spécifique**
   - FFmpeg : `.\scripts\debug_ffmpeg.ps1`
   - Vidéo : `py scripts/debug_helper.py --test-video "path/to/video.mp4"`

5. **Tester la correction**
   - Relancer le job avec les logs DEBUG activés
   - Observer les messages `[DEBUG]` pour comprendre le problème

### Mode Développement

Pour activer plus de logs pendant le développement :

1. Dans `compose_ffmpeg.ps1`, les logs DEBUG sont maintenant permanents
2. Dans `orchestrator.py`, augmenter les logs :
   ```python
   # Décommenter pour plus de détails
   subprocess.run(..., capture_output=True)
   ```

## 🎯 Checklist Avant Lancement

- [ ] `py scripts/debug_helper.py --validate` réussit
- [ ] FFmpeg fonctionne : `ffmpeg -version`
- [ ] VS Code fonctionne : `code --version`
- [ ] OBS est lancé et WebSocket activé
- [ ] Les assets existent (logo, musique)
- [ ] Les répertoires out/ et workspace/ existent
- [ ] Python packages installés : `pip list | grep pyautogui`

## 💡 Astuces

### Activer le mode verbeux

Dans `orchestrator.py`, modifier :
```python
# Ligne 44-50
result = subprocess.run(
    cmd,
    shell=True,
    capture_output=False,  # Changé de True à False pour voir en temps réel
    ...
)
```

### Garder les fichiers intermédiaires

Dans `compose_ffmpeg.ps1`, commenter :
```powershell
# Clean up intermediate files
# if ($step1 -ne $In) { Remove-Item $step1 -ErrorAction SilentlyContinue }
# if ($step2 -ne $step1) { Remove-Item $step2 -ErrorAction SilentlyContinue }
```

### Tester FFmpeg manuellement

```powershell
# Tester la normalisation audio
ffmpeg -i input.mp4 -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:v copy -c:a aac output.mp4
```

## 📞 Support

Si le problème persiste :

1. Exécuter tous les tests :
   ```bash
   py scripts/debug_helper.py --validate
   .\scripts\debug_ffmpeg.ps1
   ```

2. Collecter les informations :
   - Logs complets
   - Version FFmpeg : `ffmpeg -version`
   - Version Python : `python --version`
   - Système : Windows version

3. Partager les logs avec les messages `[DEBUG]` et `[ERROR]`

## 🔄 Mises à Jour

### Version 1.1 (Actuelle)

✅ **Ajouté:**
- Logs DEBUG dans `compose_ffmpeg.ps1`
- Script `validate_environment.ps1`
- Script `debug_ffmpeg.ps1`
- Helper Python `debug_helper.py`
- Meilleure gestion d'erreurs FFmpeg
- Validation des fichiers intermédiaires

🐛 **Corrigé:**
- Construction des commandes FFmpeg (utilisation de `@()`)
- Détection des erreurs silencieuses
- Affichage des commandes exactes en cas d'erreur
