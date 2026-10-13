import Ajv2020 from "ajv/dist/2020.js";
import standaloneCode from "ajv/dist/standalone/index.js";
import { readFile, writeFile, mkdir } from "node:fs/promises";
const schema = JSON.parse(await readFile("schema/claim-review-packet.v1.json", "utf8"));
const ajv = new Ajv2020({ allErrors: true, code: { source: true, esm: true } });
const code = standaloneCode(ajv, ajv.compile(schema)).replaceAll(
  'require("ajv/dist/runtime/ucs2length").default',
  "ucs2length",
);
await mkdir("src/generated", { recursive: true });
await writeFile(
  "src/generated/packet-validator.js",
  "// Generated from schema/claim-review-packet.v1.json; do not edit.\n" +
    'import ucs2lengthModule from "ajv/dist/runtime/ucs2length.js"; const ucs2length=ucs2lengthModule.default ?? ucs2lengthModule;\n' +
    code +
    "\n",
);
