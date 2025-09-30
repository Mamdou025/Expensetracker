# Deployment Options for ExpenseTracker

## Option 1: Docker Containerization (Recommended) 🐳

### Dockerfile
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS frontend-build

# Build React frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --only=production
COPY client/ ./
RUN npm run build

FROM python:3.11-alpine AS backend

# Install system dependencies
RUN apk add --no-cache \
    nodejs \
    npm \
    sqlite \
    gcc \
    musl-dev \
    python3-dev

# Set working directory
WORKDIR /app

# Copy Python requirements and install
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY Server/ ./Server/
COPY Application/ ./Application/
COPY Database/ ./Database/

# Copy built frontend
COPY --from=frontend-build /app/client/build ./client/build

# Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001 -G appuser

# Set up directories and permissions
RUN mkdir -p /app/data && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start command
CMD ["node", "Server/Server.js"]
```

### Docker Compose for Development
```yaml
# docker-compose.yml
version: '3.8'

services:
  expensetracker:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_URL=/app/data/transactions.db
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    
  # Optional: Add nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - expensetracker
    restart: unless-stopped
```

### Build and Run
```bash
# Build the image
docker build -t expensetracker .

# Run with environment variables
docker run -d \
  --name expensetracker \
  -p 5000:5000 \
  -e JWT_SECRET="your-super-secret-key" \
  -v $(pwd)/data:/app/data \
  expensetracker

# Or use docker-compose
docker-compose up -d
```

## Option 2: Cloud Deployment ☁️

### 2A. Railway (Easiest - $5/month)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables
railway variables set JWT_SECRET=your-secret-key
railway variables set NODE_ENV=production
```

**Railway Configuration:**
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ Zero-config deployment
- ✅ Built-in monitoring
- 💰 $5/month for small apps

### 2B. Render (Free tier available)
```yaml
# render.yaml
services:
  - type: web
    name: expensetracker
    env: node
    buildCommand: |
      cd client && npm install && npm run build &&
      cd .. && npm install
    startCommand: node Server/Server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
    disk:
      name: data
      mountPath: /app/data
      sizeGB: 1
```

### 2C. DigitalOcean App Platform ($12/month)
```yaml
# .do/app.yaml
name: expensetracker
services:
- name: web
  source_dir: /
  github:
    repo: your-username/expensetracker
    branch: main
  build_command: |
    cd client && npm install && npm run build &&
    cd .. && npm install
  run_command: node Server/Server.js
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: "production"
  - key: JWT_SECRET
    value: "your-secret-key"
```

### 2D. AWS Lightsail ($3.50/month)
```bash
# Create Lightsail instance
aws lightsail create-instances \
    --instance-names expensetracker \
    --availability-zone us-east-1a \
    --blueprint-id ubuntu_20_04 \
    --bundle-id nano_2_0

# SSH and deploy
ssh ubuntu@your-instance-ip
sudo apt update && sudo apt install -y docker.io docker-compose
git clone https://github.com/your-username/expensetracker.git
cd expensetracker
sudo docker-compose up -d
```

## Option 3: Traditional VPS Hosting 🖥️

### Setup Script (Ubuntu/Debian)
```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Setting up ExpenseTracker on VPS..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Python 3.11
sudo apt install -y python3.11 python3.11-pip python3.11-dev

# Install PM2 for process management
sudo npm install -g pm2

# Clone and setup application
git clone https://github.com/your-username/expensetracker.git
cd expensetracker

# Install dependencies
cd client && npm install && npm run build && cd ..
npm install
pip3.11 install -r requirements.txt

# Setup database
python3.11 Database/Database.py

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'expensetracker',
    script: 'Server/Server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      JWT_SECRET: 'your-production-secret'
    }
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Setup nginx reverse proxy
sudo apt install -y nginx

sudo cat > /etc/nginx/sites-available/expensetracker << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/expensetracker /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Setup SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com

echo "✅ ExpenseTracker deployed successfully!"
echo "🌐 Visit: https://your-domain.com"
```

## Option 4: Serverless Deployment ⚡

### Vercel (Frontend + API Routes)
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    },
    {
      "src": "Server/Server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/Server/Server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/client/build/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "JWT_SECRET": "@jwt-secret"
  }
}
```

## Cost Comparison 💰

| Platform | Monthly Cost | Pros | Cons |
|----------|-------------|------|------|
| **Railway** | $5 | Easy setup, auto-scaling | Limited resources |
| **Render** | Free/$7 | Free tier, auto-deploy | Free tier limitations |
| **DigitalOcean** | $12 | Reliable, good docs | More expensive |
| **AWS Lightsail** | $3.50 | Cheap, scalable | Requires more setup |
| **VPS (Linode/Hetzner)** | $5-10 | Full control | Manual management |
| **Vercel** | Free/$20 | Serverless, fast | Database challenges |

## Recommended Deployment Path 🎯

### For MVP/Testing:
1. **Railway** - Deploy in 5 minutes
2. Add custom domain
3. Set up monitoring

### For Production:
1. **Docker + DigitalOcean** App Platform
2. Set up CI/CD with GitHub Actions
3. Add monitoring with Sentry
4. Use managed database (PostgreSQL)

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build and push Docker image
        run: |
          docker build -t expensetracker .
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push your-username/expensetracker
          
      - name: Deploy to production
        run: |
          # Deploy to your chosen platform
          curl -X POST ${{ secrets.WEBHOOK_URL }}
```

**Next Steps:**
1. Choose your deployment platform
2. Set up authentication system
3. Configure environment variables
4. Add monitoring and logging
5. Set up automated backups