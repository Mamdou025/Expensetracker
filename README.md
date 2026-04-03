# ExpenseTracker

Ce projet extrait les données de transaction des courriels et les enregistre dans une base de données SQLite locale.

Assurez-vous que **Python 3** et **Node.js** sont installés et accessibles depuis votre ligne de commande. Sur certaines plateformes, l’interpréteur Python est disponible sous `python3` au lieu de `python`. Vous pouvez définir une variable d’environnement `PYTHON_CMD` si nécessaire.

## Configuration d’exécution

Variables d’environnement principales :

- `EMAIL_USER` : adresse Gmail/IMAP utilisée pour l’extraction des courriels.
- `EMAIL_PASS` : mot de passe d’application correspondant.
- `SQLITE_PATH` : chemin du fichier SQLite. S’il est relatif, il est résolu depuis la racine du dépôt. Par défaut : `Database/transactions.db`.
- `PORT` : port HTTP du serveur Node. Par défaut : `5000`.
- `PYTHON_CMD` : commande Python à utiliser pour les scripts invoqués par Node. Par défaut : `python` sur Windows, `python3` ailleurs.
- `REACT_APP_API_URL` : utile surtout pour le développement du client séparé. En production mono-service, laissez cette variable vide pour utiliser la même origine.
- `ALLOW_PLAINTEXT_CREDENTIALS=1` : autorise `credentials.yml` uniquement en développement local. Ne pas utiliser en production.

En production, `EMAIL_USER` et `EMAIL_PASS` sont obligatoires, et `ALLOW_PLAINTEXT_CREDENTIALS=1` provoque désormais un échec explicite au démarrage.

## Installation

1. **Installer les dépendances Node.js** depuis la racine :

   ```bash
   npm install
   ```

   Cette commande installe maintenant les dépendances du client React et du serveur Node.

2. **Installer les dépendances Python** :

   ```bash
   pip install -r requirements.txt
   # utilisez `pip3` si votre système sépare Python 2 et 3
   ```

3. **Fournir les identifiants de messagerie** utilisés par les scripts d’extraction.

   - En production : définir `EMAIL_USER` et `EMAIL_PASS`.
   - En développement local seulement : vous pouvez encore utiliser `credentials.yml`, mais uniquement si `ALLOW_PLAINTEXT_CREDENTIALS=1` est défini.

   Exemple de fichier `.env` :

   ```
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_app_password
   SQLITE_PATH=Database/transactions.db
   ```

4. Exécuter les scripts d’extraction situés dans le dossier `Application` avec Python 3 :

   ```bash
${PYTHON_CMD:-python} Application/main.py
```
Remplacez `main.py` par le script de votre choix. Définissez `PYTHON_CMD` si `python` ne pointe pas vers Python 3 sur votre système.

## Configuration des banques

Les banques prises en charge sont déclarées dans `Application/config.yml`. Chaque section contient l’adresse courriel de l’expéditeur ainsi qu’une liste de `keywords` indiquant qu’un courriel décrit une transaction.

Vous pouvez également définir une liste optionnelle `exclude_keywords` pour signaler des phrases qui **ne** doivent pas être considérées comme des transactions (par exemple les confirmations de paiement).

Exemple :

```yaml
  capital_one_credit:
    sender: "capitalone@notification.capitalone.com"
    keywords: ["A transaction was charged to your account", "International transaction alert"]
    exclude_keywords:
      - "Payment posted"
      - "Paiement inscrit"
      - "Thank you for your payment"
```

Si l’objet ou le contenu d’un courriel contient l’une de ces expressions, il sera marqué comme **non transactionnel** même s’il contient un mot clé positif.

## Exécution du client React et du serveur Node

L’interface web se trouve dans le dossier `client` tandis que l’API réside dans `Server`.

### Développement local

Démarrer le serveur de développement React :

```bash
cd client
npm start
```

Démarrer le serveur API Node (port 5000 par défaut) :

```bash
cd Server
node Server.js
```

L’application React lit `REACT_APP_API_URL` pour déterminer l’URL de base de l’API. Sans cette variable, elle utilise :

- `http://localhost:5000` quand elle tourne sur le serveur de développement React (`localhost:3000`)
- la même origine en production mono-service

Vous pouvez placer cette variable dans un fichier `.env` dans le dossier `client`.

### Démarrage de production / Replit

Chemin de démarrage recommandé pour un premier hébergement :

1. Construire le client React :

   ```bash
   npm run build
   ```

2. Initialiser explicitement le schéma SQLite :

   ```bash
   npm run init:db
   ```

3. Démarrer le service de production unique :

   ```bash
   npm start
   ```

`npm start` utilise désormais un bootstrap explicite :

- vérifie la configuration d’exécution
- résout `SQLITE_PATH`
- lance l’initialisation du schéma
- démarre le serveur Node
- sert le build React depuis le même processus quand `client/build` existe

La base SQLite vit par défaut dans `Database/transactions.db`, sauf si `SQLITE_PATH` pointe ailleurs.

### Limites du premier modèle de déploiement

- SQLite reste un fichier local unique : ce modèle convient à une première instance simple, pas à une montée en charge multi-répliques.
- Les scripts Python sont toujours invoqués par Node : Python doit donc être disponible sur l’environnement d’hébergement.
- Le stockage des courriels et la logique d’extraction restent couplés au backend existant ; ce patch ne change pas l’architecture applicative.

## Déploiement Replit Reserved VM

Ce dépôt est maintenant préparé pour un premier déploiement Replit avec un seul service web :

- backend Node/Express
- scripts Python appelés par le backend
- frontend React compilé puis servi par Express
- SQLite conservé temporairement comme stockage local

### Fichiers Replit ajoutés

- `.replit` : définit le build et le run path explicites pour Replit
- `replit.nix` : fournit Node, Python et quelques dépendances système minimales

### Commande de build Replit

Utilisez cette commande de build :

```bash
npm run replit:build
```

Elle exécute :

- `npm install`
- `python -m pip install -r requirements.txt`
- `npm run build`
- `npm run verify:deploy`

### Commande de run Replit

Utilisez cette commande de lancement :

```bash
npm start
```

Cette commande :

- valide la configuration runtime
- initialise explicitement le schéma SQLite
- démarre le serveur Node
- sert le build React depuis `client/build`

### Secrets / variables d’environnement Replit

Ajoutez ces variables dans le panneau **Deployments** de Replit, pas seulement dans le Workspace. D’après la documentation Replit, les Workspace Secrets ne sont pas automatiquement repris par l’app publiée.

Secrets requis :

- `EMAIL_USER`
- `EMAIL_PASS`

Variables recommandées :

- `SQLITE_PATH`
  Exemple Replit simple : `Database/transactions.db`
- `PYTHON_CMD`
  Optionnel si `python` fonctionne déjà
- `NODE_ENV`
  Optionnel, `npm start` force déjà un mode de production si absent
- `HOST`
  Optionnel, valeur par défaut : `0.0.0.0`
- `PORT`
  Généralement fourni par Replit ; ne le fixez que si Replit vous le demande explicitement

### Port attendu

- En local : `5000` par défaut
- En déploiement Replit : le backend utilise `PORT`
- Le serveur écoute désormais explicitement sur `0.0.0.0`, ce qui est nécessaire pour un déploiement web hébergé

### Vérification de déploiement

Le script suivant vérifie la configuration de déploiement :

```bash
npm run verify:deploy
```

Il contrôle notamment :

- présence de `.replit` et `replit.nix`
- présence du build React
- initialisation SQLite via le chemin configuré
- démarrage complet du chemin `npm start`
- accessibilité HTTP sur le port attendu

Pour un contrôle local sans vrais secrets mail :

```bash
npm run verify:deploy -- --skip-email-secrets
```

### Checklist Replit après import GitHub

1. Importer le dépôt dans Replit.
2. Vérifier que `.replit` et `replit.nix` sont bien présents.
3. Ouvrir **Deployments** puis choisir un déploiement **Reserved VM** pour une app web toujours active.
4. Définir la **Build command** sur `npm run replit:build`.
5. Définir la **Run command** sur `npm start`.
6. Ajouter `EMAIL_USER` et `EMAIL_PASS` dans les **Deployment Secrets**.
7. Ajouter `SQLITE_PATH` si vous voulez déplacer la base ailleurs que `Database/transactions.db`.
8. Lancer le build puis le déploiement.
9. Vérifier que la page d’accueil se charge et que `/api/transactions` répond.

### Limites actuelles sur Replit

- SQLite reste local au conteneur/VM et ne constitue pas une solution durable pour plusieurs instances ou redéploiements fréquents.
- Le système de secrets de production doit être configuré dans le panneau Deployments.
- Cette patch ne migre pas vers une base managée et ne change pas l’architecture existante.

## API Endpoints

### Transactions

- `GET /api/transactions` – Retourne toutes les transactions avec leurs tags.
- `GET /api/transactions/category/:category` – Transactions filtrées par catégorie.
- `GET /api/transactions/tag/:tag` – Transactions contenant un tag donné.
- `GET /api/transactions/:id/tags` – Liste les tags associés à une transaction.
- `POST /api/transactions/:id/tags` – Ajoute un tag à une transaction (`{ tag }`).
- `DELETE /api/transactions/:id/tags` – Supprime un tag d’une transaction (`{ tag }`).
- `PUT /api/transactions/:id/category` – Met à jour la catégorie d’une transaction (`{ category }`).

### Tags

- `GET /api/tags` – Retourne les tags avec les transactions associées.
- `DELETE /api/tags/:tagName` – Supprime un tag de la base.
- `GET /api/tags/stats` – Statistiques d’utilisation des tags.

### Keyword Rules

- `GET /api/keyword-rules` – Retourne toutes les règles basées sur des mots-clés.
- `POST /api/keyword-rules` – Crée une règle (`{ keyword, category?, tags? }`). Conflit si le mot-clé existe déjà.
- `PUT /api/keyword-rules/:keyword` – Met à jour la catégorie ou les tags d’une règle (`{ category?, tags? }`).
- `DELETE /api/keyword-rules/:keyword` – Supprime une règle.

## Exécution des tests

Installez les dépendances puis lancez la suite Python :
```bash
pip install -r requirements.txt
pip install pytest
pytest Application
```

Pour les tests du client React :
```bash
cd client
npm install --legacy-peer-deps
npm test -- --watchAll=false
```

## Mise à niveau du schéma de la base de données
Si vous mettez à jour le projet et que de nouvelles colonnes sont ajoutées (par exemple le champ
`category`), exécutez à nouveau le script de création de la base :

```bash
npm run init:db
```
Cela modifiera les tables existantes pour inclure les colonnes manquantes sans dépendre d’un import implicite.

