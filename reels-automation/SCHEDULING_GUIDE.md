# Guide de Planification des Publications

## 📅 Vue d'ensemble

La fonctionnalité de planification vous permet de créer vos Reels à l'avance et de les publier automatiquement à la date et l'heure de votre choix.

## ✨ Fonctionnalités

### 1. Planification lors de la création

Lors de la création d'un nouveau Reel:

1. Cochez **"📅 Planifier la publication"**
2. Sélectionnez la **date de publication**
3. Choisissez l'**heure de publication**
4. Un aperçu s'affiche avec le jour, la date et l'heure en français

**Exemple:**
- Date: 2024-10-28
- Heure: 10:00
- Affichage: "Publication prévue le dimanche 28 octobre 2024 à 10:00"

### 2. Publication automatique

Le système vérifie toutes les minutes les vidéos planifiées et les publie automatiquement quand l'heure arrive.

**États de publication:**
- 📝 **Brouillon** - Vidéo créée, non planifiée
- 📅 **Planifiée** - Vidéo programmée pour publication future
- ⏳ **En cours** - Publication en cours sur Instagram
- ✅ **Publiée** - Vidéo publiée avec succès

### 3. Publication manuelle

Vous pouvez aussi publier une vidéo planifiée immédiatement:

1. Allez sur la page de détails du job
2. Cliquez sur **"Publier maintenant"**
3. Confirmez la publication

## 🎯 Cas d'usage

### Planification hebdomadaire

**Exemple: 3 vidéos par semaine**

- **Lundi 10:00** - Tutorial CSS
- **Mercredi 14:00** - JavaScript tips
- **Vendredi 18:00** - Recap de la semaine

Créez toutes vos vidéos le dimanche et planifiez-les pour la semaine!

### Heures optimales

D'après les statistiques Instagram, les meilleures heures de publication sont:

**En semaine:**
- 🌅 6h-9h (avant le travail)
- 🍽️ 12h-14h (pause déjeuner)
- 🌆  17h-21h (après le travail)

**Week-end:**
- 🌄 9h-11h (matinée)
- 🌇 19h-21h (soirée)

### Batch création

1. Créez 5-10 vidéos en une session
2. Planifiez-les sur plusieurs semaines
3. Le système publie automatiquement
4. Vous gardez une présence constante sans effort quotidien

## 🔄 Workflow recommandé

### 1. Préparation (Dimanche)

```
- Préparer 3-5 snippets de code
- Créer les vidéos avec l'automatisation
- Planifier les publications pour la semaine
```

### 2. Suivi (Durant la semaine)

```
- Vérifier le dashboard pour les publications à venir
- Surveiller les publications automatiques
- Analyser les performances
```

### 3. Ajustement

```
- Identifier les meilleures heures de publication
- Ajuster votre calendrier en fonction des résultats
- Optimiser le contenu selon l'engagement
```

## 📊 Dashboard - Vue de la queue

Le dashboard affiche tous vos Reels planifiés avec:

- **Titre** de la vidéo
- **Date et heure** de publication prévue
- **Statut** actuel (scheduled, publishing, published)
- **Compteur** de vidéos en attente

## ⚙️ Configuration technique

### Intervalle de vérification

Le scheduler vérifie les jobs toutes les **60 secondes** par défaut.

Pour modifier l'intervalle, éditez `server/scheduler.js`:

```javascript
this.checkInterval = 60000 // en millisecondes (60000 = 1 minute)
```

### Fuseau horaire

Les dates sont stockées en **UTC** (ISO 8601) mais affichées selon le fuseau horaire local du navigateur.

**Important:** Assurez-vous que l'heure système de votre serveur est correcte!

## 🔒 Limites Instagram

### Rate Limits

Instagram limite le nombre de publications:
- ⚠️ Maximum **25 publications par jour** par compte
- ⚠️ Évitez plus de **5 publications par heure**

Le système respecte automatiquement ces limites en espaçant les publications.

### Qualité

Assurez-vous que:
- ✅ Vidéo: 1080×1920, 30fps, H.264
- ✅ Durée: 35-60 secondes
- ✅ Fichier: moins de 100MB
- ✅ Audio: AAC, -16 LUFS

## 🛠️ Gestion des erreurs

### Si une publication échoue

Le système va:

1. **Logger l'erreur** dans les logs du job
2. **Marquer le job** comme "failed"
3. **Vous notifier** (dans le dashboard)

Vous pouvez alors:
- Vérifier les logs pour comprendre l'erreur
- Corriger le problème (token expiré, etc.)
- Republier manuellement

### Tokens expirés

Les tokens Instagram expirent après **60 jours**.

**Solution:**
1. Allez dans Settings
2. Générez un nouveau long-lived token
3. Remplacez dans les paramètres
4. Les publications futures utiliseront le nouveau token

## 📝 Bonnes pratiques

### 1. Tester d'abord

Avant de planifier en masse:
- ✅ Testez avec 1-2 vidéos planifiées
- ✅ Vérifiez qu'elles sont publiées correctement
- ✅ Contrôlez la qualité sur Instagram

### 2. Buffer de sécurité

Planifiez au moins **15 minutes dans le futur** pour laisser le temps à:
- La création de la vidéo
- Le traitement FFmpeg
- Les éventuels problèmes techniques

### 3. Sauvegarde

Gardez toujours:
- 💾 Copies locales de vos vidéos finales
- 📝 Liste de vos publications planifiées
- 🔑 Backup de vos credentials API

### 4. Monitoring

Vérifiez régulièrement:
- 📊 Dashboard pour les publications à venir
- ✅ Statuts de publication
- 📈 Analytics Instagram pour l'engagement

## 🚀 Exemple complet

```javascript
// Créer un Reel planifié
const reelData = {
  title: "Amazing CSS Animation",
  code: "... votre code ...",
  hashtags: "#webdev #css #coding",
  musicStyle: "tech/energetic",
  targetDuration: 45,
  brandOverlay: true,
  scheduleEnabled: true,
  scheduleDate: "2024-10-28",
  scheduleTime: "14:00"
}

// Le système va:
// 1. Créer la vidéo maintenant
// 2. La stocker localement
// 3. La publier automatiquement le 28 octobre à 14h00
```

## 📅 Calendrier de contenu suggéré

### Débutant (1 vidéo/semaine)

- **Vendredi 18:00** - Publication unique, engagement maximal

### Intermédiaire (3 vidéos/semaine)

- **Lundi 09:00** - Démarrer la semaine fort
- **Mercredi 13:00** - Mi-semaine, pause déjeuner
- **Vendredi 19:00** - Clôture de semaine

### Avancé (5+ vidéos/semaine)

- **Lundi, Mercredi, Vendredi** - Contenu principal
- **Mardi, Jeudi** - Tips rapides
- **Samedi** - Recap ou bonus

## 💡 Tips pro

1. **Batch your content** - Créez plusieurs vidéos d'un coup
2. **Consistent timing** - Publiez aux mêmes heures pour habituer votre audience
3. **Test & optimize** - Analysez quel jour/heure fonctionne le mieux
4. **Stay ahead** - Gardez toujours 1 semaine d'avance
5. **Quality over quantity** - Mieux vaut 3 excellents Reels que 7 médiocres

---

**Avec la planification automatique, maintenez une présence constante sur Instagram sans effort quotidien! 🎉**
