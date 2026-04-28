#!/bin/bash
# ปรับ Path ให้ตรงกับโครงสร้างจริงใน Mhee_BM_prj
PROJECT_ROOT="/home/hds/Mhee_BM_prj/Webapp"

echo "Stopping existing processes..."
pkill -f uvicorn
pkill -f "npx serve"
sleep 2

echo "Starting Backend on port 6014..."
cd $PROJECT_ROOT/backend
# ใช้ python3 -m uvicorn เพื่อเลี่ยงปัญหา Shebang path พัง
nohup /home/hds/Mhee_BM_prj/Webapp/backend/.venv/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 6014 > /home/hds/Mhee_BM_prj/Webapp/backend.log 2>&1 &
echo "Backend PID: $!"

echo "Starting Frontend on port 6015..."
cd $PROJECT_ROOT/ZoneAnalyzer2
nohup npx serve -s build -l tcp://0.0.0.0:6015 > /home/hds/Mhee_BM_prj/Webapp/frontend.log 2>&1 &
echo "Frontend PID: $!"

sleep 5
echo "--- Verification ---"
curl -s -o /dev/null -w "Backend (6014): %{http_code}\n" http://localhost:6014
curl -s -o /dev/null -w "Frontend (6015): %{http_code}\n" http://localhost:6015
echo "--- Finished ---"
echo "✅ Open https://paniti-jupyter.cra.ac.th/zoneanalyzer/"
