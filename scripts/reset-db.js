
const { execSync } = require('node:child_process');

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

function tryRun(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
  } catch {
    return null;
  }
}

console.log('Stopping stack and removing volumes (including postgres_data)...');
run('docker compose down -v');

console.log('\nRecreating postgres with credentials from docker-compose.yml...');
run('docker compose up -d postgres');

console.log('\nWaiting for postgres to report healthy...');
const containerId = tryRun('docker compose ps -q postgres');
if (!containerId) {
  console.error('Could not find the postgres container. Check `docker compose ps`.');
  process.exit(1);
}

const start = Date.now();
const timeoutMs = 60_000;
function poll() {
  const status = tryRun(`docker inspect -f "{{.State.Health.Status}}" ${containerId}`);
  if (status === 'healthy') {
    console.log('\nDone. Postgres is now initialized with matching credentials.');
    console.log('You can now run: mvn -f backend/pom.xml spring-boot:run');
    return;
  }
  if (Date.now() - start > timeoutMs) {
    console.error('\nTimed out waiting for postgres to become healthy. Check `docker compose logs postgres`.');
    process.exitCode = 1;
    return;
  }
  setTimeout(poll, 1000);
}
poll();
