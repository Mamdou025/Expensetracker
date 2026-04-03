const fs = require('fs');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const {
  buildRuntimeEnv,
  getClientBuildPath,
  getHost,
  getPort,
  getRepoRoot,
  validateRuntimeConfig,
} = require('../Server/runtimeConfig');

const args = new Set(process.argv.slice(2));
const shouldRequireEmailSecrets = !args.has('--skip-email-secrets');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkFileExists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found at ${filePath}.`);
  }
}

function runCommand(command, commandArgs, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, options);
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${commandArgs.join(' ')} exited with code ${code}.`));
    });
  });
}

function canConnect(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function httpGetJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body,
        });
      });
    });

    req.on('error', reject);
  });
}

async function waitForServer(port, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await canConnect(port)) {
      return;
    }

    await delay(500);
  }

  throw new Error(`Server did not start listening on port ${port} within ${timeoutMs}ms.`);
}

async function smokeStart(runtimeEnv) {
  const repoRoot = getRepoRoot();
  const child = spawn(process.execPath, [path.join(repoRoot, 'scripts', 'start-production.js')], {
    cwd: repoRoot,
    env: runtimeEnv,
    stdio: 'inherit',
  });

  try {
    await waitForServer(getPort(runtimeEnv));
    const response = await httpGetJson(`http://127.0.0.1:${getPort(runtimeEnv)}/api/transactions`);
    if (response.statusCode !== 200) {
      throw new Error(`/api/transactions returned status ${response.statusCode}.`);
    }
  } finally {
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('close', () => resolve()));
  }
}

async function main() {
  const repoRoot = getRepoRoot();
  const clientBuildPath = getClientBuildPath();
  const clientIndexPath = path.join(clientBuildPath, 'index.html');
  const tempDbPath = path.join(os.tmpdir(), 'expensetracker-replit-verify.db');
  const runtimeEnv = buildRuntimeEnv({
    ...process.env,
    NODE_ENV: 'production',
    HOST: process.env.HOST || '0.0.0.0',
    PORT: process.env.PORT || '5000',
    SQLITE_PATH: tempDbPath,
  });

  if (!runtimeEnv.EMAIL_USER && !runtimeEnv.EMAIL_PASS && !shouldRequireEmailSecrets) {
    runtimeEnv.EMAIL_USER = 'deploy-check@example.com';
    runtimeEnv.EMAIL_PASS = 'deploy-check-password';
  }

  validateRuntimeConfig(runtimeEnv, {
    requireClientBuild: true,
    requireProductionEmailCredentials: shouldRequireEmailSecrets,
  });

  checkFileExists(path.join(repoRoot, '.replit'), '.replit');
  checkFileExists(path.join(repoRoot, 'replit.nix'), 'replit.nix');
  checkFileExists(clientIndexPath, 'React production build');

  if (fs.existsSync(tempDbPath)) {
    fs.unlinkSync(tempDbPath);
  }

  console.log('[verify-deploy] Replit config present');
  console.log(`[verify-deploy] Client build found at ${clientIndexPath}`);
  console.log(`[verify-deploy] Using host ${getHost(runtimeEnv)} and port ${getPort(runtimeEnv)}`);
  console.log(`[verify-deploy] Using temp SQLite database ${tempDbPath}`);

  await runCommand(process.execPath, [path.join(repoRoot, 'scripts', 'init-db.js')], {
    cwd: repoRoot,
    env: runtimeEnv,
    stdio: 'inherit',
  });

  await smokeStart(runtimeEnv);
  console.log('[verify-deploy] Deployment smoke test passed');
}

main().catch((error) => {
  console.error(`[verify-deploy] ${error.message}`);
  process.exit(1);
});
