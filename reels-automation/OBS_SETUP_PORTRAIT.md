# 📹 Configuration OBS pour Stream View Portrait

## 🎯 Format de la Fenêtre

La Stream View s'ouvre en format **portrait 9:16** (608x1080 pixels) :
- **Code source** en haut (60% de la hauteur)
- **Résultat** en bas (40% de la hauteur)
- Format parfait pour Instagram Reels

## ⚙️ Configuration OBS

### 1. Créer une Scène Portrait

1. **Ouvrir OBS Studio**
2. **Paramètres → Vidéo**
   - Résolution de base : `1080x1920` (portrait)
   - Résolution de sortie : `1080x1920`
   - FPS : `30`

### 2. Ajouter la Source

1. **Créer une nouvelle scène** : "Reels Automation"
2. **Ajouter une source** : 
   - Choisir **"Capture de fenêtre"** (Window Capture)
   - Nom : "Stream View"
3. **Sélectionner la fenêtre** :
   - Chercher : `chrome.exe` ou `msedge.exe`
   - Titre contenant : "Stream View"
4. **Ajuster la capture** :
   - Cocher "Capturer le curseur" (optionnel)
   - Transformer la source pour remplir l'écran :
     - Clic droit → Transformer → Ajuster à l'écran

### 3. Option Alternative : Display Capture

Si Window Capture ne fonctionne pas :

1. **Ajouter une source** : "Capture d'écran" (Display Capture)
2. **Recadrer pour capturer uniquement la fenêtre Stream View** :
   - Clic droit sur la source → Filtres
   - Ajouter "Recadrage/Remplissage"
   - Ajuster pour isoler la fenêtre Stream View

## 🎬 Workflow de Recording

### Avant d'enregistrer

1. ✅ Lancer un job depuis l'interface web
2. ✅ La Stream View s'ouvre automatiquement (608x1080)
3. ✅ Vérifier que OBS capture bien la fenêtre
4. ✅ Vérifier l'audio (si activé)

### Pendant l'automatisation

1. **OBS démarre automatiquement** via l'orchestrator Python
2. **Le code s'affiche en haut**
3. **Le résultat s'affiche en bas**
4. **Recording de ~10 secondes**
5. **OBS arrête automatiquement**

### Après l'enregistrement

- La vidéo brute est dans : `out/raw/`
- La vidéo finale (avec branding) est dans : `out/final/`

## 🎨 Améliorations Optionnelles

### Ajouter un Overlay

1. **Créer un logo/watermark**
2. **Ajouter une source Image** dans OBS
3. **Position** : Coin supérieur droit ou inférieur
4. **Opacité** : 70-80%

### Ajouter de la Musique

Le post-processing FFmpeg peut ajouter de la musique automatiquement.
Configurez dans `config.yaml` :

```yaml
music:
  enabled: true
  style: "tech/energetic"
  target_lufs: -16.0
  bgm_volume: 0.15
```

## 📐 Dimensions Recommandées

| Format | Résolution | Ratio | Usage |
|--------|-----------|-------|-------|
| Portrait | 1080x1920 | 9:16 | Instagram Reels, TikTok, YouTube Shorts |
| Portrait Alt | 608x1080 | 9:16 | Stream View (scaled) |
| Carré | 1080x1080 | 1:1 | Instagram Feed |
| Paysage | 1920x1080 | 16:9 | YouTube, Facebook |

## 🛠️ Troubleshooting

### La fenêtre n'apparaît pas dans OBS

**Solution** : 
- Assurez-vous que la Stream View est bien ouverte
- Essayez de redémarrer OBS
- Utilisez "Display Capture" au lieu de "Window Capture"

### La capture est floue

**Solution** :
- Paramètres OBS → Sortie → Enregistrement
- Encoder : x264
- Débit : 12000-16000 Kbps
- Préréglage : High Quality

### L'audio ne s'enregistre pas

**Solution** :
- Paramètres OBS → Audio
- Vérifier les périphériques d'entrée/sortie
- Ajouter une source "Capture audio du bureau"

## 📝 Notes

- La Stream View se ferme automatiquement après l'enregistrement
- OBS doit être ouvert AVANT de lancer un job
- Configurez le mot de passe WebSocket dans `.env` :
  ```
  OBS_PASSWORD=votre_mot_de_passe
  ```

---

**Pour plus d'aide, consultez** : [OBS_PORTRAIT_GUIDE.md](./OBS_PORTRAIT_GUIDE.md)
