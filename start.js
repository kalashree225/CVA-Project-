/**
 * Sentinel Intelligence Platform - Unified Runner (Non-Docker Version)
 * This script starts both the Backend (FastAPI) and Frontend (Next.js) concurrently.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const backendDir = path.join(__dirname, 'vision_monitor');
const frontendDir = path.join(__dirname, 'frontend');
const storageDir = path.join(__dirname, 'vision_monitor', 'sentinel_storage');

console.log('\x1b[36m%s\x1b[0m', '🛡️  Initializing Sentinel Intelligence Platform (Standalone)...');

// Ensure local storage directory exists
if (!fs.existsSync(storageDir)) {
    console.log('\x1b[90m%s\x1b[0m', `   - Creating storage volume: ${storageDir}`);
    fs.mkdirSync(storageDir, { recursive: true });
}

function startProcess(name, command, args, cwd, color) {
    console.log(`${color}[${name}]\x1b[0m Starting...`);
    
    const isWin = process.platform === 'win32';
    const proc = spawn(command, args, { 
        cwd, 
        shell: isWin,
        stdio: 'pipe' 
    });

    proc.stdout.on('data', (data) => {
        process.stdout.write(`${color}[${name}]\x1b[0m ${data}`);
    });

    proc.stderr.on('data', (data) => {
        process.stderr.write(`${color}[${name}-ERR]\x1b[0m ${data}`);
    });

    proc.on('close', (code) => {
        if (code !== 0 && code !== null) {
            console.log(`${color}[${name}]\x1b[0m Exited with code ${code}`);
            process.exit(code);
        }
    });

    return proc;
}

// 1. Start Backend (Using the local sentinel_storage)
const backend = startProcess(
    'Backend', 
    'python', 
    ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000', '--reload'], 
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
    console.log('\n\x1b[33m%s\x1b[0m', '🛑 Terminating Sentinel Session...');
    backend.kill();
    frontend.kill();
    process.exit();
});

console.log('\n\x1b[36m%s\x1b[0m', '✅ Sentinel Core Initialized.');
console.log('\x1b[90m%s\x1b[0m', `   - Command Center: http://localhost:3000`);
console.log('\x1b[90m%s\x1b[0m', `   - Neural API: http://localhost:8000/docs\n`);
