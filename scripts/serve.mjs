import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
const server = createServer(async (request, response) => {
  if (request.url !== "/") {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  try {
    const content = await readFile("dist/index.html");
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(content);
  } catch {
    response.writeHead(500);
    response.end("Build missing");
  }
});
server.listen(4173, "127.0.0.1");
