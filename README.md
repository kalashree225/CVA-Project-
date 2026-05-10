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

### 1. Prerequisites
- **Python 3.9+**
- **Node.js 18+**
- **npm** (comes with Node.js)

### 2. Initial Setup
Clone the repository and install dependencies:

**Backend Setup:**
```bash
cd vision_monitor
pip install -r ../requirements.txt
```

**Frontend Setup:**
```bash
cd frontend
npm install
```

### 3. Running the Platform (Windows)
Run the automated dev script from the root directory:
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
