# 🚀 Quick Debug - Comment Débugger Rapidement

## ❌ Vous avez une erreur ? Suivez ces étapes :

### 1. Validation Rapide (30 secondes)

```powershell
cd scripts
.\validate_environment.ps1
```

✅ **Si tout est OK** : L'environnement est bon
❌ **Si erreurs** : Essayez de corriger automatiquement :

```powershell
.\validate_environment.ps1 -FixIssues
```

### 2. Tester FFmpeg (si erreur post-processing)

```powershell
.\debug_ffmpeg.ps1
```

Cela va :
- ✅ Vérifier FFmpeg est installé
- ✅ Vérifier les assets (logo, musique)
- ✅ Tester la syntaxe des commandes

### 3. Relancer avec les nouveaux logs

Le système a maintenant des **logs DEBUG activés**. Quand vous relancez un job, vous verrez :

```
📌 Step 1: Adding brand overlay...
   [DEBUG] Input: C:\path\to\input.mp4
   [DEBUG] Logo: assets\brand\logo.png
   [DEBUG] Output: out\final\step1_brand.mp4
   [DEBUG] Command: ffmpeg -i ... (commande complète)
```

Ces logs vous montrent **EXACTEMENT** :
- Quel fichier est utilisé
- Quelle commande est exécutée
- Où elle échoue

### 4. Envoyer les logs

Maintenant, copiez les logs (avec les lignes `[DEBUG]`) et envoyez-les. On pourra voir exactement ce qui ne va pas !

## 🔧 Outils Disponibles

| Outil | Usage | Quand l'utiliser |
|-------|-------|------------------|
| `validate_environment.ps1` | Validation complète | Avant de lancer un job |
| `debug_ffmpeg.ps1` | Tests FFmpeg | Erreur post-processing |
| `debug_helper.py` | Interface Python | Alternative aux scripts PS |

## 📋 Checklist Avant de Débugger

Avant de m'envoyer les logs, vérifiez :

1. ✅ FFmpeg installé : `ffmpeg -version`
2. ✅ Assets existent : 
   - `assets\brand\logo.png` (optionnel)
   - `assets\music\tech-energy.mp3` (optionnel)
3. ✅ OBS lancé (si vous enregistrez)
4. ✅ VS Code fonctionne : `code --version`

## 🐛 Erreurs Courantes

### "Error opening input file -af"

**Cause** : Problème dans compose_ffmpeg.ps1
**Solution** : Les nouveaux logs DEBUG montrent maintenant la vraie cause

### "Step 2 output file not found"

**Cause** : Step 1 ou 2 a échoué silencieusement
**Solution** : Regardez les logs DEBUG de Step 1 et 2

### "FFmpeg not found"

**Cause** : FFmpeg pas dans le PATH
**Solution** : 
```powershell
.\validate_environment.ps1 -FixIssues
```

## 💡 Mode Dev

Si vous développez sur le projet :

1. **Garder les fichiers intermédiaires** : Commentez dans `compose_ffmpeg.ps1` :
   ```powershell
   # Clean up intermediate files
   # if ($step1 -ne $In) { Remove-Item $step1 -ErrorAction SilentlyContinue }
   ```

2. **Plus de logs** : Les logs DEBUG sont déjà activés !

3. **Tester FFmpeg manuellement** :
   ```powershell
   ffmpeg -i "input.mp4" -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:v copy "output.mp4"
   ```

## 📞 Besoin d'Aide ?

1. **Lancez** : `.\validate_environment.ps1`
2. **Relancez** le job qui a échoué
3. **Copiez** tous les logs (surtout les lignes `[DEBUG]`)
4. **Envoyez-moi** les logs

Les nouveaux logs sont beaucoup plus détaillés et montrent exactement ce qui se passe !

---

## 🎯 TL;DR - Version Ultra Courte

```powershell
# 1. Valider
cd scripts
.\validate_environment.ps1

# 2. Si erreur FFmpeg
.\debug_ffmpeg.ps1

# 3. Relancer le job et copier les logs [DEBUG]
```

C'est tout ! 🎉
