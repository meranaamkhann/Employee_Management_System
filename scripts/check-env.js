const { execSync } = require('node:child_process');

const REQUIRED = {
  node: { major: 20, hint: 'see frontend/.nvmrc' },
  java: { major: 21, hint: 'see backend/.java-version' },
};

let hasFailure = false;

function run(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
  } catch {
    return null;
  }
}

function check(label, ok, detail) {
  const icon = ok === null ? '?' : ok ? '\u2713' : '\u2717';
  console.log(`  [${icon}] ${label}${detail ? ' — ' + detail : ''}`);
  if (ok === false) hasFailure = true;
}

console.log('Checking local environment against project requirements...\n');

// Node
const nodeVersion = process.version; // e.g. v20.11.0
const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0], 10);
check(
  `Node.js ${nodeVersion}`,
  nodeMajor === REQUIRED.node.major,
  nodeMajor === REQUIRED.node.major
    ? 'matches frontend/.nvmrc'
    : `expected major version ${REQUIRED.node.major}.x (${REQUIRED.node.hint})`,
);

// Java
const javaRaw = run('java -version 2>&1') || run('java --version');
if (javaRaw) {
  const match = javaRaw.match(/version "?(\d+)/);
  const javaMajor = match ? parseInt(match[1], 10) : null;
  check(
    `Java (${javaRaw.split('\n')[0]})`,
    javaMajor === REQUIRED.java.major,
    javaMajor === REQUIRED.java.major ? 'matches backend/.java-version' : `expected Java ${REQUIRED.java.major}`,
  );
} else {
  check('Java', false, 'not found on PATH — install Java 21 (Temurin recommended)');
}
const mvnRaw = run('mvn -version');
check('Maven', mvnRaw !== null, mvnRaw ? mvnRaw.split('\n')[0] : 'not found on PATH — install Maven 3.9+');

// Docker
const dockerRaw = run('docker --version');
check('Docker', dockerRaw !== null, dockerRaw || 'not found on PATH — install Docker Desktop');

const composeRaw = run('docker compose version');
check('Docker Compose', composeRaw !== null, composeRaw || 'not found — Docker Desktop should include this');

console.log('');
if (hasFailure) {
  console.log('One or more checks failed — fix the items marked [\u2717] above before running the app.');
  process.exitCode = 1;
} else {
  console.log('Environment looks good.');
}
