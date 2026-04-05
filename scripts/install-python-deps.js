const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const reqFile = path.join(__dirname, '..', 'requirements.txt');
const vendorDir = path.join(__dirname, '..', 'python_vendor');

function checkImports() {
  const packages = { 'beautifulsoup4': 'bs4', 'PyYAML': 'yaml', 'pdfplumber': 'pdfplumber', 'PyMuPDF': 'fitz' };
  for (const [pkg, mod] of Object.entries(packages)) {
    try {
      execSync(`python -c "import ${mod}"`, { stdio: 'pipe' });
    } catch {
      return false;
    }
  }
  return true;
}

if (checkImports()) {
  console.log('[python-deps] All Python packages already available');
  process.exit(0);
}

const strategies = [
  { name: 'pip install --user', cmd: `python -m pip install --user -r ${reqFile}` },
  { name: 'pip install --break-system-packages', cmd: `python -m pip install --break-system-packages -r ${reqFile}` },
  { name: 'pip install --target vendor', cmd: `python -m pip install --target ${vendorDir} -r ${reqFile}` },
];

for (const s of strategies) {
  console.log(`[python-deps] Trying: ${s.name}`);
  try {
    execSync(s.cmd, { stdio: 'inherit' });
    if (s.name.includes('vendor') && fs.existsSync(vendorDir)) {
      process.env.PYTHONPATH = vendorDir + (process.env.PYTHONPATH ? ':' + process.env.PYTHONPATH : '');
    }
    if (checkImports()) {
      console.log(`[python-deps] Success with: ${s.name}`);
      process.exit(0);
    }
  } catch (e) {
    console.log(`[python-deps] ${s.name} failed, trying next...`);
  }
}

console.error('[python-deps] WARNING: Could not install Python deps via any method. PDF parsing may not work in production.');
process.exit(0);
