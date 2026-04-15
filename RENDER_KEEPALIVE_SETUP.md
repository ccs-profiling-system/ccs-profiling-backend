# Render Keep-Alive Setup Guide

This guide explains how to prevent your Render backend from spinning down due to inactivity on the free tier.

## Problem

Render's free tier spins down services after 15 minutes of inactivity, causing:
- Slow first requests (cold starts take 30-60 seconds)
- Poor user experience
- Potential timeout issues

## Solution

We've implemented a cron job that pings your backend every 14 minutes to keep it alive.

## Setup Options

### Option 1: Using UptimeRobot (Recommended - 100% Free)

**This is the easiest and completely free solution!**

1. **Sign up at [uptimerobot.com](https://uptimerobot.com)** (free account)

2. **Create a new monitor:**
   - Click "Add New Monitor"
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** CCS Backend Keep-Alive
   - **URL:** `https://your-backend.onrender.com/health`
   - **Monitoring Interval:** 5 minutes (this is the minimum on free tier)
   
3. **Save** - That's it! Your backend will be pinged every 5 minutes automatically.

**Pros:**
- Completely free forever
- No coding required
- Email alerts if your backend goes down
- Simple dashboard to monitor uptime

### Option 2: Using External Cron Service (Alternative - Free)

If you prefer not to use Render's cron jobs, you can use external services:

#### Cron-job.org (Free)
1. Sign up at [cron-job.org](https://cron-job.org)
2. Create a new cron job:
   - **URL:** `https://your-backend.onrender.com/health`
   - **Schedule:** Every 14 minutes
3. Save and activate

#### EasyCron (Free)
1. Sign up at [easycron.com](https://www.easycron.com)
2. Create a new cron job:
   - **URL:** `https://your-backend.onrender.com/health`
   - **Cron Expression:** `*/14 * * * *`
3. Save and activate

### Option 3: Using GitHub Actions (Free)

Create `.github/workflows/keepalive.yml` in your repository:

```yaml
name: Keep Backend Alive

on:
  schedule:
    # Runs every 14 minutes
    - cron: '*/14 * * * *'
  workflow_dispatch: # Allows manual trigger

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Backend
        run: |
          curl -f https://your-backend.onrender.com/health || exit 1
```

## Files Created

- `render.yaml` - Render configuration with cron job definition
- `scripts/keepalive.js` - Node.js script that pings the health endpoint
- `RENDER_KEEPALIVE_SETUP.md` - This documentation

## Testing

Test the keep-alive script locally:

```bash
# Set your backend URL
export BACKEND_URL=https://your-backend.onrender.com

# Run the script
node scripts/keepalive.js
```

Expected output:
```
[2024-01-15T10:30:00.000Z] Pinging https://your-backend.onrender.com/health...
✅ Success: Backend is alive (Status: 200)
   Database: connected
   Timestamp: 2024-01-15T10:30:00.123Z
```

## Monitoring

Check if your keep-alive is working:

1. **UptimeRobot Dashboard:**
   - View uptime percentage and response times
   - Check logs for ping history
   - Get email alerts if backend goes down

2. **Backend Logs (Render Dashboard):**
   - Go to your Web Service
   - Check logs for health check requests every 5-14 minutes

3. **Manual Test:**
   ```bash
   curl https://your-backend.onrender.com/health
   ```

## Cost Considerations

**All recommended options are 100% FREE:**

- **UptimeRobot (Recommended):** Free tier includes 50 monitors with 5-minute intervals - perfect for this use case
- **Cron-job.org:** Free tier with sufficient limits for keep-alive pings
- **GitHub Actions:** 2,000 minutes/month on free tier (more than enough)
- **EasyCron:** Free tier available

**Render Cron Jobs are NOT free** - they require a paid Render plan, so we don't recommend them for this use case.

## Troubleshooting

### Backend still spins down
- Verify monitoring service is active and running
- Check that the URL is correct (include https://)
- Ensure interval is less than 15 minutes
- Check monitoring service logs for errors

### UptimeRobot shows "Down"
- Check if your backend URL is correct
- Verify the `/health` endpoint is accessible
- Check Render logs for errors

### Too many requests / Rate limiting
- 5-minute intervals (UptimeRobot) are safe and won't trigger rate limits
- The `/health` endpoint is lightweight and designed for this purpose

## Alternative: Upgrade to Paid Plan

If you need guaranteed uptime, consider:
- **Render Starter Plan:** $7/month - No spin-down, better performance
- **Render Standard Plan:** $25/month - Enhanced resources and features

## Notes

- The health endpoint (`/health`) is lightweight and doesn't consume significant resources
- UptimeRobot pings every 5 minutes, well within the 15-minute spin-down threshold
- **The `render.yaml` and `scripts/keepalive.js` files are only needed if you use Render's paid cron jobs** - for free solutions like UptimeRobot, you don't need them
- This solution works for free tier; paid Render plans don't spin down and don't need keep-alive
