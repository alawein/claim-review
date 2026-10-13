import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import console from "node:console";
import process from "node:process";
const bytes = gzipSync(readFileSync("dist/index.html"), { level: 9 }).length;
console.log(`Standalone HTML gzip: ${bytes} bytes; budget 80000 bytes`);
if (bytes > 80000) process.exitCode = 1;
