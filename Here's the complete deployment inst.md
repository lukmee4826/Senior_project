Here's the complete deployment instruction from scratch:

---

# 🚀 Complete Deployment Guide

## 📁 Step 1: Upload Files (Local PowerShell)

```powershell
# Create folders on server
ssh hds@100.127.9.127 "mkdir -p ~/Webapp/ZoneAnalyzer2 ~/Webapp/backend/models"
```

```powershell
# Upload backend files
scp C:\code\git\Senior_project\Webapp\backend\main.py C:\code\git\Senior_project\Webapp\backend\models.py C:\code\git\Senior_project\Webapp\backend\database.py C:\code\git\Senior_project\Webapp\backend\schemas.py C:\code\git\Senior_project\Webapp\backend\auth.py C:\code\git\Senior_project\Webapp\backend\crud.py C:\code\git\Senior_project\Webapp\backend\analysis.py C:\code\git\Senior_project\Webapp\backend\interpretation.py C:\code\git\Senior_project\Webapp\backend\alter_table.py C:\code\git\Senior_project\Webapp\backend\requirements.txt hds@100.127.9.127:~/Webapp/backend/
```

```powershell
# Upload models folder & database
scp -r C:\code\git\Senior_project\Webapp\backend\models hds@100.127.9.127:~/Webapp/backend/
scp C:\code\git\Senior_project\Webapp\backend\senior_project.db hds@100.127.9.127:~/Webapp/backend/
```

```powershell
# Upload frontend files
scp -r C:\code\git\Senior_project\Webapp\ZoneAnalyzer2\src hds@100.127.9.127:~/Webapp/ZoneAnalyzer2/
```

```powershell
scp C:\code\git\Senior_project\Webapp\ZoneAnalyzer2\package.json C:\code\git\Senior_project\Webapp\ZoneAnalyzer2\package-lock.json C:\code\git\Senior_project\Webapp\ZoneAnalyzer2\vite.config.ts C:\code\git\Senior_project\Webapp\ZoneAnalyzer2\index.html hds@100.127.9.127:~/Webapp/ZoneAnalyzer2/
```

---

## 🖥️ Step 2: SSH into Server

```powershell
ssh hds@100.127.9.127
```

---

## 🐍 Step 3: Setup Backend (First time only)

```bash
cd ~/Webapp/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

## ⚙️ Step 4: Set Frontend API URL & Build

```bash
echo "VITE_API_BASE_URL=http://100.127.9.127:6014" > ~/Webapp/ZoneAnalyzer2/.env
cd ~/Webapp/ZoneAnalyzer2
npm install
npm run build
```

---

## 🚀 Step 5: Start Both Services

```bash
# Kill old processes
pkill -f uvicorn
pkill -f "npx serve"

# Start backend on port 6014
cd ~/Webapp/backend && nohup .venv/bin/uvicorn main:app --host 0.0.0.0 --port 6014 > ~/Webapp/backend.log 2>&1 &

# Start frontend on port 6015
nohup npx serve -s ~/Webapp/ZoneAnalyzer2/build -l tcp://0.0.0.0:6015 > ~/Webapp/frontend.log 2>&1 &
```

Verify both running:
```bash
sleep 5 && curl http://localhost:6014/docs && curl http://localhost:6015
```

---

## 🔌 Step 6: Open SSH Tunnel (New Local PowerShell Window)

```powershell
ssh hds@100.127.9.127 -L 6015:localhost:6015 -L 6014:localhost:6014 -N
```

---

## 🌐 Step 7: Open Browser

```
http://localhost:6015
```

---

## 🔄 Re-deploy After Code Changes

```powershell
# 1. Upload changed files (local PowerShell)
scp C:\code\git\Senior_project\Webapp\backend\main.py hds@100.127.9.127:~/Webapp/backend/
```

```bash
# 2. Restart backend (server)
pkill -f uvicorn
cd ~/Webapp/backend && nohup .venv/bin/uvicorn main:app --host 0.0.0.0 --port 6014 > ~/Webapp/backend.log 2>&1 &
```

```bash
# 3. Rebuild & restart frontend (server) - only if frontend changed
cd ~/Webapp/ZoneAnalyzer2 && npm run build
pkill -f "npx serve"
nohup npx serve -s ~/Webapp/ZoneAnalyzer2/build -l tcp://0.0.0.0:6015 > ~/Webapp/frontend.log 2>&1 &
```

---

## 🛠️ Useful Debug Commands

```bash
# Check logs
tail -50 ~/Webapp/backend.log
tail -50 ~/Webapp/frontend.log

# Check running ports
ss -tlnp | grep 601

# Check running processes
ps aux | grep -E "uvicorn|serve"

เช็คก่อนว่า process ยังอยู่มั้ย:
bashcurl -s -o /dev/null -w "Backend: %{http_code}\n" http://localhost:6014
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:6015
ถ้ายัง 200 อยู่ทั้งคู่ — ไม่ต้องทำอะไร เปิด http://100.127.9.127:6015 ได้เลย ทั้งคุณและคนอื่นใน Tailscale!
```