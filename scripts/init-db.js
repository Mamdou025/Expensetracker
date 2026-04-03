const { spawn } = require('child_process');
const path = require('path');

const {
  buildRuntimeEnv,
  ensureSqliteDirectory,
  getPythonCommand,
  getRepoRoot,
  validateRuntimeConfig,
} = require('../Server/runtimeConfig');

function runInitDb(runtimeEnv) {
  return new Promise((resolve, reject) => {
    const pythonCmd = getPythonCommand(runtimeEnv);
    const repoRoot = getRepoRoot();
    const initScript = path.join(repoRoot, 'Database', 'Database.py');
    const child = spawn(pythonCmd, [initScript], {
      cwd: repoRoot,
      env: runtimeEnv,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Database initialization exited with code ${code}.`));
    });
  });
}

async function main() {
  const runtimeEnv = buildRuntimeEnv(process.env);
  validateRuntimeConfig(runtimeEnv, {
    requireProductionEmailCredentials: false,
  });
  ensureSqliteDirectory(runtimeEnv.SQLITE_PATH);
  console.log(`[init-db] Using SQLite database at ${runtimeEnv.SQLITE_PATH}`);
  await runInitDb(runtimeEnv);
}

main().catch((error) => {
  console.error(`[init-db] ${error.message}`);
  process.exit(1);
});
