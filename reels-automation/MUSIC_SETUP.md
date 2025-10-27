# 🎵 Configuration de la Musique de Fond

## 📁 Structure Attendue

Le système cherche les fichiers musicaux dans :
```
reels-automation/
└── assets/
    └── music/
        └── tech-energy.mp3  ← Fichier requis
```

## 🚨 Problème Actuel

Le fichier `assets/music/tech-energy.mp3` n'existe pas. C'est pourquoi la musique n'est pas ajoutée aux vidéos.

## ✅ Solutions

### Option 1 : Ajouter votre propre musique

1. **Trouvez une musique libre de droits** :
   - [YouTube Audio Library](https://studio.youtube.com/channel/UC/music) (gratuit)
   - [Pixabay Music](https://pixabay.com/music/) (gratuit)
   - [Epidemic Sound](https://www.epidemicsound.com/) (payant)
   - [Artlist](https://artlist.io/) (payant)

2. **Téléchargez un fichier audio** :
   - Format : MP3 ou WAV
   - Style : Tech, Energetic, Upbeat recommandé
   - Durée : 10-30 secondes minimum

3. **Renommez et placez le fichier** :
   ```powershell
   # Copiez votre fichier musical
   Copy-Item "C:\Downloads\votre-musique.mp3" "assets\music\tech-energy.mp3"
   ```

### Option 2 : Désactiver la musique

Modifiez `config.yaml` :

```yaml
music:
  enabled: false  # ← Mettez false ici
  style: tech/energetic
  target_lufs: -16
  duck_under_voice: true
  bgm_volume: 0.15
```

### Option 3 : Utiliser plusieurs musiques

1. **Ajoutez plusieurs fichiers** :
   ```
   assets/music/
   ├── tech-energy.mp3
   ├── chill-vibes.mp3
   ├── upbeat-coding.mp3
   └── ambient-tech.mp3
   ```

2. **Modifiez le script** pour choisir aléatoirement (voir ci-dessous)

## 🎛️ Paramètres Audio

Dans `config.yaml` :

```yaml
music:
  enabled: true              # Activer/désactiver la musique
  style: tech/energetic      # Style (non utilisé actuellement)
  target_lufs: -16           # Normalisation du volume (-16 LUFS pour Instagram)
  duck_under_voice: true     # Réduire le volume sous la voix (non implémenté)
  bgm_volume: 0.15           # Volume de la musique (0.0 à 1.0, 15% recommandé)
```

### Ajuster le Volume

Si la musique est trop forte ou trop faible, modifiez `bgm_volume` :
- **Trop forte** : `bgm_volume: 0.10` (10%)
- **Équilibrée** : `bgm_volume: 0.15` (15%) ← Par défaut
- **Plus audible** : `bgm_volume: 0.25` (25%)

## 🔧 Modification Avancée : Musique Aléatoire

Si vous voulez utiliser plusieurs musiques au hasard, modifiez `scripts/compose_ffmpeg.ps1` :

```powershell
# Ligne 47, remplacez :
$musicTrack = "assets\music\tech-energy.mp3"

# Par :
$musicFiles = Get-ChildItem "assets\music\*.mp3" -ErrorAction SilentlyContinue
if ($musicFiles) {
    $musicTrack = ($musicFiles | Get-Random).FullName
    Write-Host "Selected music: $($musicTrack)" -ForegroundColor Cyan
} else {
    $musicTrack = $null
}
```

## 📝 Recommandations Musique

### Pour du Code Tech

- **Style** : Electronic, Tech House, Ambient
- **BPM** : 120-140
- **Durée** : 15-30 secondes
- **Énergie** : Moyenne à Haute

### Mots-clés de Recherche

Sur YouTube Audio Library ou Pixabay :
- "tech background music"
- "coding music short"
- "electronic upbeat"
- "programming background"
- "tech ambient"

## ⚠️ Droits d'Auteur

**Important** : Assurez-vous que la musique que vous utilisez est :
- ✅ Libre de droits
- ✅ Autorisée pour usage commercial (si vous monétisez)
- ✅ Pas protégée par Content ID (pour YouTube)
- ✅ Créditée si nécessaire

## 🎬 Processus Actuel

Quand la musique est activée, le système :

1. **Convertit en portrait** (1080x1920)
2. **Ajoute le logo** (coin supérieur gauche)
3. **Mélange l'audio** :
   - Audio original de la vidéo
   - Musique de fond à 15% du volume
   - Dynamique audio normalisée
4. **Normalise le volume** à -16 LUFS (standard Instagram)

## 🧪 Test Rapide

Pour tester si la musique fonctionne :

```powershell
# Vérifier si le fichier existe
Test-Path assets\music\tech-energy.mp3

# Créer un fichier de test (silence de 10 secondes)
ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t 10 assets\music\tech-energy.mp3

# Lancer un job de test
```

## 📊 Statistiques Audio Finales

Après post-processing, votre vidéo aura :
- **Format** : 1080x1920 (portrait 9:16)
- **Audio** : AAC 192 kbps
- **Loudness** : -16 LUFS (optimisé Instagram)
- **Musique** : Mixée à 15% avec audio original

---

**Besoin d'aide ?** Vérifiez les logs du post-processing pour voir si la musique a été détectée et appliquée.
