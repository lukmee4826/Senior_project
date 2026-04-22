# การเปลี่ยนแปลงสำหรับ Deploy บน Server

> สรุปความแตกต่างระหว่าง local development (`Webapp/`) กับ server deployment (`Webapp_server/`)  
> ตรวจสอบเมื่อ: 2026-04-22

---

## ภาพรวม

การ deploy บน server ใช้รูปแบบ **Single-Port Deployment** คือ FastAPI backend serve ทั้ง API และ Frontend build ผ่าน port เดียวกัน (`6014`) แทนที่จะรัน frontend dev server แยก port

```
[Local Dev]                        [Server Deploy]
Frontend (Vite, port 3000)  →      FastAPI (port 6014)
Backend  (FastAPI, port 6014)         ├── /api/*  (API endpoints)
                                      ├── /uploaded_images/* (static)
                                      └── /*  (serve React build)
```

---

## ไฟล์ที่ต้องแก้ไข (Local → Server)

มีทั้งหมด **3 ไฟล์** ที่ต้องเปลี่ยนเมื่อ deploy

---

### 1. `Webapp/backend/main.py`

**เหตุผล**: เปิดให้ FastAPI serve React build (SPA) ผ่าน port เดียวกัน

```diff
- # FRONTEND_BUILD_DIR = os.path.join(os.path.dirname(__file__), "..", "ZoneAnalyzer2", "build")
- # FRONTEND_BUILD_DIR = os.path.abspath(FRONTEND_BUILD_DIR)
- # if os.path.isdir(FRONTEND_BUILD_DIR):
- #     app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_BUILD_DIR, "assets")), name="frontend-assets")
- #
- #     @app.get("/{full_path:path}", include_in_schema=False)
- #     def serve_spa(full_path: str):
- #         index_path = os.path.join(FRONTEND_BUILD_DIR, "index.html")
- #         if os.path.exists(index_path):
- #             return FileResponse(index_path)
- #         raise HTTPException(status_code=404, detail="Frontend build not found")

+ FRONTEND_BUILD_DIR = os.path.join(os.path.dirname(__file__), "..", "ZoneAnalyzer2", "build")
+ FRONTEND_BUILD_DIR = os.path.abspath(FRONTEND_BUILD_DIR)
+ if os.path.isdir(FRONTEND_BUILD_DIR):
+     app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_BUILD_DIR, "assets")), name="frontend-assets")
+
+     @app.get("/{full_path:path}", include_in_schema=False)
+     def serve_spa(full_path: str):
+         index_path = os.path.join(FRONTEND_BUILD_DIR, "index.html")
+         if os.path.exists(index_path):
+             return FileResponse(index_path)
+         raise HTTPException(status_code=404, detail="Frontend build not found")
```

> ⚠️ ต้อง build frontend ก่อน (`npm run build`) ให้มีโฟลเดอร์ `ZoneAnalyzer2/build/` อยู่แล้ว

---

### 2. `Webapp/ZoneAnalyzer2/vite.config.ts`

**เหตุผล**: ลบ proxy config ออกเนื่องจาก frontend build จะถูก serve จาก FastAPI โดยตรง ไม่ต้องการ proxy อีกต่อไป

```diff
  server: {
    port: 3000,
    open: true,
-   proxy: {
-     "/api": {
-       target: "http://localhost:6014",
-       changeOrigin: true,
-     },
-   },
  },
```

> ℹ️ การเปลี่ยนนี้ใช้ก่อน build เท่านั้น ไม่กระทบ local dev ถ้ายังมี proxy อยู่

---

### 3. `Webapp/ZoneAnalyzer2/src/components/dashboard/ResultsView.tsx`

**เหตุผล**: เปลี่ยน hardcode URL ของเซิร์ฟเวอร์เป็น relative URL เพื่อให้ใช้ได้กับทุก environment

มี **2 จุด** ในไฟล์นี้ที่ต้องแก้:

**จุดที่ 1** (ประมาณบรรทัด 280):
```diff
- src={`http://100.127.9.127:6014/uploaded_images/${localResults[idx].plate.result_image_url.split('\\').pop().split('/').pop()}`}
+ src={`/uploaded_images/${localResults[idx].plate.result_image_url.split('\\').pop().split('/').pop()}`}
```

**จุดที่ 2** (ประมาณบรรทัด 309):
```diff
- src={`http://100.127.9.127:6014/uploaded_images/${currentPlate.result_image_url.split('\\').pop().split('/').pop()}`}
+ src={`/uploaded_images/${currentPlate.result_image_url.split('\\').pop().split('/').pop()}`}
```

---

### 4. `Webapp/ZoneAnalyzer2/src/utils/exportUtils.ts`

**เหตุผล**: เดียวกับข้างบน — URL รูปภาพในฟังก์ชัน export PDF/report

```diff
- const imageUrl = `http://100.127.9.127:6014/uploaded_images/${plate.result_image_url.split('\\').pop().split('/').pop()}`;
+ const imageUrl = `/uploaded_images/${plate.result_image_url.split('\\').pop().split('/').pop()}`;
```

---

## ขั้นตอน Deploy (สรุป)

```bash
# 1. แก้ไข 4 ไฟล์ตามด้านบน

# 2. Build frontend
cd Webapp/ZoneAnalyzer2
npm run build
# จะได้โฟลเดอร์ Webapp/ZoneAnalyzer2/build/

# 3. รัน backend (จะ serve ทั้ง API + frontend)
cd Webapp/backend
uvicorn main:app --host 0.0.0.0 --port 6014
```

---

## การ Revert กลับเป็น Local Dev

ถ้าต้องการกลับมาพัฒนาใน local ให้ **ทำย้อนกลับ** ทุก diff ด้านบน:

1. **`main.py`** → comment out โค้ด serve SPA กลับ
2. **`vite.config.ts`** → เพิ่ม proxy `/api` → `http://localhost:6014` กลับ
3. **`ResultsView.tsx`** / **`exportUtils.ts`** → URL สามารถคงเป็น relative ไว้ได้ (local dev ใช้ proxy จัดการให้)

> ✅ ไฟล์ `ResultsView.tsx` และ `exportUtils.ts` ที่ใช้ relative URL (`/uploaded_images/...`) ใช้ได้ทั้ง local dev (ผ่าน vite proxy) และ server โดยไม่ต้องเปลี่ยนอีก

---

## ไฟล์ที่เหมือนกันทั้งหมด (ไม่ต้องแก้)

| ไฟล์ | สถานะ |
|------|--------|
| `backend/crud.py` | ✅ เหมือนกัน |
| `backend/analysis.py` | ✅ เหมือนกัน |
| `backend/models.py` | ✅ เหมือนกัน |
| `backend/schemas.py` | ✅ เหมือนกัน |
| `backend/database.py` | ✅ เหมือนกัน |
| `backend/auth.py` | ✅ เหมือนกัน |
| `backend/interpretation.py` | ✅ เหมือนกัน |
| `backend/alter_table.py` | ✅ เหมือนกัน |
| `src/` ทั้งหมด (71 ไฟล์) ยกเว้น ResultsView.tsx, exportUtils.ts | ✅ เหมือนกัน |
