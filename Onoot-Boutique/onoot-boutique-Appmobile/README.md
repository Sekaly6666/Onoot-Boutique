# 📱 Onoot Boutique - Application Mobile (React Native & Expo)

Application mobile officielle pour **Onoot Boutique**, synchronisée en temps réel avec le backend Express (`api-server`) et le tableau de bord administrateur (`admin`).

---

## 🚀 Démarrage Rapide

### 1. Démarrer le serveur API Backend (si ce n'est pas déjà fait)
Depuis le dossier racine du projet :
```bash
npm run dev
# ou démarre directement api-server sur le port 5005
```

### 2. Lancer l'application mobile Expo
Dans ce dossier `onoot-boutique-Appmobile` :
```bash
npx expo start
```

### 3. Tester sur votre smartphone avec Expo Go
1. Installez l'application **Expo Go** depuis l'App Store (iOS) ou le Google Play Store (Android).
2. Connectez votre téléphone au **même réseau Wi-Fi** que votre ordinateur.
3. Scannez le **QR Code** qui s'affiche dans votre terminal ou navigateur.
4. L'application se charge instantanément sur votre téléphone avec le rechargement en direct (*Hot Reload*).

---

## 🌐 Configuration de l'adresse du Serveur API

Pour que votre smartphone puisse communiquer avec votre serveur local :
1. Ouvrez l'application mobile et allez dans l'onglet **Compte** (icône profil).
2. Dans la section **Configuration Serveur API**, saisissez l'adresse IP de votre PC sur votre réseau local :
   ```text
   http://192.168.x.x:5005
   ```
   *(ou votre URL d'hébergement en ligne : https://onoot-boutique.onrender.com)*
3. Cliquez sur **Tester connexion** pour valider la communication.

---

## ✨ Fonctionnalités Implémentées

- **🏠 Accueil Dynamique** :
  - En-tête de marque Onoot Boutique (Couleurs officielles : Orange, Bleu, Or).
  - Carrousel de bannières interactif avec offres spéciales et livraisons 24H.
  - Cartes d'avantages (Paiement à la livraison, Garantie, Support 7j/7).
  - Défilement horizontal des catégories avec icônes.
  - Ventes flash & réductions avec compteurs de stock.
  - Vitrine de vidéos de démonstration / Reels.
  - Grille de produits en vedette.

- **🛍️ Catalogue & Filtres** :
  - Recherche instantanée par nom ou description.
  - Filtres par catégories en pastilles (*Pills*).
  - Tri par prix (Croissant / Décroissant).
  - Ajout rapide au panier en 1 tap avec retour visuel.

- **🛒 Panier & Tunnel de Commande** :
  - Gestion des quantités (+ / -) et suppression.
  - Calculateur dynamique des frais de livraison selon les communes d'Abidjan (Cocody, Yopougon, Marcory, Plateau, Bingerville, Bassam, Intérieur du pays).
  - Formulaire de commande express (Nom, Téléphone, Adresse).
  - Choix du mode de paiement (Paiement à la livraison, Wave, Orange Money, MTN MoMo).
  - Sauvegarde locale hors-ligne (`AsyncStorage`) + synchronisation API.

- **🎟️ Billet Numérique avec QR Code** :
  - Génération automatique du billet officiel dès la validation de commande.
  - QR Code dynamique prêt à être scanné lors de la livraison ou du retrait.
  - Récapitulatif complet des articles, montants et coordonnées.
  - Bouton direct pour partager le billet ou contacter le support WhatsApp.

- **📦 Suivi des Commandes** :
  - Historique de toutes les commandes passées.
  - Statuts en temps réel (`En attente`, `Confirmée`, `En cours de livraison`, `Livrée`).
  - Accès au billet QR Code à tout moment.

- **👤 Compte & Support** :
  - Authentification (Connexion / Inscription).
  - Contact direct WhatsApp en un clic pour l'assistance.
  - Appel téléphonique direct.
  - Configuration de l'URL serveur en direct sans recompilation.

---

## 📁 Architecture du Code

```text
onoot-boutique-Appmobile/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Barre de navigation à 5 onglets
│   │   ├── index.tsx        # Écran Accueil
│   │   ├── catalog.tsx      # Écran Catalogue & Recherche
│   │   ├── cart.tsx         # Écran Panier & Commande
│   │   ├── orders.tsx       # Écran Historique & Billets
│   │   └── profile.tsx      # Écran Profil, Auth & Configuration Serveur
│   ├── product/
│   │   └── [id].tsx         # Fiche Produit détaillée (Galerie, Variantes, Achat)
│   ├── ticket/
│   │   └── [id].tsx         # Billet Officiel avec QR Code
│   └── _layout.tsx          # Configuration racine et Providers
├── src/
│   ├── contexts/
│   │   ├── AuthContext.tsx  # Contexte d'authentification utilisateur
│   │   └── CartContext.tsx  # Contexte du panier persistant
│   ├── services/
│   │   └── api.ts           # Client API Axios avec fallback démo
│   └── types/
│       └── index.ts         # Types TypeScript (Product, Cart, Order, User)
├── constants/
│   └── Colors.ts            # Palette de couleurs Onoot Boutique
└── app.json                 # Configuration Expo (iOS / Android)
```
