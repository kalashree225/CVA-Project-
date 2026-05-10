/**
 * Sentinel Intelligence Platform - Unified Runner
 * This script starts both the Backend (FastAPI) and Frontend (Next.js) concurrently.
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const backendDir = path.join(__dirname, 'vision_monitor');
const frontendDir = path.join(__dirname, 'frontend');

console.log('\x1b[36m%s\x1b[0m', '🛡️  Starting Sentinel Intelligence Platform...');

function startProcess(name, command, args, cwd, color) {
    console.log(`${color}[${name}]\x1b[0m Starting...`);
    
    const proc = spawn(command, args, { 
        cwd, 
        shell: true,
        stdio: 'pipe' 
    });

    proc.stdout.on('data', (data) => {
        process.stdout.write(`${color}[${name}]\x1b[0m ${data}`);
    });

    proc.stderr.on('data', (data) => {
        process.stderr.write(`${color}[${name}-ERR]\x1b[0m ${data}`);
    });

    proc.on('close', (code) => {
        console.log(`${color}[${name}]\x1b[0m Exited with code ${code}`);
        // Kill the entire process if one of the services dies
        process.exit(code);
    });

    return proc;
}

// 1. Start Backend
const backend = startProcess(
    'Backend', 
    'python', 
    ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'], 
    backendDir,
    '\x1b[32m' // Green
);

// 2. Start Frontend
const frontend = startProcess(
    'Frontend', 
    'npm', 
    ['run', 'dev'], 
    frontendDir,
    '\x1b[35m' // Magenta
);

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\x1b[33m%s\x1b[0m', '🛑 Shutting down services...');
    backend.kill();
    frontend.kill();
    process.exit();
});

console.log('\n\x1b[36m%s\x1b[0m', '✅ Services are initializing...');
console.log('\x1b[90m%s\x1b[0m', `   - Backend: http://localhost:8000/docs`);
console.log('\x1b[90m%s\x1b[0m', `   - Frontend: http://localhost:3000\n`);
