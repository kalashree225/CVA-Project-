# 🛡️ Sentinel Intelligence Platform
**Simplified Vision-AI Monitoring & Automation**

A streamlined, high-performance monitoring platform for Vision-AI and LLM clusters, designed for easy deployment and local experimentation.

---

## 🏗️ Architecture (Simplified)
The platform consists of two main components:
1.  **Backend (FastAPI)**: A high-concurrency Python server handling data ingestion, automation, and core intelligence logic.
2.  **Frontend (Next.js)**: A premium "Command Center" dashboard built with Tailwind CSS and the Sentinel Design System.

---

## 🚀 Getting Started

# 🛡️ Sentinel Intelligence Platform v2.0
### Advanced Computer Vision Analytics & Automated Response System

Sentinel is a high-performance, production-grade intelligence platform designed for real-time monitoring and automated mitigation of security anomalies. Transitioned from a prototype to a fully operational command center, Sentinel leverages a "Cyber-Emerald" aesthetic to deliver high-density, mission-critical data visualizations.

---

## 🌟 Key Features

- **Intelligence Stream**: Real-time terminal-style event logging synchronized with the backend engine.
- **Hex-Scan Packet Inspector**: Deep-dive analysis of neural inference packets with risk scoring and metadata extraction.
- **Cyber-Emerald Command Center**: A high-density dashboard optimized for standalone local demonstration with minimal latency.
- **Neural Cost Oscillation Tracking**: Professional visualizations tracking active latency vs. operational cost oscillations.
- **Automation Orchestration**: Fully functional mitigation protocols (Recalibration, Security Audit, Node Rebalancing) with real-time feedback.
- **Hardware Sync**: Direct integration with local camera hardware for seamless Computer Vision analysis.

## 🛠️ Technology Stack

- **Backend**: FastAPI (Python 3.10+) with SQLAlchemy & SQLite for persistent telemetry.
- **Frontend**: Next.js 14, Tailwind CSS, Lucide React, and Recharts.
- **Engine**: Custom Python Intelligence Engine for autonomous event generation.
- **Database**: Local SQLite (`sentinel.db`) ensuring data persistence without cloud dependencies.

---

## 🚀 Quick Start (Local Standalone)

Sentinel is optimized for local execution without Docker or complex cloud configurations.

### 1. Prerequisite Setup
Ensure you have **Python 3.10+** and **Node.js 18+** installed.

### 2. Initialization
Install dependencies for both layers:
```bash
# Backend
cd vision_monitor
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### 3. Execution
Launch the unified platform using the master runner:
```bash
node start.js
```

- **Command Center**: `http://localhost:3000`
- **Neural API**: `http://localhost:8000/docs`

---

## 🎭 Persona & Branding
The platform is pre-configured for the **Director of Security Operations**. 
- **User**: admin@sentinel.ai
- **Role**: Cluster Administrator

---

## ⚖️ License
Proprietary Sentinel Global Operations License. For demonstration purposes only.
The easiest way to run the project is using the unified Node.js runner:
```bash
node start.js
```

Or using the Windows PowerShell script:
```powershell
./run_dev.ps1
```

### 4. Running Manually
If the script doesn't work, start the services in separate terminals:

**Terminal 1 (Backend):**
```bash
cd vision_monitor
python -m uvicorn app.main:app --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

---

## 📊 Key Modules
- **Overview**: Real-time cluster health and automation hub.
- **Deep Analysis**: High-precision model performance benchmarking.
- **Packet Stream**: Real-time inference log terminal.
- **Telemetry**: Vector extraction and oscillation tracing.
- **Security**: Automated mitigation protocols and threat auditing.

---

## ⚙️ Configuration
Configure your environment in the root `.env` file. For a simple local setup, the default values are sufficient.
- `DATABASE_URL`: Set to a local SQLite path for easy setup.
- `AUTH_ENABLED`: Set to `false` if you want to skip login for demonstration purposes.

---

## 🛠️ Tech Stack
- **Frontend**: Next.js, Tailwind CSS, Lucide Icons, Recharts.
- **Backend**: FastAPI, SQLAlchemy, Python.
- **Design System**: Sentinel Intelligence (Cyber-Emerald Theme).

---

*For college project submission purposes - May 2026*
