# DATASYS — Portail d’actualités

Portail éditorial français DATASYS construit avec Next.js App Router, TypeScript, Prisma et PostgreSQL. Le projet comprend le site public, un espace de gestion protégé par rôle, un formulaire de contact et une médiathèque.

## Prérequis

- Node.js 20.19 ou plus récent (exigence de Prisma 7)
- PostgreSQL 14 ou plus récent
- npm

## Installation locale (Windows PowerShell)

1. Installez les dépendances :

   ```powershell
   npm install
   ```

2. Copiez `.env.example` vers `.env`, puis renseignez l’URL PostgreSQL, un secret aléatoire d’au moins 32 caractères, et le nom, l’adresse et le mot de passe initial de l’administrateur. Le mot de passe initial doit contenir au moins 12 caractères.

   ```powershell
   Copy-Item .env.example .env
   ```

3. Générez le client Prisma, créez les tables et ajoutez le compte administrateur et quelques contenus d’exemple :

   ```powershell
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

4. Générez aussi le client avant chaque build dans un environnement neuf :

   ```powershell
   npm run db:generate
   npm run build
   ```

5. Démarrez le site :

   ```powershell
   npm run dev
   ```

Visitez `http://localhost:3000`. Pour utiliser simultanément deux comptes dans des fenêtres du même navigateur, connectez l’administrateur sur `/espace-admin/login` et le rédacteur sur `/espace-redacteur/login`. Ces espaces utilisent des cookies HTTP-only dont les chemins sont isolés. `/admin/login` reste disponible pour choisir un rôle avant la connexion.

## Fonctionnalités

- Pages publiques : accueil, actualités, activités, annonces, projets, galerie et contact.
- Présentation des solutions Annonces, BatakiPlus et CENOU KIBARU dans la rubrique « Projets ».
- Recherche et filtres de catégories dans les listes, pages détaillées, métadonnées SEO et liens de partage.
- Gestion des actualités, activités, annonces, projets et médias dans `/admin`.
- Personnalisation globale par l’administrateur : logo et palette, visuels et textes de l’accueil, fiches des solutions et réalisations, coordonnées et réseaux sociaux.
- Rôles administrateur/rédacteur vérifiés côté serveur; un rédacteur ne gère que ses contenus. Les espaces `/espace-admin` et `/espace-redacteur` permettent des sessions indépendantes dans plusieurs fenêtres d’un même navigateur.
- Mots de passe hachés avec bcrypt; session HMAC dans un cookie HTTP-only, SameSite=Lax et durée limitée; limitation des tentatives de connexion.
- Formulaire de contact validé côté serveur, avec champ honeypot et limitation des envois répétés par adresse e-mail.
- Import des fichiers JPEG, PNG et WebP jusqu’à 5 Mo, avec vérification du type et de la signature du fichier.

## Configuration et exploitation

- `DATABASE_URL` : URL de connexion PostgreSQL.
- Prisma 7 utilise l’adaptateur PostgreSQL Node (`pg`); les migrations et le client généré sont configurés dans `prisma.config.ts` et `prisma/schema.prisma`.
- `AUTH_SECRET` : secret de signature de session; gardez-le privé et différent entre environnements.
- `NEXT_PUBLIC_SITE_URL` : URL publique pour les métadonnées et le partage.
- Dans `/admin/messages`, l’adresse du destinataire est modifiable et les réponses s’ouvrent dans Gmail avec le destinataire, l’objet et le texte préremplis. L’archivage est bloqué jusqu’à l’ouverture du brouillon et la confirmation manuelle de son envoi; Gmail ne permet pas au site de vérifier l’envoi. Les compteurs de messages reçus et non lus reflètent les messages présents. La suppression d’un message demande confirmation et efface aussi son historique de réponses.
- Les réglages publics sont gérés dans `/admin/personnalisation`. Les fiches Annonces, BatakiPlus et CENOU KIBARU figurent individuellement dans la liste « Publications récentes » de `/admin/projets` et se modifient une par une; leurs contenus sont enregistrés dans la table `Setting`. `lib/site-info.ts` fournit les valeurs initiales utilisées avant toute personnalisation.
- Les images personnalisées doivent être ajoutées dans la médiathèque avant de les choisir comme logo ou image d’accueil.
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` : compte initial créé par `npm run db:seed`. Le seed réinitialise le mot de passe du compte défini par `ADMIN_EMAIL`.
- En production, appliquez les migrations avec `npm run db:deploy`, ne relancez pas le seed sans intention de réinitialiser le compte administrateur, servez le site derrière HTTPS et sauvegardez PostgreSQL ainsi que `public/uploads/`.
- Les images importées sont écrites sur le disque local. Choisissez un hébergement avec stockage persistant et sauvegardé; les plateformes éphémères/serverless nécessitent de remplacer cette destination par un stockage objet persistant.

## Commandes utiles

```powershell
npm run lint
npx tsc --noEmit
npm run build
```
