// Cloud Proxy - execSync v3 (v1 GET logic + fixed POST)
const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TARGET = process.env.TARGET || 'https://mallstore.vercel.app';
const PORT = parseInt(process.env.PORT || '3001', 10);

function curlRequest(method, url, body) {
  const targetUrl = TARGET + url;

  if (!body || body.length === 0) {
    // GET/DELETE: simple command
    const cmd = 'curl -s --max-time 25 -X ' + method + ' "' + targetUrl.replace(/"/g, '') + '"';
    try {
      const result = execSync(cmd, {
        encoding: 'utf8',
        env: Object.assign({}, process.env),
        timeout: 30000,
      });
      console.log('[PROXY] %s %s -> OK (%dB)', method, url, result.length);
      return result;
    } catch (e) {
      console.error('[PROXY] %s %s -> FAIL', method, url);
      return JSON.stringify({ code: 502, message: '云端连接失败', data: null });
    }
  }

  // POST/PUT: write body to temp file, use @file
  const tmpfile = path.join(os.tmpdir(), 'cp_' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.json');
  try {
    fs.writeFileSync(tmpfile, body.toString(), 'utf8');
    const cmd = 'curl -s --max-time 25 -X ' + method +
      ' -H "Content-Type: application/json" ' +
      ' --data-binary @"' + tmpfile + '" "' + targetUrl.replace(/"/g, '') + '"';

    const result = execSync(cmd, {
      encoding: 'utf8',
      env: Object.assign({}, process.env),
      timeout: 30000,
    });
    console.log('[PROXY] %s %s -> OK (%dB) [POST]', method, url, result.length);
    return result;
  } catch (e) {
    console.error('[PROXY] %s %s -> FAIL [POST]', method, url);
    return JSON.stringify({ code: 502, message: '云端连接失败', data: null });
  } finally {
    try { fs.unlinkSync(tmpfile); } catch (_) {}
  }
}

const server = http.createServer((req, res) => {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks);
    try {
      const result = curlRequest(req.method, req.url, body);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(result);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 500, message: e.message, data: null }));
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\nCloud Proxy v3 on http://127.0.0.1:%d -> %s\n', PORT, TARGET);
});
