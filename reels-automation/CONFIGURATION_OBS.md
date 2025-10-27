# 📹 Configuration OBS pour Masquer la Barre de Titre

## 🎯 Objectif

Capturer uniquement le contenu de la fenêtre Stream View **sans la barre de titre** Chrome (boutons minimiser/agrandir/fermer et titre de la fenêtre).

## ✅ Solution 1 : Capture Client Area (Recommandé)

### Étapes dans OBS :

1. **Ajouter une source "Window Capture"**
   - Dans OBS, cliquez sur **+** sous "Sources"
   - Sélectionnez **"Window Capture"** (Capture de fenêtre)
   - Nommez-la "Stream View"

2. **Configurer la source**
   - **Window** : Sélectionnez `[chrome.exe]: Stream View - Reels Automation`
   - **Capture Method** : `Windows 10 (1903 and newer)`
   - ✅ **Cochez** : `Capture Client Area Only` (**IMPORTANT !**)
   - ❌ **Décochez** : `Capture Cursor`

3. **Ajuster la taille**
   - La capture devrait maintenant être 608x1080 (sans barre de titre)
   - Redimensionnez si nécessaire dans la scène OBS

## ✅ Solution 2 : Crop Filter

Si la Solution 1 ne fonctionne pas :

1. **Ajouter un filtre Crop**
   - Clic droit sur la source "Stream View"
   - Sélectionnez **"Filters"**
   - Cliquez sur **+** sous "Effect Filters"
   - Ajoutez **"Crop/Pad"**

2. **Configurer le crop**
   - **Top** : `35` (pour couper la barre de titre)
   - **Bottom** : `0`
   - **Left** : `0`
   - **Right** : `0`

3. **Ajuster**
   - Testez et ajustez la valeur "Top" jusqu'à ce que la barre disparaisse complètement
   - Généralement entre 30-40 pixels selon votre système

## ✅ Solution 3 : Crop Manuel dans la Scène

1. **Sélectionner la source** dans OBS
2. **Maintenir ALT** et glisser le bord supérieur vers le bas
3. Cela va "cropper" la barre de titre
4. Redimensionner ensuite pour remplir le canvas

## 📐 Configuration Scène OBS Recommandée

### Canvas OBS :
```
Résolution : 1080 x 1920 (Portrait 9:16)
FPS        : 30
```

### Source Stream View :
```
Type       : Window Capture
Window     : Stream View - Reels Automation
Method     : Windows 10 (1903+)
Options    : ✓ Client Area Only
             ✗ Cursor
```

### Position dans la scène :
```
X : 0
Y : 0
Width  : 1080
Height : 1920
```

## 🎬 Vérification

Une fois configuré, vous devriez voir :

✅ **Visible :**
- Header avec logo SiteOnweb.fr
- Section code
- Compteur de lignes
- Section résultat

❌ **Masqué :**
- Barre de titre Windows
- Boutons minimiser/agrandir/fermer
- Nom de la fenêtre

## 🔧 Troubleshooting

### La barre de titre est toujours visible ?

1. Vérifiez que **"Capture Client Area Only"** est bien coché
2. Essayez de changer le **Capture Method**
3. Utilisez la Solution 2 (Crop Filter) en backup

### La fenêtre n'apparaît pas dans OBS ?

1. Vérifiez que la fenêtre Stream View est ouverte
2. Rafraîchissez la liste des fenêtres dans OBS
3. Essayez "Display Capture" en dernier recours (moins précis)

### La qualité est mauvaise ?

1. Dans OBS Settings → Video
2. Vérifiez que **Base Resolution** = `1080x1920`
3. **Output Resolution** = `1080x1920` (pas de downscale)
4. Dans Settings → Output → Recording
5. **Encoder** : x264 ou NVENC H.264
6. **Rate Control** : CBR
7. **Bitrate** : 6000-8000 Kbps

## 📱 Format Final

Votre vidéo finale sera :
```
Résolution : 1080 x 1920
Ratio      : 9:16 (Portrait)
FPS        : 30
Format     : MP4 (H.264)
Audio      : AAC 192kbps
```

Parfait pour :
- ✅ Instagram Reels
- ✅ TikTok
- ✅ YouTube Shorts
- ✅ Facebook Reels

---

**Note** : La barre de titre Windows est une limitation du système d'exploitation. La seule façon de l'enlever complètement est de capturer uniquement la "Client Area" dans OBS, ce qui est la méthode recommandée.
