# DermaScan AI — Skin Cancer Detection Platform

A hospital-grade web application for AI-powered dermoscopy analysis.

## Architecture
```
Frontend (Lovable)          Backend (GitHub Codespaces)
lovable.dev/projects/...    supreme-space-meme-*.github.dev:8000
        |                              |
        |--- POST /analyze/clinician -->|
        |                              |-- ResNetUNetV4 segmentation
        |                              |-- Feature extraction (ABCDE + PyRadiomics)
        |                              |-- PDF report generation
        |<-- overlay + features + PDF--|
```

## Stack

- **Frontend**: React + TypeScript + Tailwind (Lovable)
- **Auth + DB**: Supabase (Lovable Cloud)
- **Backend**: FastAPI + Python 3.10
- **Segmentation**: ResNetUNetV4 (ResNet-50, trained on ISIC 2017)
- **Features**: ABCDE clinical features + PyRadiomics
- **Reports**: ReportLab PDF generation

## Backend Files
```
backend/
├── main.py           # FastAPI routes
├── model.py          # ResNetUNetV4 architecture
├── segmentation.py   # Mask prediction + overlay generation
├── features.py       # ABCDE + texture + PyRadiomics extraction
├── report.py         # PDF report generation
├── best_model.pt     # Trained segmentation model (not in git)
├── start.sh          # One-command startup
└── venv310/          # Python 3.10 venv (not in git)
```

## Starting the Backend
```bash
cd backend
bash start.sh
```

Backend runs at port 8000. Make port Public in Codespaces Ports tab.

## Frontend

Hosted on Lovable: https://lovable.dev/projects/65019082-eb07-4b59-96c3-37881b940c9d

Set VITE_BACKEND_URL in Lovable secrets to your Codespace URL:
`https://supreme-space-meme-x5wgrj6ppwr739qr4-8000.app.github.dev`

## Important Notes

- `best_model.pt` is NOT committed to git (177MB). Keep a local copy.
- `venv310/` is NOT committed to git. Recreated automatically by devcontainer setup.
- Codespace URL changes each session — update VITE_BACKEND_URL in Lovable each time.

## Phases

- ✅ Phase 1: Auth + all pages + navigation
- ✅ Phase 2: Segmentation overlay connected
- ✅ Phase 3: Feature extraction + PDF report
- ⏳ Phase 4: Classifier (melanoma/SK/nevi confidence score)
- ⏳ Phase 5: Map + booking + email
