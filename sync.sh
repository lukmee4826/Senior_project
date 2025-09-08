#!/bin/bash
# ===== CONFIG =====
REPO_DIR="$HOME/SENIOR_PROJECT"   # path local ของคุณ
BRANCH="main"                     # เปลี่ยนเป็น branch ที่คุณใช้
# ==================

cd "$REPO_DIR" || exit

echo "📌 Syncing repo at $REPO_DIR"

# 1. เก็บการเปลี่ยนแปลง local
git add .
git commit -m "Auto-sync: $(date '+%Y-%m-%d %H:%M:%S')" || true

# 2. ดึงข้อมูลล่าสุดจาก remote
git pull origin $BRANCH --rebase

# 3. push ขึ้น remote
git push origin $BRANCH

echo "✅ Sync completed!"
