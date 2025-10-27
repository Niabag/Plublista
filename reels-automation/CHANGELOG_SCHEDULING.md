# 📅 Nouvelle Fonctionnalité: Planification des Publications

## Résumé des changements

La fonctionnalité de planification automatique des publications Instagram a été ajoutée à l'application!

## ✨ Ce qui a été ajouté

### 1. Interface de planification (Frontend)

**CreateWizard.jsx** - Nouveau dans le formulaire de création:
- ✅ Case à cocher "📅 Planifier la publication"
- ✅ Sélecteur de date (date picker)
- ✅ Sélecteur d'heure (time picker)
- ✅ Aperçu en français du moment de publication
- ✅ Validation (pas de date dans le passé)

### 2. Backend de planification

**server/scheduler.js** (NOUVEAU):
- ✅ Vérification automatique toutes les 60 secondes
- ✅ Détection des jobs à publier
- ✅ Publication automatique au moment planifié
- ✅ Gestion gracieuse de l'arrêt

**server/routes/jobs.js** - Nouvelles routes:
- ✅ `GET /api/jobs/scheduled` - Liste des jobs planifiés
- ✅ `POST /api/jobs/:id/publish` - Publication manuelle
- ✅ `PATCH /api/jobs/:id/schedule` - Modifier la planification

**server/index.js**:
- ✅ Intégration du scheduler
- ✅ Démarrage automatique au lancement du serveur
- ✅ Arrêt propre (SIGTERM/SIGINT)

### 3. Affichage amélioré

**Dashboard.jsx**:
- ✅ Affichage des dates planifiées dans la queue
- ✅ Format français (jour, date, heure)
- ✅ Icône 📅 pour les posts planifiés

**JobDetails.jsx**:
- ✅ Bouton "Publier maintenant" pour override manuel
- ✅ Affichage du statut de publication
- ✅ Date planifiée dans les informations
- ✅ Confirmation de publication avec date

### 4. Documentation

**SCHEDULING_GUIDE.md** (NOUVEAU):
- 📖 Guide complet de la planification
- 📊 Cas d'usage et exemples
- 🎯 Meilleures pratiques
- ⏰ Calendrier de contenu suggéré
- ⚙️ Configuration technique

**README.md** (mis à jour):
- ✅ Mention de la fonctionnalité de planification
- ✅ Instructions d'utilisation
- ✅ Lien vers le guide détaillé

## 📊 Statuts de publication

Le système gère maintenant 4 statuts:

| Statut | Icône | Description |
|--------|-------|-------------|
| `draft` | 📝 | Vidéo créée, pas de planification |
| `scheduled` | 📅 | Publication programmée |
| `publishing` | ⏳ | Publication en cours |
| `published` | ✅ | Publié avec succès |

## 🔄 Workflow

### Création avec planification

```
1. Utilisateur crée un Reel
2. Active la planification
3. Choisit date + heure
4. Soumet le formulaire
   ↓
5. Backend crée le job
6. Marque comme "scheduled"
7. Stocke scheduledFor (ISO 8601)
   ↓
8. Scheduler vérifie chaque minute
9. Quand heure arrive → publication auto
10. Statut devient "published"
```

### Publication manuelle (override)

```
1. Utilisateur voit un job planifié
2. Clique "Publier maintenant"
3. Confirmation
   ↓
4. Backend lance la publication immédiate
5. Ignore la date planifiée
6. Publie sur Instagram
```

## 🎯 Exemples d'utilisation

### Exemple 1: Planifier un post pour demain à 10h

```javascript
{
  title: "CSS Grid Tutorial",
  code: "...",
  scheduleEnabled: true,
  scheduleDate: "2024-10-26",
  scheduleTime: "10:00"
}
```

### Exemple 2: Batch de 5 vidéos pour la semaine

```javascript
// Créer 5 jobs avec différentes dates
Lundi 09:00, Mardi 14:00, Mercredi 19:00, Jeudi 10:00, Vendredi 18:00
```

Le système publiera automatiquement chaque vidéo au moment prévu!

## 🔧 Configuration

### Modifier l'intervalle de vérification

Dans `server/scheduler.js`:

```javascript
this.checkInterval = 60000 // 60 secondes par défaut
```

Pour vérifier toutes les 30 secondes:

```javascript
this.checkInterval = 30000
```

### Fuseau horaire

Les dates sont en **UTC** en backend mais affichées dans le fuseau local du navigateur.

## ⚠️ Important

### Avant utilisation

1. **Tester d'abord** avec 1-2 vidéos
2. **Vérifier l'heure système** du serveur
3. **Planifier au minimum 15 minutes à l'avance**
4. **Respecter les limites Instagram** (25 posts/jour max)

### Limites

- Maximum 25 publications par jour (limite Instagram)
- Intervalle minimum de vérification: 1 minute
- Les dates passées sont rejetées automatiquement

## 📱 Interface utilisateur

### Écrans modifiés

1. **Create Wizard (Étape 1)**
   - Section de planification en bas
   - Pliable si non utilisée

2. **Dashboard**
   - Queue affiche les dates planifiées
   - Tri chronologique

3. **Job Details**
   - Panneau info montrent la date planifiée
   - Bouton contexte (publier maintenant vs publier plus tard)

## 🚀 Pour commencer

1. Lancez l'application: `npm run dev`
2. Créez un nouveau Reel
3. Cochez "📅 Planifier la publication"
4. Choisissez une date dans le futur
5. Soumettez!

Le scheduler s'occupe du reste automatiquement! 🎉

## 📚 Documentation

- **Guide complet**: [SCHEDULING_GUIDE.md](./SCHEDULING_GUIDE.md)
- **README principal**: [README.md](./README.md)
- **Configuration**: [config.yaml](./config.yaml)

---

**La planification automatique rend votre présence Instagram constante et sans effort! 🎊**
