#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

const REPO = process.cwd();
const LIVE = require(path.join(REPO, 'LIVE_URLS.json'));
// Resolve URLs from nested schema {frontends:{...}, backends:{...}} or legacy flat keys
function getFrontend(key) {
  if (LIVE && LIVE.frontends && typeof LIVE.frontends[key] === 'string') return LIVE.frontends[key];
  if (typeof LIVE[key] === 'string') return LIVE[key];
  return undefined;
}
function getGateway() {
  if (LIVE && LIVE.backends && typeof LIVE.backends.gateway === 'string') return LIVE.backends.gateway;
  if (typeof LIVE.gateway === 'string') return LIVE.gateway;
  return undefined;
}
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
  const origin = new URL(startUrl).origin;
  let manifestUrl = null;
  const assetUrls = new Set();
  
  // Check /prism route specifically
  const prismUrl = origin + '/prism';
  const prismRes = await fetchUrl(prismUrl);
  const hasPrismMarker = prismRes.body && prismRes.body.includes('ATLAS • Prism UI — Peak Preview');
  links.push({ 
    href: prismUrl, 
    status: prismRes.status, 
    referer: startUrl, 
    content_type: prismRes.contentType, 
    bytes: prismRes.bytes,
    prism_marker: hasPrismMarker
  });
  
  // Parse page HTML for icon and manifest links
  if (res.status >= 200 && res.status < 400 && res.body) {
    const hrefs = Array.from(res.body.matchAll(/href=["']([^"']+)["']/g)).map(m => m[1]);
    const rels = Array.from(res.body.matchAll(/<link[^>]*rel=["']([^"']+)["'][^>]*href=["']([^"']+)["'][^>]*>/gi))
      .map(([, rel, href]) => ({ rel: rel.toLowerCase(), href }));
    for (const { rel, href } of rels) {
      if (rel.includes('icon')) {
        const u = href.startsWith('http') ? href : origin + (href.startsWith('/') ? href : '/' + href);
        assetUrls.add(u);
      }
      if (rel.includes('manifest')) {
        manifestUrl = href.startsWith('http') ? href : origin + (href.startsWith('/') ? href : '/' + href);
      }
    }
    // Also crawl a few same-origin page links
    const pageHrefs = hrefs
      .filter(h => h.startsWith('/') || h.startsWith(origin))
      .map(h => h.startsWith('/') ? origin + h : h)
      .slice(0, 10);
    for (const href of pageHrefs) {
      const r = await fetchUrl(href);
      links.push({ href, status: r.status, referer: startUrl, content_type: r.contentType, bytes: r.bytes });
    }
  }
  // Fetch manifest and its icons
  if (manifestUrl) {
    const mr = await fetchUrl(manifestUrl);
    links.push({ href: manifestUrl, status: mr.status, referer: startUrl, content_type: mr.contentType, bytes: mr.bytes });
    if (mr.status === 200 && /json/.test(mr.contentType)) {
      try {
        const m = JSON.parse(mr.body || '{}');
        const icons = Array.isArray(m.icons) ? m.icons : [];
        for (const ic of icons) {
          if (!ic || !ic.src) continue;
          const src = ic.src;
          const u = src.startsWith('http') ? src : origin + (src.startsWith('/') ? src : '/' + src);
          assetUrls.add(u);
        }
      } catch {}
    }
  }
  for (const u of assetUrls) {
    const r = await fetchUrl(u);
    links.push({ href: u, status: r.status, referer: manifestUrl || startUrl, content_type: r.contentType, bytes: r.bytes });
  }
  const prismLink = links.find(l => l.href && l.href.endsWith('/prism'));
  const prismOk = prismLink && prismLink.status >= 200 && prismLink.status < 400 && prismLink.prism_marker;
  const summary = { 
    ok: links.filter(l => l.status >= 200 && l.status < 400).length, 
    non200: links.filter(l => !(l.status >= 200 && l.status < 400)).length,
    prism_ok: prismOk
  };
  return { app: appKey, start_url: startUrl, links, summary };
}

(async function main() {
  const generated_at_utc = new Date().toISOString();
  const apps = [];
  const proof = getFrontend('proof_messenger');
  const admin = getFrontend('admin_insights');
  const dev = getFrontend('dev_portal');
  if (proof) apps.push(await auditOne('proof_messenger', proof));
  if (admin) apps.push(await auditOne('admin_insights', admin));
  if (dev) apps.push(await auditOne('dev_portal', dev));
  const overall = apps.reduce((acc, a) => ({ ok: acc.ok + a.summary.ok, non200: acc.non200 + a.summary.non200 }), { ok: 0, non200: 0 });
  const out = { schema_version: 2, generated_at_utc, apps, overall };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  const ts = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const folder = path.join(REPO, 'docs/evidence', `${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}`);
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(path.join(folder, 'nav_audit.json'), JSON.stringify(out, null, 2));
})();
