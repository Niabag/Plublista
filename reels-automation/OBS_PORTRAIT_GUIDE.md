# 📱 Guide : Configurer OBS en Format Portrait

## 🎯 Problème

Tu enregistres avec OBS en **format paysage (1920x1080)**, mais tu veux un résultat en **format téléphone (1080x1920)** pour Instagram Reels.

**Solution :** Configurer OBS pour enregistrer DIRECTEMENT en format portrait !

---

## 🚀 Solution Rapide (Automatique)

### Double-clic sur :
```
configure_obs.bat
```

Le script va créer automatiquement un profil OBS "Reels" avec les bons paramètres.

---

## 🔧 Solution Manuelle (si l'automatique ne marche pas)

### Étape 1 : Ouvrir les Paramètres OBS

1. Lance **OBS Studio**
2. **Fichier** → **Paramètres** (ou **File** → **Settings**)

### Étape 2 : Configuration Vidéo

Dans l'onglet **Vidéo** (ou **Video**) :

#### Résolution de Base (Base Canvas Resolution)
```
Largeur  : 1080
Hauteur  : 1920
```

#### Résolution de Sortie (Output Scaled Resolution)
```
Largeur  : 1080
Hauteur  : 1920
```

### Étape 3 : Appliquer

1. Cliquez sur **OK**
2. **Redémarrez OBS**

---

## 🎬 Ajuster ta Scène

Après avoir changé la résolution :

### 1. Ta fenêtre VS Code sera maintenant en format portrait

La zone de capture sera verticale (1080x1920).

### 2. Repositionner tes Sources

- **Capture de fenêtre** : Redimensionner pour remplir le cadre vertical
- **Logo** : Repositionner si nécessaire
- **Texte** : Adapter à la hauteur verticale

---

## 🔄 Basculer entre Formats

### Option 1 : Créer 2 Profils OBS

1. **Profil "PC"** : 1920x1080 (paysage)
2. **Profil "Reels"** : 1080x1920 (portrait)

Pour créer un profil :
- **Profil** → **Nouveau** → Nommer "Reels"
- Configurer avec les paramètres portrait

Pour changer de profil :
- **Profil** → Sélectionner le profil voulu

### Option 2 : Changer les Paramètres à Chaque Fois

Pas pratique, mais possible via **Fichier** → **Paramètres** → **Vidéo**

---

## 📊 Résolution : Avant / Après

### Avant (Format PC)
```
┌──────────────────────┐
│                      │  1920x1080
│     Paysage          │  Ratio 16:9
│                      │
└──────────────────────┘
```

### Après (Format Téléphone)
```
┌────────┐
│        │
│Portrait│  1080x1920
│        │  Ratio 9:16
│  Reels │
│        │
│        │
└────────┘
```

---

## ✅ Vérification

Pour vérifier que c'est bien configuré :

1. Dans OBS, regarde la **zone de prévisualisation**
2. Elle doit être **verticale** (plus haute que large)
3. Le ratio doit afficher **9:16**

---

## 🎥 Impact sur l'Enregistrement

### Avant
- OBS enregistre : 1920x1080 (paysage)
- FFmpeg crop : 1080x1920 (coupe les côtés)
- Résultat : ❌ Contenu coupé, pas optimal

### Après
- OBS enregistre : 1080x1920 (portrait)
- FFmpeg : Juste audio/branding
- Résultat : ✅ Contenu complet, optimisé

---

## 💡 Conseils

### 1. VS Code en Mode Portrait

Tu peux aussi ajuster VS Code pour mieux utiliser l'espace vertical :
- Fermer les panneaux latéraux
- Maximiser la zone de code
- Utiliser une police légèrement plus grande

### 2. Zone de Sécurité

Instagram Reels a une zone de sécurité :
- Haut : ~100px (logo Instagram)
- Bas : ~150px (boutons)

Garde ton contenu important **au centre** !

### 3. Tester Avant

Fais un **enregistrement test** de 5 secondes pour vérifier que tout est bien cadré.

---

## 🐛 Problèmes Courants

### "Ma fenêtre VS Code est coupée"

**Solution :** Redimensionne la source dans OBS (clic droit → Transform → Fit to screen)

### "Ça ne change pas"

**Solution :** Redémarre OBS après avoir changé les paramètres

### "Je veux revenir en paysage"

**Solution :** Remets 1920x1080 dans les paramètres vidéo

---

## 🎯 Résumé Ultra Rapide

```
1. Double-clic → configure_obs.bat
   OU
   OBS → Paramètres → Vidéo → 1080x1920

2. Redémarre OBS

3. Ajuste ta scène (sources en vertical)

4. Lance ton automation !
```

---

## 📞 Test

Pour vérifier que tout fonctionne :

```powershell
.\test_compose.bat
```

La vidéo générée devrait maintenant être en **format vertical** ! 📱

---

**Créé le :** 27 Octobre 2025  
**Format :** 1080x1920 (9:16)  
**Plateforme :** Instagram Reels
