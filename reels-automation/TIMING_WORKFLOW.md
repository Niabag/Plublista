# ⏱️ Timeline Complète de l'Enregistrement

## 📊 Séquence Temporelle (16 secondes total)

```
┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOW COMPLET - 16s                        │
└─────────────────────────────────────────────────────────────────┘

Seconde 0   : 🚀 Fenêtre Stream View s'ouvre
              📹 OBS DÉMARRE L'ENREGISTREMENT
              
Seconde 0-3 : ⏳ COMPTE À REBOURS VISIBLE
              │
              ├─ 3... (affiché à l'écran)
              ├─ 2... (affiché à l'écran)
              ├─ 1... (affiché à l'écran)
              └─ GO! (affiché à l'écran)
              
              🎵 Musique démarre
              
Seconde 3-11: ⌨️ ANIMATION DE TYPING (8 secondes)
              │
              ├─ Code s'écrit caractère par caractère
              ├─ Numéros de ligne défilent
              ├─ Scroll automatique
              └─ Résultat s'affiche en temps réel en bas
              
Seconde 11-16: 👁️ PAUSE VISUELLE (5 secondes)
               │
               ├─ Code complet affiché
               ├─ Résultat final visible
               └─ Musique continue
               
Seconde 16  : 🛑 OBS ARRÊTE L'ENREGISTREMENT
              🪟 Fenêtre se ferme automatiquement
              🎬 Post-processing démarre
```

## 🎬 Détail des Phases

### Phase 1 : Préparation (1 seconde)
- **0.0s** : Fenêtre Stream View s'ouvre
- **0.5s** : OBS reçoit le signal de démarrage
- **1.0s** : **🔴 RECORDING DÉMARRE**

### Phase 2 : Countdown (3 secondes)
- **1.0s** : Affichage "3"
- **2.0s** : Affichage "2"
- **3.0s** : Affichage "1"
- **4.0s** : Affichage "GO!" + Musique démarre

### Phase 3 : Animation (8 secondes)
- **4.0s-12.0s** : Code s'écrit progressivement
  - Vitesse adaptée au nombre de lignes
  - Résultat HTML se construit en parallèle
  - Auto-scroll pour suivre le code

### Phase 4 : Résultat Final (5 secondes)
- **12.0s-17.0s** : Code et résultat affichés
  - Temps pour apprécier le résultat
  - Musique continue
  - Vue complète stable

### Phase 5 : Fin (instantané)
- **17.0s** : **⏹️ RECORDING S'ARRÊTE**
- Post-processing démarre
- Fenêtre se ferme

## 📹 Contenu de la Vidéo Finale

Votre vidéo de 16 secondes contiendra :

1. **✅ Compte à rebours complet** (3s)
   - Effet dynamique
   - Anticipation
   - Professionnel

2. **✅ Animation de code** (8s)
   - Typing progressif
   - Résultat en temps réel
   - Musique synchronisée

3. **✅ Résultat final** (5s)
   - Code complet visible
   - Rendu HTML final
   - Call-to-action possible

## 🎨 Optimisations Possibles

### Si la vidéo est trop courte
Modifier dans `scripts/templates/stream-view.html` ligne 335 :
```javascript
const targetDuration = 8000; // Augmenter pour ralentir le typing
```

### Si la pause finale est trop longue
Modifier dans `scripts/orchestrator.py` ligne 373 :
```python
time.sleep(16)  # Réduire le total (ex: 14 pour 3s de pause)
```

### Pour un countdown plus long
Modifier dans `scripts/templates/stream-view.html` ligne 330 :
```javascript
let countdown = 3;  // Augmenter (ex: 5)
```

## 📐 Format de Sortie

- **Résolution** : 1080x1920 (Portrait 9:16)
- **Durée** : ~16 secondes
- **Audio** : Musique de fond + normalisé à -16 LUFS
- **Codec** : H.264 (MP4)
- **FPS** : 30

## 🎯 Parfait Pour

- ✅ Instagram Reels (max 90s)
- ✅ TikTok (3-60s recommandé)
- ✅ YouTube Shorts (max 60s)
- ✅ Facebook Reels

## 🔧 Configuration OBS

Pour capturer correctement le countdown :

1. **Démarrer OBS** avant de lancer le Reel
2. **Configurer la scène** :
   - Source : Window Capture (Chrome/Edge)
   - Format : 1080x1920 (Portrait)
3. **Paramètres d'enregistrement** :
   - Encoder : x264
   - Qualité : High
   - FPS : 30

## ⚡ Timeline Technique

```
T = 0s    : launch_stream_view() → Chrome démarre
T = +1s   : start_recording() → OBS ⏺️
T = +1s   : Countdown commence (JavaScript)
T = +4s   : startTypingAnimation() → Code commence
T = +12s  : Code terminé, résultat complet
T = +17s  : stop_recording() → OBS ⏹️
T = +17s  : close_stream_view() → Fenêtre ferme
T = +18s  : post_process() → FFmpeg traite
```

---

**Timeline optimisée pour capture parfaite du workflow complet !** ⏱️🎬
