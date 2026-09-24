// Minimal static server for dev/out (used by test.mjs and lighthouse.mjs).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json' };

export function startServer(root, port = 0) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    let file = path.join(root, decodeURIComponent(url.pathname));
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve({ server, port: server.address().port, url: `http://127.0.0.1:${server.address().port}` })));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { url } = await startServer(new URL('./out', import.meta.url).pathname, Number(process.env.PORT || 4173));
  console.log(`serving dev/out at ${url}`);
}
