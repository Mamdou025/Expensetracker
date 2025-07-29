# ExpenseTracker

Ce projet extrait les données de transaction des courriels et les enregistre dans une base de données SQLite locale.

Assurez-vous que **Python 3** est installé et accessible depuis votre ligne de commande. Sur certaines plateformes, l’interpréteur est disponible sous `python3` au lieu de `python`. Vous pouvez définir une variable d’environnement `PYTHON_CMD` qui pointe vers la bonne commande si nécessaire.

## Installation

1. **Fournir les identifiants de messagerie** utilisés par les scripts d’extraction.

   - Soit modifier `credentials.yml` avec votre adresse courriel et votre mot de passe d’application.
   - Soit définir les variables d’environnement `EMAIL_USER` et `EMAIL_PASS`. Un fichier `.env` peut être utilisé avec des outils tels que `python-dotenv`.
   Les scripts lisent d’abord les variables d’environnement puis utilisent `credentials.yml` si elles ne sont pas définies.
   Si vous stockez de vrais identifiants dans le fichier, pensez à ajouter `credentials.yml` au `.gitignore` pour éviter de publier des secrets.
   Exemple de fichier `.env` :
   ```
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_app_password
   ```
2. Installer les dépendances Python (si elles ne sont pas déjà disponibles) avec `pip` :
   ```bash
   pip install -r requirements.txt
   # utilisez `pip3` si votre système sépare Python 2 et 3
   ```
3. Exécuter les scripts d’extraction situés dans le dossier `Application` avec Python 3 :
   ```bash
\${PYTHON_CMD:-python} Application/main.py
```
Remplacez `main.py` par le script de votre choix. Définissez `PYTHON_CMD` si `python` ne pointe pas vers Python 3 sur votre système.

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

### Installation des dépendances
1. **Client**
   ```bash
   cd client
   npm install --legacy-peer-deps
   # ou installez TypeScript 4.9 manuellement si vous préférez
   npm install typescript@4.9 --save-dev
   ```
   Lancez `npm install` dans `client/` avant `npm test`.
2. **Server**
   ```bash
   cd Server
   npm install
   ```

### Démarrage des services
Démarrer le serveur de développement React :
```bash
cd client
npm start
```

Démarrer le serveur API Node (port 5000 par défaut) :
```bash
cd Server
node Server.js
```

L’application React lit `REACT_APP_API_URL` pour déterminer l’URL de base de l’API (par défaut `http://localhost:5000`).
Vous pouvez placer cette variable dans un fichier `.env` dans le dossier `client`.
Le serveur Node utilise la variable d’environnement facultative `PORT` et lit le fichier SQLite
`transactions.db` dans le répertoire `Database`.

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
python Database/Database.py
```
Cela modifiera les tables existantes pour inclure les colonnes manquantes.

