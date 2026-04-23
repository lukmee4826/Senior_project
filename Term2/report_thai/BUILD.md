# วิธี Compile LaTeX Report

## Option A: Overleaf (แนะนำ — ไม่ต้องติดตั้งอะไรเพิ่ม)
1. ไปที่ https://overleaf.com
2. New Project → Upload Project
3. Zip ทั้ง folder `report_latex/` แล้ว upload
4. ตั้ง compiler เป็น **XeLaTeX**
5. Compile → Download PDF

## Option B: ติดตั้ง MiKTeX บน Windows
```
winget install MiKTeX.MiKTeX
```
แล้ว compile ด้วย:
```
xelatex main.tex
bibtex main
xelatex main.tex
xelatex main.tex
```

## Font ที่ต้องใช้
- **TH Sarabun New** — ดาวน์โหลดจาก https://www.f0nt.com/release/th-sarabun-new/
  แล้ว install ลง Windows ก่อน compile

## Figures ที่ต้องเตรียม
- `figures/kmutt_logo.png` — logo มหาวิทยาลัย
- `figures/system_architecture.png` — diagram สถาปัตยกรรมระบบ
- รูปผลการทดลองต่างๆ (TODO)

## TODO ที่ยังต้องกรอก
- [ ] ค่า MAE, precision, recall จาก Term 1 report → ch4
- [ ] Related works (3-5 papers) → ch2
- [ ] System architecture diagram → ch3
- [ ] จำนวน epochs, batch size, GPU spec → ch3
- [ ] OCR accuracy table → ch4
- [ ] KMUTT logo file → figures/
- [ ] References เพิ่มเติมจาก Term 1
