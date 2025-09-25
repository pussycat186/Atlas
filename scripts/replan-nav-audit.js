#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

const REPO = process.cwd();
const LIVE = require(path.join(REPO, 'LIVE_URLS.json'));
const OUT = path.join(REPO, 'docs/REPLAN/NAV_AUDIT.json');

function fetchUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 10000 }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve({ status: res.statusCode || 0, contentType: res.headers['content-type'] || '', bytes: buf.length, body: buf.toString('utf8') });
      });
    });
    req.on('error', () => resolve({ status: 0, contentType: '', bytes: 0, body: '' }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, contentType: '', bytes: 0, body: '' }); });
  });
}

async function auditOne(appKey, startUrl) {
  const links = [];
  const res = await fetchUrl(startUrl);
  links.push({ href: startUrl, status: res.status, referer: '', content_type: res.contentType, bytes: res.bytes });
  // Simple same-origin link harvest up to 10 links
  if (res.status === 200 && res.body) {
    const origin = new URL(startUrl).origin;
    const hrefs = Array.from(res.body.matchAll(/href=["']([^"']+)["']/g)).map(m => m[1])
      .filter(h => h.startsWith('/') || h.startsWith(origin))
      .map(h => h.startsWith('/') ? origin + h : h)
      .slice(0, 10);
    for (const href of hrefs) {
      const r = await fetchUrl(href);
      links.push({ href, status: r.status, referer: startUrl, content_type: r.contentType, bytes: r.bytes });
    }
  }
  const summary = { ok: links.filter(l => l.status === 200).length, non200: links.filter(l => l.status !== 200).length };
  return { app: appKey, start_url: startUrl, links, summary };
}

(async function main() {
  const generated_at_utc = new Date().toISOString();
  const apps = [];
  if (LIVE.proof) apps.push(await auditOne('proof', LIVE.proof));
  if (LIVE.admin) apps.push(await auditOne('admin', LIVE.admin));
  if (LIVE.dev) apps.push(await auditOne('dev', LIVE.dev));
  const overall = apps.reduce((acc, a) => ({ ok: acc.ok + a.summary.ok, non200: acc.non200 + a.summary.non200 }), { ok: 0, non200: 0 });
  const out = { schema_version: 1, generated_at_utc, apps, overall };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
})();
