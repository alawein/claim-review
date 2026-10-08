import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const result = await build({
  entryPoints: ["src/app.ts"],
  bundle: true,
  format: "iife",
  target: "es2022",
  write: false,
  minify: false,
});
const script = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const css = (await readFile("src/style.css", "utf8")).replace(/<\/style/gi, "<\\/style");
const shell = await readFile("src/shell.html", "utf8");
const digest = (value) => createHash("sha256").update(value, "utf8").digest("base64");
const csp = `default-src 'none'; script-src 'sha256-${digest(script)}'; style-src 'sha256-${digest(css)}'; base-uri 'none'; form-action 'none'; object-src 'none'`;
const output = shell
  .replace("__CSP__", csp)
  .replace('<style id="app-style"></style>', `<style>${css}</style>`)
  .replace('<script id="app-script"></script>', `<script>${script}</script>`);
await mkdir("dist", { recursive: true });
await writeFile("dist/index.html", output, "utf8");
