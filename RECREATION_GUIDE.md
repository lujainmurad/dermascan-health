# DermaScan AI — Complete Recreation Guide

How to rebuild everything from scratch if you ever need to start over.
Follow every step in exact order.

---

## What You Need Before Starting

- GitHub account (github.com/lujainmurad)
- Lovable account (lovable.dev)
- Your `best_model.pt` file saved locally (177MB)
- About 2–3 hours for the full setup

---

## PART 1 — Supabase Setup

### Step 1 — Create Supabase Project

1. Go to supabase.com → click **Start your project** → sign up or log in
2. Click **New Project**
3. Name it `skincancer-app`
4. Set a strong database password — **save this password**
5. Select the closest region to you
6. Click **Create new project** — wait ~2 minutes

### Step 2 — Get Your API Keys

1. Go to **Settings → API Keys** in the left sidebar
2. Click the **"Legacy anon, service_role API keys"** tab
3. Copy and save both keys:
   - **anon key** — starts with `eyJhbG...` — this is your public key
   - **service_role key** — also starts with `eyJhbG...` — keep this secret
4. Your **Project URL** is: `https://YOUR-PROJECT-ID.supabase.co`
   (visible in your browser URL bar when on the Supabase dashboard)

### Step 3 — Create Database Tables

1. Go to **SQL Editor** in the left sidebar
2. Click **New query**
3. Paste this entire block and click **Run**:

```sql
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text check (role in ('patient', 'clinician')) not null,
  full_name text,
  hospital text,
  specialty text,
  phone text,
  verified boolean default false,
  created_at timestamptz default now()
);

create table public.cases (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.profiles(id),
  clinician_id uuid references public.profiles(id),
  image_path text,
  overlay_path text,
  confidence_score float,
  prediction text,
  recommendation text,
  report_path text,
  created_at timestamptz default now()
);

create table public.appointments (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.profiles(id),
  clinician_id uuid references public.profiles(id),
  status text default 'pending',
  notes text,
  scheduled_at timestamptz,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.appointments enable row level security;

create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Clinicians can read patient cases" on public.cases
  for select using (auth.uid() = clinician_id or auth.uid() = patient_id);
create policy "Anyone authenticated can insert cases" on public.cases
  for insert with check (auth.uid() = patient_id or auth.uid() = clinician_id);
create policy "Users can read own appointments" on public.appointments
  for select using (auth.uid() = patient_id or auth.uid() = clinician_id);
create policy "Users can insert appointments" on public.appointments
  for insert with check (auth.uid() = patient_id);
```

You should see: **"Success. No rows returned"**

### Step 4 — Create Storage Bucket

1. Go to **Storage** in left sidebar
2. Click **New bucket**
3. Name it exactly: `dermoscopy-images`
4. Keep it **Private**
5. Click **Create bucket**

### Step 5 — Add Storage Policies

1. Go to **SQL Editor** → **New query**
2. Paste and run:

```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'dermoscopy-images');

CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'dermoscopy-images');
```

Supabase setup is complete.

---

## PART 2 — Lovable Frontend Setup

### Step 6 — Create Lovable Project

1. Go to lovable.dev → sign up or log in
2. Click **New Project**
3. Paste the full prompt below into the chat box
4. Wait 2–3 minutes for generation

### The Lovable Prompt

```
Build a professional medical web application for skin cancer detection designed for hospital integration. The app is called "DermaScan AI".

## IMPORTANT TECHNICAL NOTE
The AI analysis backend is hosted on an external GitHub Codespaces server, NOT in Lovable. All pages and UI must be built fully, but any button that triggers AI analysis should POST to a configurable backend URL stored in a frontend environment variable called VITE_BACKEND_URL. This variable will be filled in after the backend is deployed. For now, show a clear "Backend not connected" message if the variable is not set.

## Auth and Roles
Use Supabase for all authentication. Email/password signup and login only. On signup, user must choose their role: Patient or Clinician. After signup, send email verification via Supabase. After email verified and logged in, redirect based on role: Patient to Patient Dashboard, Clinician to Clinician Dashboard. In Account Settings, clinicians can complete their profile: full name, hospital name, specialty, phone number.

## Pages Required

### Shared Pages
1. Landing page with hero section, brief explanation of the two portals, CTA buttons for Sign Up and Login
2. Login page with email/password, role detected from database, redirect by role
3. Register page with email, password, role selector (Patient or Clinician)
4. Email verification pending page
5. Account Settings page

### Patient Pages
6. Patient Dashboard with quick action cards: Analyze a Lesion, My Appointments, Find a Specialist
7. Lesion Analysis page with camera capture button OR file upload, image preview, Analyze button that POSTs to VITE_BACKEND_URL/analyze/patient with the image, shows result: risk_level + confidence percentage + recommendation text, if high risk show Book Appointment button
8. Find Specialist page with search, list of registered clinicians from Supabase profiles table where role=clinician and verified=true
9. Book Appointment page with clinician dropdown, date/time picker, notes field, saves to appointments table
10. My Appointments page listing patient appointments with status badges

### Clinician Pages
11. Clinician Dashboard with stats cards and quick actions
12. Image Analysis page with file upload, image preview, Analyze button that POSTs to VITE_BACKEND_URL/analyze/clinician with the image as multipart form, shows overlay_image side by side with original, feature_summary card with all 10 values, Download Report button that downloads report_pdf as dermascan_report.pdf when report_ready is true
13. Patient Cases page listing all cases where clinician_id matches current user
14. Patient History Detail page showing full case details
15. Clinician Appointments page with confirm/cancel buttons

## Design
Clean professional medical aesthetic. Primary color deep teal #0B6E6E, accent soft white and light grey. Responsive. Patient nav: Dashboard, Analyze, Find Specialist, Appointments. Clinician nav: Dashboard, Analyze Image, Patient Cases, Appointments. No fake placeholder names. Loading spinners on all async actions. Toast notifications for success/error.

## Backend Integration
The backend /analyze/clinician returns: overlay_image (base64 PNG), mask_image (base64 PNG), lesion_area_pct (float), prediction (string), confidence (float or null), recommendation (string), feature_summary (object with keys: asymmetry, border_irregularity, n_colors, solidity, lesion_area_pct, major_axis, minor_axis, eccentricity, glcm_contrast, lbp_entropy), report_pdf (base64 PDF string starting with data:application/pdf;base64,...), report_ready (boolean).

The backend /analyze/patient returns: risk_level (string: low/moderate/high), confidence (float), lesion_area_pct (float), recommendation (string), should_consult (boolean).

Specify to Lovable that the backend is hosted on GitHub Codespaces, not in Lovable. Make the Download Report button decode the base64 PDF and trigger a browser file download.
```

### Step 7 — Connect Supabase to Lovable

After generation:

1. Look at the Lovable chat — it will show "This project is already running on Lovable Cloud"
2. This means Lovable auto-created its own Supabase — **use this, not the one you created in Part 1**
3. The Lovable Supabase already has your tables (profiles, cases, appointments) created automatically
4. You can ignore the Supabase project you created in Part 1 (or delete it)

### Step 8 — Push to GitHub

1. In Lovable, click the **GitHub icon** in the top toolbar
2. Go to **Settings → GitHub** tab
3. Click **Connect to GitHub** → authorize
4. A repo is created at `github.com/YOUR-USERNAME/dermascan-health`
5. Confirm it's connected

---

## PART 3 — GitHub Codespaces Backend Setup

### Step 9 — Open Codespace

1. Go to your GitHub repo
2. Click the green **Code** button
3. Click **Codespaces** tab
4. Click **Create codespace on main**
5. Wait ~2 minutes for it to load

### Step 10 — Create Backend Folder Structure

In the Codespace terminal:

```bash
cd /workspaces/dermascan-health
mkdir -p backend/uploads backend/outputs
cd backend
```

### Step 11 — Install Python 3.10

```bash
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt-get update -y
sudo apt-get install -y python3.10 python3.10-dev python3.10-venv
python3.10 --version
```

Should print: `Python 3.10.20`

### Step 12 — Create Python 3.10 Virtual Environment and Install All Packages

Run this as one block — takes 10–15 minutes:

```bash
python3.10 -m venv venv310 && \
source venv310/bin/activate && \
pip install --upgrade pip setuptools wheel && \
pip install numpy==1.26.4 && \
pip install SimpleITK && \
pip install pyradiomics==3.0.1 --no-build-isolation && \
pip install opencv-python-headless==4.8.1.78 tqdm scipy && \
pip install torch==2.2.2 torchvision==0.17.2 --index-url https://download.pytorch.org/whl/cpu && \
pip install fastapi==0.111.0 uvicorn==0.29.0 python-multipart==0.0.9 Pillow==10.3.0 reportlab==4.1.0
```

### Step 13 — Verify Installation

```bash
python -c "import sys, torch, fastapi, reportlab; from radiomics import featureextractor; import cv2, numpy, SimpleITK as sitk; print('Python:', sys.version[:6]); print('numpy:', numpy.__version__); print('torch:', torch.__version__); print('ALL READY')"
```

Must print: `ALL READY`

### Step 14 — Create the 5 Backend Python Files

Copy each file content from the GitHub repo into the Codespace. Files needed:

- `backend/model.py` — ResNetUNetV4 architecture
- `backend/segmentation.py` — mask prediction + overlay
- `backend/features.py` — ABCDE + PyRadiomics feature extraction
- `backend/report.py` — PDF generation
- `backend/main.py` — FastAPI routes

These files are already in the GitHub repo — they were committed during the original session. They should already be present in your Codespace since it clones the repo.

Verify:

```bash
ls /workspaces/dermascan-health/backend/
```

You should see: `main.py  model.py  segmentation.py  features.py  report.py  requirements.txt  start.sh`

### Step 15 — Upload best_model.pt

1. In Codespace file explorer (left panel), navigate to `backend/`
2. Right-click the `backend` folder → **Upload**
3. Select your `best_model.pt` file (177MB)
4. Wait for upload to complete
5. Verify: `ls -lh backend/best_model.pt` should show ~177MB

### Step 16 — Create the Startup Script

```bash
cat > /workspaces/dermascan-health/backend/start.sh << 'EOF'
#!/bin/bash
cd /workspaces/dermascan-health/backend
source venv310/bin/activate
python main.py
EOF
chmod +x /workspaces/dermascan-health/backend/start.sh
```

### Step 17 — Start the Backend

```bash
cd /workspaces/dermascan-health/backend
bash start.sh
```

Should print:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Step 18 — Make Port 8000 Public

1. Click **PORTS** tab at the bottom of VS Code
2. Right-click port 8000 → **Port Visibility** → **Public**
3. Copy the URL (format: `https://xxx-8000.app.github.dev`)
4. Test: visit `https://YOUR-URL/health` — should return `{"status":"ok",...}`

### Step 19 — Connect Frontend to Backend

In the Lovable chat box:

```
Update VITE_BACKEND_URL to https://YOUR-CODESPACE-URL-8000.app.github.dev
```

### Step 20 — Save Everything to GitHub

```bash
cd /workspaces/dermascan-health
echo "backend/venv310/" >> .gitignore
echo "backend/best_model.pt" >> .gitignore
echo "backend/uploads/*" >> .gitignore
echo "backend/outputs/*" >> .gitignore
git add .
git commit -m "Initial backend setup complete"
git push origin main
```

### Step 21 — Create devcontainer for Future Sessions

```bash
mkdir -p /workspaces/dermascan-health/.devcontainer

cat > /workspaces/dermascan-health/.devcontainer/devcontainer.json << 'EOF'
{
  "name": "DermaScan Health",
  "postCreateCommand": "bash .devcontainer/setup.sh",
  "forwardPorts": [8000],
  "portsAttributes": {
    "8000": {
      "label": "DermaScan Backend",
      "onAutoForward": "notify",
      "visibility": "public"
    }
  }
}
EOF

cat > /workspaces/dermascan-health/.devcontainer/setup.sh << 'EOF'
#!/bin/bash
set -e
echo "=== DermaScan Auto Setup ==="
sudo apt-get update -y
sudo apt-get install -y python3.10 python3.10-dev python3.10-venv
if [ ! -d "/workspaces/dermascan-health/backend/venv310" ]; then
  python3.10 -m venv /workspaces/dermascan-health/backend/venv310
fi
source /workspaces/dermascan-health/backend/venv310/bin/activate
pip install --upgrade pip setuptools wheel -q
pip install numpy==1.26.4 -q
pip install SimpleITK -q
pip install pyradiomics==3.0.1 --no-build-isolation -q
pip install opencv-python-headless==4.8.1.78 tqdm scipy -q
pip install torch==2.2.2 torchvision==0.17.2 --index-url https://download.pytorch.org/whl/cpu -q
pip install fastapi==0.111.0 uvicorn==0.29.0 python-multipart==0.0.9 Pillow==10.3.0 reportlab==4.1.0 -q
cd /workspaces/dermascan-health && npm install --silent
echo "=== Setup complete ==="
EOF

chmod +x /workspaces/dermascan-health/.devcontainer/setup.sh
git add .devcontainer/
git commit -m "Add devcontainer auto-setup"
git push origin main
```

---

## PART 4 — Test End to End

### Step 22 — Full Test

1. Open the Lovable preview URL
2. Sign up as a clinician with a real email
3. Verify your email (check inbox)
4. Log in → you should land on Clinician Dashboard
5. Click **Analyze Image**
6. Upload a dermoscopy image (JPG or PNG)
7. Click **Analyze**
8. Wait 60–90 seconds on first run (model loads)
9. You should see:
   - Original image + teal overlay side by side
   - Feature summary card with 10 values
   - **Download Report** button
10. Click Download Report → PDF opens with both images and all feature tables

If all of that works, the full Phase 1–3 setup is complete.

---

## Package Version Reference

These exact versions must be used. Do not upgrade without testing.

```
Python:                    3.10.20  (via deadsnakes PPA)
numpy:                     1.26.4   (PINNED — PyRadiomics breaks on 2.x)
SimpleITK:                 2.5.3
pyradiomics:               3.0.1    (install with --no-build-isolation)
opencv-python-headless:    4.8.1.78
scipy:                     latest
torch:                     2.2.2+cpu (CPU-only build)
torchvision:               0.17.2+cpu
fastapi:                   0.111.0
uvicorn:                   0.29.0
python-multipart:          0.0.9
Pillow:                    10.3.0
reportlab:                 4.1.0
```

---

## Supabase Database Schema Reference

```sql
-- profiles: one row per user, extends auth.users
profiles (
  id uuid PRIMARY KEY,  -- same as auth.users.id
  role text,            -- 'patient' or 'clinician'
  full_name text,
  hospital text,
  specialty text,
  phone text,
  verified boolean,
  created_at timestamptz
)

-- cases: one row per analysis
cases (
  id uuid PRIMARY KEY,
  patient_id uuid,       -- references profiles.id
  clinician_id uuid,     -- references profiles.id
  image_path text,
  overlay_path text,
  confidence_score float,
  prediction text,
  recommendation text,
  report_path text,
  created_at timestamptz
)

-- appointments: booking records
appointments (
  id uuid PRIMARY KEY,
  patient_id uuid,
  clinician_id uuid,
  status text,           -- 'pending', 'confirmed', 'cancelled'
  notes text,
  scheduled_at timestamptz,
  created_at timestamptz
)
```

---

## Things That Can Go Wrong and How to Fix Them

| Problem | Cause | Fix |
|---|---|---|
| Port 8000 shows Private | Codespace reset it | PORTS tab → right-click 8000 → Public |
| "Failed to fetch" in browser | URL outdated in Lovable | Re-copy URL, update VITE_BACKEND_URL in Lovable |
| "Address already in use" | Old server still running | `pkill -f "python main.py" && sleep 2 && python main.py` |
| PyRadiomics import error | Wrong Python or NumPy | `source venv310/bin/activate` first, then check `python --version` |
| Model not found | best_model.pt not uploaded | Re-upload via file explorer |
| Disk full | venv or cache too large | `pip cache purge` |
| Push rejected by GitHub | Remote has newer commits | `git pull origin main --rebase` then `git push origin main` |
| venv310 missing after Codespace restart | Codespace was deleted | Re-run setup commands from Step 11–13 |
