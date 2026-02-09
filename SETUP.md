# 🚀 SETUP GUIDE: Trading Experiment Dashboard

## Stap 1: GitHub Repository Setup

### 1.1 Create GitHub Repo
```bash
# Op je lokale machine:
cd ~/Desktop
git clone [deze folder die ik je geef]
cd trading-experiment
git init
git add .
git commit -m "Initial commit: Trading experiment dashboard"
```

### 1.2 Push naar GitHub
1. Ga naar https://github.com/new
2. Repository naam: `trading-experiment`
3. Public repo
4. Create repository
5. Push je code:
```bash
git remote add origin https://github.com/[jouw-username]/trading-experiment.git
git branch -M main
git push -u origin main
```

### 1.3 Enable GitHub Pages
1. Ga naar repo Settings
2. Scroll naar "Pages"
3. Source: Deploy from branch
4. Branch: `main`
5. Folder: `/public`
6. Save

**Dashboard URL:** `https://[jouw-username].github.io/trading-experiment/`

---

## Stap 2: Supabase Setup

### 2.1 Create Supabase Project
1. Ga naar https://supabase.com
2. Sign in met GitHub
3. "New Project"
   - Name: `trading-experiment`
   - Database Password: [kies sterke password]
   - Region: West Europe (Amsterdam)
   - Pricing Plan: Free
4. Wait for project creation (~2 min)

### 2.2 Get API Credentials
1. In Supabase Dashboard → Settings → API
2. Copy:
   - **Project URL** (bijv. `https://abc123.supabase.co`)
   - **anon/public key** (lange string)

### 2.3 Run Database Migration
1. In Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy-paste contents van: `supabase/migrations/001_initial_schema.sql`
4. Click "Run" (groene play button)
5. Verify: Tables → zie je `trades`, `positions`, `price_history`

### 2.4 Deploy Edge Function
**Install Supabase CLI:**
```bash
# Mac
brew install supabase/tap/supabase

# Windows
scoop install supabase
```

**Deploy function:**
```bash
cd trading-experiment
supabase login
supabase link --project-ref [jouw-project-id]
supabase functions deploy fetch-prices
```

**Project ID vinden:**
- Supabase Dashboard → Settings → General → Reference ID

---

## Stap 3: Connect Dashboard to Supabase

### 3.1 Update app.js
Open `public/app.js` en replace:
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Met jouw credentials:
```javascript
const SUPABASE_URL = 'https://abc123.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGci...'; // je anon key
```

### 3.2 Push Changes
```bash
git add public/app.js
git commit -m "Add Supabase credentials"
git push
```

Wait 1-2 min voor GitHub Pages deploy.

---

## Stap 4: Test Dashboard

1. Open: `https://[jouw-username].github.io/trading-experiment/`
2. Open browser console (F12)
3. Check for errors
4. Should see:
   - ✅ Live prices loading
   - ✅ Portfolio values updating
   - ✅ Wiebe's trade in trade log

---

## Stap 5: Daily Updates (Optional)

### Auto-update prijzen via GitHub Actions
Create `.github/workflows/update-prices.yml`:

```yaml
name: Update Prices Daily

on:
  schedule:
    - cron: '0 22 * * *'  # Daily at 22:00 UTC (23:00 NL winter, 00:00 summer)
  workflow_dispatch:  # Manual trigger

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Supabase Edge Function
        run: |
          curl -X POST \
            'https://[jouw-project-id].supabase.co/functions/v1/fetch-prices' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}'
```

Add GitHub Secret:
1. Repo Settings → Secrets → Actions
2. New repository secret
3. Name: `SUPABASE_ANON_KEY`
4. Value: [je Supabase anon key]

---

## 🎯 RESULTAAT

Je hebt nu:
- ✅ Live dashboard op `[username].github.io/trading-experiment`
- ✅ Real-time prijzen via Supabase Edge Functions (NO CORS!)
- ✅ Database met trades, positions, price history
- ✅ Gratis hosting (GitHub Pages + Supabase Free tier)
- ✅ Automatic daily price updates (optional)

---

## 🔧 Troubleshooting

### Dashboard laadt niet
- Check GitHub Pages is enabled
- Wait 2-3 min na push
- Check browser console voor errors

### Prices niet laden
- Verify Supabase credentials in app.js
- Check Edge Function deployed: `supabase functions list`
- Test function: `supabase functions invoke fetch-prices`

### Database errors
- Verify migration ran successfully
- Check Row Level Security policies enabled
- Test query in Supabase SQL Editor

---

## 📞 Need Help?
Open een issue op de repo of stuur me een berichtje!
