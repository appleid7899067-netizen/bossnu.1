# Deployment Guide: Boss Workspace + E2B + Neon + Render

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Render Platform                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐         ┌──────────────────────┐  │
│  │   bossnu-web         │         │   bossnu-runner      │  │
│  │   (Node 22)          │────────▶│   (Docker Sandbox)   │  │
│  │ /api/sandbox         │         │ /execute             │  │
│  │ /api/health          │         │ /health              │  │
│  └──────────────────────┘         └──────────────────────┘  │
│          │                                                    │
│          │ E2B_API_KEY                                       │
│          ▼                                                    │
│  ┌──────────────────────────────────────────────────────────┐│
│  │            E2B Cloud Sandbox (Optional)                  ││
│  │         Bash/Python/Node/Go/Rust/Java/C++               ││
│  └──────────────────────────────────────────────────────────┘│
│          │                                                    │
│          │ DATABASE_URL                                      │
│          ▼                                                    │
│  ┌──────────────────────────────────────────────────────────┐│
│  │     Neon Serverless Postgres (Optional)                  ││
│  │    Persistent workspace + user data                      ││
│  └──────────────────────────────────────────────────────────┘│
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **GitHub Account** - Repository at https://github.com/appleid7899067-netizen/bossnu.1
2. **Render Account** - https://dashboard.render.com (free tier OK)
3. **E2B Account** (Optional) - https://e2b.dev
4. **Neon Account** (Optional) - https://neon.tech

## Step 1: Deploy to Render

### Option A: Blueprint (Recommended - One Click)

1. Go to: https://dashboard.render.com/blueprints
2. Click "New Blueprint"
3. Connect GitHub (authorize if needed)
4. Select: `appleid7899067-netizen/bossnu.1`
5. Click "Apply"
6. Wait 5-10 minutes for both services to build

### Option B: Manual Setup

**Web Service:**

1. New +  → Web Service
2. Connect repo: `appleid7899067-netizen/bossnu.1`
3. Configure:
   - **Name**: `bossnu-web`
   - **Root Directory**: (empty)
   - **Runtime**: Node
   - **Node Version**: 22
   - **Build Command**: `npm ci --no-audit --no-fund && npm run build:render`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
4. Create Web Service

**Runner Service:**

1. New + → Web Service
2. Connect same repo
3. Configure:
   - **Name**: `bossnu-runner`
   - **Runtime**: Docker
   - **Dockerfile Path**: `./sandbox-runner/Dockerfile`
   - **Docker Build Context**: `.`
   - **Health Check Path**: `/health`
4. Create Web Service

## Step 2: Configure Environment Variables

### For `bossnu-web`:

Go to Dashboard → bossnu-web → Environment

| Key | Value | Secret? |
|-----|-------|----------|
| `SANDBOX_RUNNER_URL` | `https://bossnu-runner.onrender.com` | No |
| `SANDBOX_RUNNER_TOKEN` | *(Copy from bossnu-runner)* | Yes |
| `E2B_API_KEY` | *(From e2b.dev dashboard)* | Yes |
| `DATABASE_URL` | *(From neon.tech dashboard)* | Yes |
| `SANDBOX_ALLOW_ORIGIN` | `*` | No |

### For `bossnu-runner`:

Go to Dashboard → bossnu-runner → Environment

| Key | Value | Type |
|-----|-------|------|
| `RUNNER_TOKEN` | *(auto-generated)* | Value |
| `PORT` | `8787` | Value |

**Important**: After creating bossnu-runner, copy its `RUNNER_TOKEN` and paste into bossnu-web's `SANDBOX_RUNNER_TOKEN`.

## Step 3: Verify Deployment

```bash
# Health check
curl https://bossnu-web.onrender.com/api/health

# Expected:
# {
#   "ok": true,
#   "service": "bossnu-web",
#   "features": {
#     "e2b": true,      # if E2B_API_KEY is set
#     "neon": true,     # if DATABASE_URL is set
#     "neonConnected": true  # if Neon is accessible
#   }
# }

# Runner health
curl https://bossnu-runner.onrender.com/health

# Expected: JSON with runner info and version
```

## Step 4: Test Features

### Test 1: Basic Sandbox

1. Open https://bossnu-web.onrender.com/sandbox
2. Select "Bash"
3. Run: `echo "Hello $(hostname)"`
4. Should see: `Hello` + some hostname

### Test 2: E2B (if enabled)

1. Create a Python script in `/sandbox`
2. Run: `print("Hello from E2B")`
3. Should execute via E2B cloud if `E2B_API_KEY` is set

### Test 3: Neon Persistence

1. Create a test table via migrations or direct SQL
2. Verify data persists across app restarts
3. Check Neon dashboard for query logs

## Troubleshooting

### 502 Bad Gateway on /api/health

**Cause**: App crashed during startup

**Fix**:
```bash
# Check logs
# Dashboard → bossnu-web → Logs (scroll to recent)

# Ensure all required env vars are set
# Redeploy manually if needed
```

### E2B executions fail

**Cause**: Invalid API key or quota exceeded

**Fix**:
1. Check API key: https://app.e2b.dev → API Keys
2. Verify account has active credits
3. Check usage dashboard for limits
4. Try disabling E2B (unset `E2B_API_KEY`) to verify runner works

### Neon connection fails

**Cause**: Invalid connection string or network blocked

**Fix**:
1. Copy fresh connection string from Neon dashboard
2. Format: `postgresql://user:password@host/database`
3. Test locally: `psql postgresql://...`
4. In Neon dashboard, whitelist Render IPs if needed

### Runner returns 502

**Cause**: Docker build failed or runtime error

**Fix**:
1. Check runner logs: Dashboard → bossnu-runner → Logs
2. Verify `sandbox-runner/Dockerfile` exists and is valid
3. Ensure `RUNNER_TOKEN` is set
4. Redeploy: Dashboard → Manual Deploy → Latest

## Production Checklist

- [ ] Both services (web + runner) are deployed
- [ ] `/api/health` returns 200 OK
- [ ] `/api/sandbox` responds to GET requests
- [ ] Test command execution (Bash echo or Python print)
- [ ] E2B API key configured (if using E2B)
- [ ] Neon database created (if using Neon)
- [ ] CORS origin configured correctly
- [ ] Rate limits appropriate for your workload
- [ ] Monitoring alerts set up

## Local Development

```bash
# Terminal 1: Local Sandbox Runner
cd sandbox-runner
RUNNER_TOKEN=dev-token PORT=8787 npm start

# Terminal 2: Web App (with local runner)
SANDBOX_RUNNER_URL=http://127.0.0.1:8787 \
SANDBOX_RUNNER_TOKEN=dev-token \
npm run dev

# Terminal 3: Run tests
npm run typecheck
npm run build
npm run test:render
```

## Cost Breakdown

### Render (Free Tier)
- Web service: Free (with 15-min inactivity spin-down)
- Runner service: Free (with 15-min inactivity spin-down)
- Cost: $0/month

### E2B
- Pay-per-execution model
- Typical: $0.01-0.05 per execution
- Free tier: 100 free credits on signup

### Neon
- Free tier: 3 projects, 512 MB storage
- Pro: $0.09/hour compute + $0.25/GB storage
- Typical: $5-20/month for light usage

## Scaling for Production

1. **Render**: Upgrade to paid tier (auto-scaling, no spin-down)
2. **E2B**: Set budget limits in dashboard
3. **Neon**: Auto-scales with usage; set alerts for billing
4. **Runner**: Deploy multiple instances or larger containers
5. **Monitoring**: Add Render metrics + E2B dashboard + Neon monitoring

## Next Steps

1. **Configure custom domain** (Render paid tier)
2. **Set up monitoring** (Render alerts + logging)
3. **Add authentication** (Better Auth to /api/sandbox)
4. **Create CI/CD** (GitHub Actions for tests on push)
5. **Document API** (OpenAPI/Swagger for /api/sandbox)
