# ⏱️ Timing Final - Formule Exacte

## 📐 Formule Simple

```
Durée de typing = Durée totale - 5 secondes
Affichage final = 5 secondes (fixe)
```

## 🎬 Timeline pour N'importe Quelle Durée

```
┌──────────────────────────────────────────────────┐
│         WORKFLOW - Durée Exacte Demandée          │
└──────────────────────────────────────────────────┘

Seconde 0-3        : ⏳ Countdown (NON enregistré)
                     🎵 Musique démarre après GO!

Seconde 3          : 🔴 OBS DÉMARRE L'ENREGISTREMENT

Seconde 3 à X-5    : ⌨️ CODE S'ÉCRIT
                     - Vitesse ajustée automatiquement
                     - Résultat en temps réel
                     - Compteur s'incrémente

Seconde X-5 à X-3  : 🎭 TRANSITION (2 secondes)
                     - Code glisse vers le haut
                     - Résultat prend tout l'écran

Seconde X-3 à X    : 👁️ RÉSULTAT FINAL (3 secondes)
                     - Plein écran
                     - Animation continue

Seconde X          : 🛑 OBS S'ARRÊTE
                     = Vidéo finale de X secondes
```

## 📊 Exemples Concrets

### Vidéo de 20 secondes
```
Typing   : 15 secondes (20 - 5)
Transition: 2 secondes
Résultat : 3 secondes
─────────────────────
Total    : 20 secondes ✓
```

### Vidéo de 30 secondes
```
Typing   : 25 secondes (30 - 5)
Transition: 2 secondes
Résultat : 3 secondes
─────────────────────
Total    : 30 secondes ✓
```

### Vidéo de 45 secondes
```
Typing   : 40 secondes (45 - 5)
Transition: 2 secondes
Résultat : 3 secondes
─────────────────────
Total    : 45 secondes ✓
```

### Vidéo de 60 secondes
```
Typing   : 55 secondes (60 - 5)
Transition: 2 secondes
Résultat : 3 secondes
─────────────────────
Total    : 60 secondes ✓
```

## 🎯 Garanties

✅ **Durée exacte** : La vidéo fera EXACTEMENT la durée demandée
✅ **5 secondes finales** : Toujours 2s transition + 3s résultat
✅ **Typing ajusté** : Vitesse calculée automatiquement
✅ **Pas de countdown** : Le compte à rebours n'est pas enregistré

## 🔧 Ajustement Automatique

Le système calcule automatiquement la vitesse de typing :

```javascript
typingSpeed = typingDuration / nombreDeCaractères
```

**Résultat :**
- Code court → typing plus lent
- Code long → typing plus rapide
- Durée finale → TOUJOURS exacte

## 📹 Configuration

Dans l'interface web, sélectionnez simplement la durée souhaitée :
- Minimum : 15 secondes (10s typing + 5s final)
- Maximum : 90 secondes (85s typing + 5s final)
- Recommandé : 20-45 secondes

## ⚡ Performance

| Durée | Lignes de code | Vitesse typing |
|-------|----------------|----------------|
| 20s   | ~100 lignes    | Moyenne        |
| 30s   | ~200 lignes    | Moyenne        |
| 45s   | ~300 lignes    | Rapide         |
| 60s   | ~400 lignes    | Très rapide    |

---

**Formule à retenir : Typing = Durée - 5s** ⏱️
