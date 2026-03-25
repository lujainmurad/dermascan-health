# DermaScan AI

Hospital-grade skin cancer detection platform.

## Start Backend (every session)
```bash
cd backend && bash start.sh
```

Then in PORTS tab → port 8000 → make Public → copy URL.
Update VITE_BACKEND_URL in Lovable to the new URL.

## Every Session Checklist

1. Resume existing Codespace (don't create new)
2. `cd backend && bash start.sh`
3. PORTS tab → port 8000 → Public
4. Copy URL → update Lovable VITE_BACKEND_URL
5. Test: visit /health endpoint

## NOT in GitHub (keep local copies)

- `backend/best_model.pt` — re-upload manually if lost
- `backend/venv310/` — recreated by devcontainer setup

## Phases

- Phase 1: Auth + pages
- Phase 2: Segmentation overlay
- Phase 3: Feature extraction + PDF report
- Phase 4: Classifier (pending)
- Phase 5: Map + booking (pending)
