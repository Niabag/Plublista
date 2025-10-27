# 🎵 Guide de Sélection de Musique

## ✅ Fonctionnalité Intégrée !

La sélection de musique depuis l'interface web est maintenant **complètement fonctionnelle**.

## 🎯 Comment ça Marche

### 1. Création d'un Reel

Quand vous créez un nouveau Reel dans l'interface web :
- **Sélectionnez un style de musique** dans le menu déroulant
- Le système charge automatiquement le fichier correspondant

### 2. Styles Disponibles

| Style | Fichier | Description |
|-------|---------|-------------|
| **Tech/Energetic** | `tech-energy.mp3` | Musique tech énergique (par défaut) |
| **Chill** | `chill-vibes.mp3` | Ambiance calme et relaxante |
| **Ambient** | `ambient-tech.mp3` | Fond ambient tech |
| **Upbeat** | `upbeat-coding.mp3` | Rythme entraînant pour coder |

### 3. Ajouter Vos Musiques

Pour ajouter des musiques correspondant aux styles :

```
assets/music/
├── tech-energy.mp3    ✅ Par défaut
├── chill-vibes.mp3    ← Ajoutez pour "Chill"
├── ambient-tech.mp3   ← Ajoutez pour "Ambient"
└── upbeat-coding.mp3  ← Ajoutez pour "Upbeat"
```

## 🔄 Workflow Complet

1. **Interface Web** : Sélectionnez le style de musique
2. **Serveur** : Transmet le style au script Python
3. **Script Python** : Charge le fichier de musique correspondant
4. **Stream View** : Joue la musique pendant l'enregistrement
5. **OBS** : Capture l'audio en direct

## 📝 Ajouter un Nouveau Style

### Option 1 : Modifier le Code

Dans `src/pages/CreateWizard.jsx`, ajoutez une option :

```jsx
<select value={formData.musicStyle} ...>
  <option value="tech/energetic">Tech/Energetic</option>
  <option value="chill">Chill</option>
  <option value="mon-style">Mon Style</option>  ← Nouveau
</select>
```

Dans `scripts/launch_stream_view.py`, ajoutez le mapping :

```python
music_style_map = {
    'tech/energetic': 'tech-energy.mp3',
    'chill': 'chill-vibes.mp3',
    'mon-style': 'mon-fichier.mp3',  ← Nouveau
}
```

### Option 2 : Utiliser le Nom Par Défaut

Si vous ne spécifiez pas de style :
- Le système utilise **`tech-energy.mp3`**
- C'est le fichier par défaut

## 🎬 Fermeture Automatique

**Nouveau !** La fenêtre Stream View se ferme maintenant automatiquement après :
1. ✅ Enregistrement OBS terminé
2. ✅ Post-processing terminé
3. ✅ Vidéo finale créée

Plus besoin de fermer manuellement !

## 🐛 Dépannage

### La musique ne joue pas

**Vérifiez** :
1. Le fichier existe : `assets/music/tech-energy.mp3`
2. Le style correspond au mapping
3. Les logs Python pour confirmation

**Exemple de logs** :
```
Music loaded: tech-energy.mp3 (1234.5 KB)
Music style: tech/energetic
```

### La fenêtre ne se ferme pas

**Raisons possibles** :
- Processus Chrome bloqué
- PID non récupéré

**Solution** :
- La fenêtre se fermera avec un fallback
- Sinon, fermez manuellement (une seule fois)

## 📊 Fichiers Modifiés

- ✅ `server/routes/jobs.js` - Transmission du music-style
- ✅ `scripts/orchestrator.py` - Réception et traitement
- ✅ `scripts/launch_stream_view.py` - Chargement de la musique
- ✅ `scripts/templates/stream-view.html` - Lecture de la musique
- ✅ Fermeture automatique implémentée

## 🎉 Résumé

**Avant** :
- ❌ Musique hardcodée à `tech-energy.mp3`
- ❌ Fenêtre manuelle à fermer

**Maintenant** :
- ✅ Sélection de musique dans l'interface
- ✅ Mapping automatique du style au fichier
- ✅ Fermeture automatique de la fenêtre
- ✅ Musique jouée en direct dans OBS

## 🚀 Prochaines Étapes

1. **Téléchargez des musiques** pour chaque style
2. **Placez-les** dans `assets/music/`
3. **Créez un Reel** et sélectionnez votre style
4. **Profitez** de l'automatisation complète !

---

**Tout fonctionne maintenant correctement !** 🎵
