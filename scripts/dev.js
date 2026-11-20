import { spawn } from 'child_process';

const serverProc = spawn('node', ['server/index.js'], {
  stdio: 'inherit',
  shell: true
});

const clientProc = spawn('npx', ['vite', '--port', '5173'], {
  stdio: 'inherit',
  shell: true
});

function shutdown() {
  serverProc.kill();
  clientProc.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
