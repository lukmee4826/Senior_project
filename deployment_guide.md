# 🚀 Complete Deployment Guide — ZoneAnalyzer

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
pip install --upgrade ultralytics
```

---

## ⚙️ Step 4: Set Frontend API URL & Build

```bash
# Set API URL to domain
echo "VITE_API_BASE_URL=https://paniti-jupyter.cra.ac.th/zoneanalyzer/api" > ~/Webapp/ZoneAnalyzer2/.env

# Fix image URLs to point to domain (run only once after fresh upload)
sed -i 's|src={`/uploaded_images/|src={`https://paniti-jupyter.cra.ac.th/zoneanalyzer/uploaded_images/|g' ~/Webapp/ZoneAnalyzer2/src/components/dashboard/ResultsView.tsx
sed -i 's|const imageUrl = `/uploaded_images/|const imageUrl = `https://paniti-jupyter.cra.ac.th/zoneanalyzer/uploaded_images/|g' ~/Webapp/ZoneAnalyzer2/src/utils/exportUtils.ts

# Verify URLs look correct (should show domain URL, not duplicated)
grep -n "uploaded_images" ~/Webapp/ZoneAnalyzer2/src/components/dashboard/ResultsView.tsx
grep -n "uploaded_images" ~/Webapp/ZoneAnalyzer2/src/utils/exportUtils.ts

# Install & build
cd ~/Webapp/ZoneAnalyzer2
npm install
npm run build
```

---

## 🚀 Step 5: Start Both Services

```bash
~/Webapp/start.sh
```

ถ้ายังไม่มี start.sh ให้สร้างก่อน (ทำครั้งเดียว):

```bash
cat > ~/Webapp/start.sh << 'EOF'
#!/bin/bash
pkill -f uvicorn
pkill -f "npx serve"
sleep 1

# Start backend on port 6014
cd ~/Webapp/backend && nohup .venv/bin/uvicorn main:app --host 0.0.0.0 --port 6014 > ~/Webapp/backend.log 2>&1 &
echo "Backend PID: $!"

# Start frontend on port 6015
nohup npx serve -s ~/Webapp/ZoneAnalyzer2/build -l tcp://0.0.0.0:6015 > ~/Webapp/frontend.log 2>&1 &
echo "Frontend PID: $!"

sleep 3
curl -s -o /dev/null -w "Backend: %{http_code}\n" http://localhost:6014
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:6015
EOF
chmod +x ~/Webapp/start.sh
```

---

## 🌐 Step 6: Open Browser

```
https://paniti-jupyter.cra.ac.th/zoneanalyzer/
```

> ไม่ต้องทำ SSH tunnel แล้ว! ใครก็เปิดได้เลย ไม่ต้อง VPN

---

## 🔄 Re-deploy After Code Changes

```powershell
# 1. Upload changed files (local PowerShell)
scp C:\code\git\Senior_project\Webapp\backend\main.py hds@100.127.9.127:~/Webapp/backend/
```

```bash
# 2. Restart backend (server) - only if backend changed
pkill -f uvicorn
cd ~/Webapp/backend && nohup .venv/bin/uvicorn main:app --host 0.0.0.0 --port 6014 > ~/Webapp/backend.log 2>&1 &
```

```bash
# 3. Rebuild & restart frontend (server) - only if frontend changed
# ⚠️ หลังจาก upload src ใหม่ ต้อง fix image URLs ก่อน build ทุกครั้ง
sed -i 's|src={`/uploaded_images/|src={`https://paniti-jupyter.cra.ac.th/zoneanalyzer/uploaded_images/|g' ~/Webapp/ZoneAnalyzer2/src/components/dashboard/ResultsView.tsx
sed -i 's|const imageUrl = `/uploaded_images/|const imageUrl = `https://paniti-jupyter.cra.ac.th/zoneanalyzer/uploaded_images/|g' ~/Webapp/ZoneAnalyzer2/src/utils/exportUtils.ts

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

# Check both services up
curl -s -o /dev/null -w "Backend: %{http_code}\n" http://localhost:6014
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:6015
```

---

## 📝 nginx Config (อาจารย์ตั้งค่าแล้ว ✅)

```nginx
location /zoneanalyzer/ {
    proxy_pass http://localhost:6015/;
}

location /zoneanalyzer/api/ {
    proxy_pass http://localhost:6014/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /zoneanalyzer/uploaded_images/ {
    proxy_pass http://localhost:6014/uploaded_images/;
    proxy_set_header Host $host;
}
```
## Run the web app easy way

```bash
~/Webapp/start.sh
```