# 🎵 Ajouter de la Musique - Guide Rapide (3 minutes)

## ⚡ Méthode Rapide

### Étape 1 : Télécharger une musique (1 minute)

Allez sur **Pixabay Music** (gratuit, sans compte requis) :
👉 https://pixabay.com/music/search/tech/

**Recommandations** :
- Recherchez : "tech", "electronic", "upbeat"
- Durée : Au moins 15 secondes
- Triez par : Popularité ou Téléchargements

**Suggestions directes** :
- "Chill Abstract Intention" par Pufino
- "Tech House vibes" par LiteSaturation  
- "Technology" par Grand_Project

### Étape 2 : Renommer (10 secondes)

Après téléchargement, renommez le fichier en :
```
tech-energy.mp3
```

### Étape 3 : Placer le fichier (20 secondes)

Copiez `tech-energy.mp3` dans :
```
reels-automation/assets/music/
```

Chemin complet :
```
C:\Users\gabai\Documents\GitHub\Plublista\reels-automation\assets\music\tech-energy.mp3
```

### Étape 4 : Tester ✅

Créez un nouveau Reel - la musique jouera automatiquement dans la fenêtre Stream View !

## 🎚️ Ajuster le Volume

Le volume par défaut est **15%** (0.15).

Pour changer le volume, modifiez cette ligne dans `scripts/templates/stream-view.html` :

```javascript
bgmPlayer.volume = 0.15; // ← Changez ici
```

Valeurs recommandées :
- **0.10** = Très discret (fond subtil)
- **0.15** = Équilibré (recommandé) ✅
- **0.20** = Plus présent
- **0.25** = Bien audible

## 🎬 Comment ça Marche ?

### Avant (Post-Processing)
❌ Musique ajoutée APRÈS l'enregistrement avec FFmpeg
❌ Nécessite FFmpeg installé
❌ Temps de traitement supplémentaire

### Maintenant (Stream View)
✅ Musique joue EN DIRECT dans la fenêtre
✅ OBS capture le son automatiquement
✅ Pas besoin de FFmpeg pour la musique
✅ Synchronisation parfaite code/musique

## 📊 Spécifications Techniques

- **Format** : MP3 (recommandé) ou WAV
- **Volume** : 15% par défaut (ajustable)
- **Lecture** : Boucle automatique (loop)
- **Démarrage** : Au début de l'animation de typing
- **Capture** : Audio capturé par OBS avec le reste

## 🔧 Configuration OBS

Pour capturer l'audio de la fenêtre Chrome :

### Windows 10/11

1. **Paramètres OBS** → **Audio**
2. **Périphérique de capture audio du bureau** :
   - Sélectionnez votre sortie audio par défaut
   - OU utilisez "Application Audio Capture" pour cibler Chrome

### Alternative : Application Audio Capture (Recommandé)

1. **Sources** → **Ajouter** → **Application Audio Capture**
2. **Sélectionner** : Chrome ou Edge
3. La musique de la fenêtre sera capturée automatiquement

## 🎵 Sites de Musique Gratuite

### Sans Compte
- **Pixabay Music** : https://pixabay.com/music/ ⭐ RECOMMANDÉ
- **Free Music Archive** : https://freemusicarchive.org/
- **Incompetech** : https://incompetech.com/music/

### Avec Compte YouTube
- **YouTube Audio Library** : https://studio.youtube.com/
  (Nécessite un compte YouTube)

## ⚠️ Droits d'Auteur

**Important** : Vérifiez toujours :
- ✅ Licence libre de droits
- ✅ Utilisation commerciale autorisée (si vous monétisez)
- ✅ Pas de Content ID (pour YouTube/Instagram)

Pixabay Music est **100% libre de droits** pour tout usage.

## 🐛 Dépannage

### La musique ne joue pas

**Cause** : Autoplay bloqué par le navigateur

**Solution** : Cliquez une fois dans la fenêtre au démarrage
- Le navigateur autorisera la lecture
- La musique démarrera automatiquement

### Le volume est trop fort/faible

Modifiez le volume dans le template :
```
scripts/templates/stream-view.html
Ligne 239 : bgmPlayer.volume = 0.15;
```

### OBS ne capture pas l'audio

1. Vérifiez les paramètres audio OBS
2. Utilisez "Application Audio Capture"
3. Assurez-vous que Chrome n'est pas en mute

## 📝 Résumé

1. **Télécharger** une musique de Pixabay
2. **Renommer** en `tech-energy.mp3`
3. **Placer** dans `assets/music/`
4. **Lancer** un Reel - c'est tout ! 🎉

La musique jouera automatiquement et sera capturée par OBS en même temps que le code et le résultat.

---

**Temps total : ~3 minutes** ⏱️
