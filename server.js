import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { createReadStream } from "node:fs";

const PORT = parseInt(process.env.PORT) || 3000;
const DIST = new URL("./dist", import.meta.url).pathname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json",
};

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
};

function getCacheControl(filePath) {
  if (filePath.includes("/assets/")) return "public, max-age=31536000, immutable";
  if (filePath.endsWith("sw.js") || filePath.includes("workbox-")) return "no-cache, no-store, must-revalidate";
  if (filePath.endsWith(".html")) return "no-cache";
  if (filePath.endsWith(".png") || filePath.endsWith(".svg") || filePath.endsWith(".webmanifest")) return "public, max-age=86400";
  return "public, max-age=3600";
}

async function serveFile(res, filePath) {
  const ext = extname(filePath);
  const mime = MIME[ext] || "application/octet-stream";
  const cache = getCacheControl(filePath);

  res.writeHead(200, {
    "Content-Type": mime,
    "Cache-Control": cache,
    ...SECURITY_HEADERS,
  });
  createReadStream(filePath).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let filePath = join(DIST, url.pathname);

    // Try the exact file
    try {
      const s = await stat(filePath);
      if (s.isFile()) return serveFile(res, filePath);
      if (s.isDirectory()) {
        filePath = join(filePath, "index.html");
        const s2 = await stat(filePath);
        if (s2.isFile()) return serveFile(res, filePath);
      }
    } catch {}

    // SPA fallback: serve index.html for all routes
    const indexPath = join(DIST, "index.html");
    return serveFile(res, indexPath);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Ennie running on port ${PORT}`);
});
