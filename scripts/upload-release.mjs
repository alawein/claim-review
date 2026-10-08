// Idempotent CI upload: never clobber an existing release asset.
import { readFile, readdir, mkdtemp, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { verifyInventory } from "./verify-release-artifacts.mjs";
import { assetDecision } from "./release-policy.mjs";

const version = JSON.parse(await readFile("package.json", "utf8")).version;
const tag = `v${version}`;
const repository = "alawein/claim-review";
await verifyInventory("release-assets", "claim-review", version);
const gh = (args) => execFileSync("gh", args, { encoding: "utf8" });
// Listing uses a successful API response, not a catch-all view failure that
// could confuse denied access with release absence.
const releases = JSON.parse(
  gh(["api", `repos/${repository}/releases`, "--paginate", "--slurp"]),
).flat();
let release = releases.find((row) => row.tag_name === tag);
if (!release) {
  gh([
    "release",
    "create",
    tag,
    "--repo",
    repository,
    "--verify-tag",
    "--title",
    `claim-review ${tag}`,
    "--notes-file",
    "RELEASE_NOTES.md",
  ]);
  release = JSON.parse(gh(["api", `repos/${repository}/releases/tags/${tag}`]));
}
const temporary = await mkdtemp(join(tmpdir(), "claim-release-upload-"));
try {
  for (const file of (await readdir("release-assets")).sort()) {
    const localPath = join("release-assets", file);
    const local = await readFile(localPath);
    const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
    const existing = release.assets.find((row) => row.name === file);
    let existingHash;
    if (existing) {
      gh(["release", "download", tag, "--repo", repository, "--pattern", file, "--dir", temporary]);
      existingHash = hash(await readFile(join(temporary, file)));
    }
    if (assetDecision(existingHash, hash(local)) === "upload")
      gh(["release", "upload", tag, localPath, "--repo", repository]);
    if (!existing) {
      gh(["release", "download", tag, "--repo", repository, "--pattern", file, "--dir", temporary]);
      assetDecision(hash(await readFile(join(temporary, file))), hash(local));
    }
  }
  process.stdout.write("GitHub Release asset bytes verified\n");
} finally {
  await rm(temporary, { recursive: true, force: true });
}
