import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = __dirname;
const port = Number(process.env.PORT || 5173);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function safePath(urlPath) {
  const withoutQuery = urlPath.split("?")[0] || "/";
  const decoded = decodeURIComponent(withoutQuery);
  const trimmed = decoded === "/" ? "/index.html" : decoded;
  const normalized = normalize(trimmed).replace(/^(\.\.(\/|\\|$))+/, "");
  return join(root, normalized);
}

const server = http.createServer(async (req, res) => {
  try {
    const filePath = safePath(req.url || "/");
    const ext = extname(filePath).toLowerCase();
    const body = await readFile(filePath);

    res.writeHead(200, {
      "Content-Type": mime[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  // eslint-disable-next-line no-console
  console.log(`Serving on http://localhost:${port}`);
});

