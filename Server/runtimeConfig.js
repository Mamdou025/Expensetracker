const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const defaultSqliteRelativePath = path.join('Database', 'transactions.db');

function resolveSqlitePath(rawPath) {
  const configuredPath = rawPath || defaultSqliteRelativePath;
  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(repoRoot, configuredPath);
}

function isProductionEnv(env = process.env) {
  return (env.NODE_ENV || '').toLowerCase() === 'production';
}

function getPort(env = process.env) {
  const rawPort = env.PORT || '5000';
  const port = Number.parseInt(rawPort, 10);
  if (Number.isNaN(port)) {
    throw new Error(`PORT must be a valid integer. Received "${rawPort}".`);
  }

  return port;
}

function getHost(env = process.env) {
  const host = env.HOST || '0.0.0.0';
  if (!host.trim()) {
    throw new Error('HOST must be a non-empty string when provided.');
  }

  return host;
}

function getPythonCommand(env = process.env) {
  return env.PYTHON_CMD || (process.platform === 'win32' ? 'python' : 'python3');
}

function getSqlitePath(env = process.env) {
  return resolveSqlitePath(env.SQLITE_PATH);
}

function ensureSqliteDirectory(dbPath = getSqlitePath()) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

function getClientBuildPath() {
  return path.join(repoRoot, 'client', 'build');
}

function hasClientBuild() {
  return fs.existsSync(path.join(getClientBuildPath(), 'index.html'));
}

function buildRuntimeEnv(baseEnv = process.env) {
  return {
    ...baseEnv,
    HOST: getHost(baseEnv),
    SQLITE_PATH: getSqlitePath(baseEnv),
  };
}

function validateRuntimeConfig(env = process.env, options = {}) {
  const {
    requireClientBuild = false,
    requireProductionEmailCredentials = isProductionEnv(env),
  } = options;

  const hasEmailUser = Boolean(env.EMAIL_USER);
  const hasEmailPass = Boolean(env.EMAIL_PASS);

  if (hasEmailUser !== hasEmailPass) {
    throw new Error('EMAIL_USER and EMAIL_PASS must either both be set or both be unset.');
  }

  if (isProductionEnv(env) && env.ALLOW_PLAINTEXT_CREDENTIALS === '1') {
    throw new Error('ALLOW_PLAINTEXT_CREDENTIALS=1 is not allowed when NODE_ENV=production.');
  }

  if (requireProductionEmailCredentials && (!hasEmailUser || !hasEmailPass)) {
    throw new Error('EMAIL_USER and EMAIL_PASS are required when NODE_ENV=production.');
  }

  if (requireClientBuild && !hasClientBuild()) {
    throw new Error('Client build not found. Run "npm run build" before starting the production service.');
  }
}

function getRepoRoot() {
  return repoRoot;
}

module.exports = {
  buildRuntimeEnv,
  ensureSqliteDirectory,
  getClientBuildPath,
  getHost,
  getPort,
  getPythonCommand,
  getRepoRoot,
  getSqlitePath,
  hasClientBuild,
  isProductionEnv,
  validateRuntimeConfig,
};
