# 🚀 Guide de Déploiement - GameHub Arcade Pro

## ✅ Fichiers créés

### Configuration
- `config.example.js` - Template de configuration Firebase (à copier vers `config.js`)
- `firebase-rules.json` - Règles de sécurité Firebase Realtime Database

### Modules principaux
- `app.js` - Application principale avec authentification
- `moderation.js` - Système de modération (mots bannis, validation)
- `friends.js` - Système d'amis complet
- `chat.js` - Chat temps réel privé et groupes
- `admin.js` - Panel d'administration pour Bryan_Drouet
- `leaderboard.js` - Classements avancés multi-périodes

### Jeux
- `games/guess.js` - Devine le nombre
- `games/memory.js` - Memory
- `games/tictactoe.js` - Morpion

### Interface
- `index.html` - Page principale améliorée
- `styles.css` - Styles (déjà existant)
- `manifest.json` - Configuration PWA
- `sw.js` - Service Worker

## 📋 Étapes de déploiement

### 1. Configurer Firebase

1. Créez un projet Firebase sur https://console.firebase.google.com
2. Activez ces services :
   - **Authentication** > Sign-in method > Email/Password
   - **Realtime Database** > Create database (mode test pour commencer)
   - **Storage** (pour les photos de profil)

3. Copiez votre configuration Firebase :
   ```javascript
   // Dans Project Settings > Your apps
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     databaseURL: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   };
   ```

4. Créez le fichier `config.js` :
   ```bash
   cp config.example.js config.js
   ```
   
5. Éditez `config.js` et remplacez les valeurs par votre configuration

### 2. Appliquer les règles Firebase

Dans Firebase Console > Realtime Database > Rules, copiez le contenu de `firebase-rules.json`

### 3. Tester en local

Ouvrez `index.html` dans votre navigateur ou utilisez un serveur local :

```bash
# Avec Python
python -m http.server 8000

# Avec Node.js
npx serve

# Avec PHP
php -S localhost:8000
```

Visitez http://localhost:8000

### 4. Déployer sur GitHub Pages

```bash
# Si pas déjà fait
git init
git add .
git commit -m "Initial commit - GameHub Arcade Pro"

# Ajouter le dépôt distant
git remote add origin https://github.com/BryanDrouet/GameHub-Arcade.git
git branch -M main
git push -u origin main
```

### 5. Activer GitHub Pages

1. Allez dans Settings > Pages
2. Source : main branch
3. Save
4. Votre site sera accessible sur : https://bryandrouet.github.io/GameHub-Arcade/

### 6. Créer le compte admin

1. Inscrivez-vous sur le site avec le pseudo **exactement** : `Bryan_Drouet`
2. Le panel admin apparaîtra automatiquement dans le header

## 🎯 Fonctionnalités implémentées

### ✅ Authentification
- [x] Inscription / Connexion
- [x] Profil utilisateur
- [x] Modification pseudo
- [x] Déconnexion

### ✅ Jeux
- [x] 3 jeux disponibles
- [x] Sauvegarde des scores
- [x] Favoris et épinglés
- [x] Reprise de partie (structure en place)

### ✅ Social
- [x] Système d'amis
- [x] Demandes d'ami
- [x] Chat privé temps réel
- [x] Invitations à jouer
- [x] Status en ligne/hors ligne

### ✅ Classements
- [x] Classements par jeu
- [x] Filtres période (jour/semaine/mois/année/tout)
- [x] Filtre amis uniquement
- [x] Recherche de joueur
- [x] Mise en évidence joueur connecté

### ✅ Administration (Bryan_Drouet)
- [x] Panel admin complet
- [x] Gestion utilisateurs
- [x] Bannissement
- [x] Visualisation base de données
- [x] Statistiques globales

### ✅ Sécurité
- [x] Modération automatique
- [x] Liste de mots bannis
- [x] Rate limiting client
- [x] Règles Firebase
- [x] Validation des données

### ✅ PWA
- [x] Manifest.json
- [x] Service Worker
- [x] Installation possible
- [x] Mode hors ligne (basique)

## 🔒 Sécurité

### Règles Firebase importantes

Les règles appliquent :
- Lecture/écriture authentifiées uniquement
- Accès admin pour Bryan_Drouet
- Protection des données utilisateurs
- Validation des données entrantes

### Modération

Mots bannis configurés dans `moderation.js` - modifiez selon vos besoins.

## 🐛 Dépannage

### Firebase non configuré
- Vérifiez que `config.js` existe et contient votre vraie config
- Ne commitez JAMAIS `config.js` (déjà dans .gitignore)

### Authentication ne fonctionne pas
- Vérifiez que Email/Password est activé dans Firebase Console
- Vérifiez le domaine autorisé (GitHub Pages domain)

### Base de données refusée
- Vérifiez les règles Firebase appliquées
- Mode test si besoin : `.read` et `.write` à `true` temporairement

### Site ne charge pas sur GitHub Pages
- Attendez 2-3 minutes après le push
- Vérifiez Settings > Pages activé
- Clear cache du navigateur

## 📝 TODO - Améliorations futures

- [ ] Ajouter plus de jeux (Snake, 2048, Tetris, etc.)
- [ ] Groupes d'amis avec chat de groupe
- [ ] Notifications push
- [ ] Upload photo de profil
- [ ] Vérification email
- [ ] Mode sombre/clair
- [ ] Traductions
- [ ] Achievements / Badges
- [ ] Classement hebdomadaire avec récompenses

## 📞 Support

Pour toute question, consultez :
- Documentation Firebase : https://firebase.google.com/docs
- GitHub Pages : https://docs.github.com/pages

---

**Note** : Le compte `Bryan_Drouet` (respect exact de la casse) a automatiquement tous les droits d'administration.
