const { spawn } = require('child_process');
const path = require('path');

const {
  buildRuntimeEnv,
  ensureSqliteDirectory,
  getRepoRoot,
  validateRuntimeConfig,
} = require('../Server/runtimeConfig');

function runNodeScript(scriptPath, runtimeEnv) {
  return spawn(process.execPath, [scriptPath], {
    cwd: getRepoRoot(),
    env: runtimeEnv,
    stdio: 'inherit',
  });
}

function waitForExit(child, failureLabel) {
  return new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${failureLabel} exited with code ${code}.`));
    });
  });
}

async function main() {
  const runtimeEnv = buildRuntimeEnv({
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
  });

  const hasEmail = Boolean(runtimeEnv.EMAIL_USER) && Boolean(runtimeEnv.EMAIL_PASS);
  validateRuntimeConfig(runtimeEnv, {
    requireClientBuild: true,
    requireProductionEmailCredentials: hasEmail,
  });
  ensureSqliteDirectory(runtimeEnv.SQLITE_PATH);
  console.log(`[startup] Using SQLite database at ${runtimeEnv.SQLITE_PATH}`);

  const initChild = runNodeScript(path.join(getRepoRoot(), 'scripts', 'init-db.js'), runtimeEnv);
  await waitForExit(initChild, 'Database initialization');

  const serverChild = runNodeScript(path.join(getRepoRoot(), 'Server', 'Server.js'), runtimeEnv);
  const forwardSignal = (signal) => {
    if (!serverChild.killed) {
      serverChild.kill(signal);
    }
  };

  process.on('SIGINT', () => forwardSignal('SIGINT'));
  process.on('SIGTERM', () => forwardSignal('SIGTERM'));

  serverChild.on('error', (error) => {
    console.error(`[startup] ${error.message}`);
    process.exit(1);
  });

  serverChild.on('close', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(`[startup] ${error.message}`);
  process.exit(1);
});
