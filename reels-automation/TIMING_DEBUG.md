# 🐛 Debug du Timing - Système Actuel

## 📊 Pour une vidéo de 32 secondes

### Timeline Théorique
```
0s - 5s   : Intro (5 secondes)
5s - 27s  : Code (22 secondes) - 32 - 10 = 22
27s - 29s : Transition (2 secondes)
29s - 32s : Final (3 secondes)
Total     : 32 secondes
```

### Calcul de la Vitesse
```javascript
// Dans stream-view.html
const introDuration = 5
const transitionDuration = 2
const finalDisplayDuration = 3
const totalFixedDuration = 10

const typingDuration = 32 - 10 = 22 secondes
const totalLines = 167 lignes
const lineSpeed = (22 * 1000) / 167 = 131.7 ms par ligne
```

### Timeline Python (orchestrator.py)
```python
0s    : Fenêtre s'ouvre
1s    : OBS démarre (time.sleep(1))
1s-33s: OBS enregistre (time.sleep(32))
33s   : OBS s'arrête
```

## ❌ Problèmes Potentiels

### Problème 1 : Décalage OBS
- Python attend 1s puis démarre OBS
- Mais OBS met ~0.5s à vraiment démarrer
- Le navigateur a déjà commencé l'intro
- **Résultat** : Perte des premières 1-1.5 secondes

### Problème 2 : Timing JavaScript
- L'intro démarre immédiatement au chargement
- Mais le chargement peut prendre 0.5-1s
- **Résultat** : Décalage entre navigateur et OBS

### Problème 3 : Durée OBS
- Python attend exactement 32s
- Mais si OBS met 0.5s à démarrer
- La vidéo fait 32.5s au lieu de 32s

## ✅ Solution Proposée

### Option A : Synchronisation via Signal
1. Navigateur montre écran noir
2. Python démarre OBS
3. Python envoie signal au navigateur
4. Navigateur démarre l'intro
5. Timing parfait

### Option B : Timing Simplifié
1. Navigateur gère tout son timing
2. Python démarre OBS immédiatement
3. Python attend durée + 2s de marge
4. Python arrête OBS
5. FFmpeg coupe la vidéo à la durée exacte

### Option C : Intro Fixe Courte
1. Réduire intro à 2s au lieu de 5s
2. Plus de temps pour le code
3. Moins de risque de désynchronisation

## 🎯 Recommandation

**Utiliser Option B** : Laisser une marge de 2-3 secondes, puis couper en post-processing.

```python
# Dans orchestrator.py
time.sleep(args.video_duration + 2)  # Marge de sécurité

# Puis dans post_process, ajouter :
ffmpeg -i input.mp4 -t 32 -c copy output.mp4
```

## 📝 Tests à Faire

1. Chronométrer manuellement la vidéo
2. Vérifier les logs de la console
3. Noter l'heure exacte de chaque événement
4. Comparer avec le timing attendu
