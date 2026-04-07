/**
 * Keep-Alive Script for Render
 * 
 * This script pings the backend health endpoint to prevent Render from
 * spinning down the free tier service after 15 minutes of inactivity.
 * 
 * Usage:
 * - Run as a cron job every 14 minutes
 * - Set BACKEND_URL environment variable to your Render backend URL
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

function pingHealthEndpoint() {
  const url = new URL(`${BACKEND_URL}/health`);
  const protocol = url.protocol === 'https:' ? https : http;

  console.log(`[${new Date().toISOString()}] Pinging ${url.href}...`);

  const req = protocol.get(url.href, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`✅ Success: Backend is alive (Status: ${res.statusCode})`);
        try {
          const response = JSON.parse(data);
          console.log(`   Database: ${response.database}`);
          console.log(`   Timestamp: ${response.timestamp}`);
        } catch (e) {
          console.log(`   Response: ${data}`);
        }
      } else {
        console.log(`⚠️  Warning: Received status ${res.statusCode}`);
        console.log(`   Response: ${data}`);
      }
      process.exit(0);
    });
  });

  req.on('error', (error) => {
    console.error(`❌ Error: Failed to ping backend`);
    console.error(`   ${error.message}`);
    process.exit(1);
  });

  req.setTimeout(30000, () => {
    console.error('❌ Error: Request timeout (30s)');
    req.destroy();
    process.exit(1);
  });
}

pingHealthEndpoint();
