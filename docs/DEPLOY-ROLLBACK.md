# Deployment and Rollback Procedure

TASQ-ONE uses Vercel for frontend/API hosting, Supabase for PostgreSQL Database and Auth, Upstash for Redis caching, and Cloudflare R2 for attachment storage.

This document outlines the standard deployment process and the critical steps for rolling back in case of a production incident.

---

## 1. Standard Deployment

### Zero-Downtime Deployment
Deployments to production are handled automatically via GitHub Actions (or Vercel GitHub integration) when a merge to the `main` branch occurs. 

1. **Database Migrations (Supabase):**
   - Must be strictly additive. Do not drop columns, rename columns, or remove tables if they are still queried by the current production version of the app.
   - Run migrations via CLI: `npx supabase db push` or let the CI/CD pipeline apply them using the Supabase GitHub Action.
2. **Application Deployment (Vercel):**
   - Vercel automatically builds and deploys the new Next.js image.
   - Traffic is transparently routed to the new deployment once the build succeeds and health checks pass.

---

## 2. Rollback Procedure

When a critical bug or regression is detected in production, a rollback must be executed. 

### Step 2.1: Revert the Application Code (Vercel)

Vercel provides instant rollbacks which do not require rebuilding the application:
1. Go to the **TASQ-ONE Vercel Dashboard**.
2. Navigate to the **Deployments** tab.
3. Find the last known good deployment.
4. Click the **three dots (⋮)** menu on that deployment and select **Promote to Production** (or **Rollback to this Deployment**).
5. Vercel will instantly route all traffic to the old, stable deployment.

Alternatively, via CLI:
```bash
vercel rollback
```

### Step 2.2: Database State Reversal (Supabase)

**WARNING:** Rolling back the database is highly risky because user data written during the broken deployment might be lost or become inconsistent.

If the broken deployment included database migrations that break the *old* (now restored) application code, you have two choices:

**Choice A: Revert Migration (Preferred if no data loss)**
If the migration was easily reversible (e.g., added a table/column that can just be ignored or dropped):
1. Revert the pull request in GitHub (which merges the revert to `main`).
2. Run a new migration locally that reverses the changes, and deploy it.
   ```bash
   npx supabase db diff -f revert_bad_migration
   npx supabase db push
   ```

**Choice B: Point-in-Time Recovery (PITR) (Emergency Only)**
If data was corrupted or irreversible destructive migrations were run, use Supabase Point-in-Time Recovery:
1. Go to the **Supabase Dashboard** -> **Database** -> **Backups**.
2. Select **Point in Time Recovery**.
3. Choose the exact minute right before the bad deployment occurred.
4. Wait for the database instance to restore (can take several minutes).

### Step 2.3: Cache Invalidation (Upstash Redis)

After any rollback, the Redis cache may hold stale data formatted for the bad deployment, which could crash the restored application.

1. Connect to Upstash Redis via CLI or Upstash Console.
2. Flush the cache entirely or invalidate specific organization keys.
   ```bash
   # Emergency: Flush entirely
   redis-cli -u $UPSTASH_REDIS_REST_URL FLUSHDB
   ```

### Step 2.4: Post-Rollback Audit

After rolling back:
1. Monitor Sentry for any new spike in errors.
2. Check `https://<your-domain>/api/v1/health` to ensure DB and Redis are operational.
3. Investigate the root cause in a staging environment.
