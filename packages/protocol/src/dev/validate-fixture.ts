import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
// ⬇️ Import the *actual* result type + validator from @protocol
import { validateSalesCall } from "../salesCall.schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function load(p: string) {
  return JSON.parse(readFileSync(resolve(__dirname, "../../fixtures", p), "utf-8"));
}

function run(label: string, file: string, strict = false) {
  const data = load(file);
  const result = validateSalesCall(data); // { success: boolean, data?, errors? }

  if (result.success) {
    console.log(`✅ ${label}: valid`);
  } else {
    console.error(`❌ ${label}: invalid`);
    // Guard print in case errors is undefined
    if (result.errors) {
      console.error(JSON.stringify(result.errors, null, 2));
    }
    if (strict) process.exitCode = 1;
  }
}

const target = process.argv[2] as "sample" | "invalid" | undefined;
const strict = process.argv.includes("--strict");

if (!target) {
  // Default: run both, do not fail build (dev-friendly)
  run("sample", "sales-call.sample.json", false);
  run("invalid", "sales-call.invalid.json", false);
} else {
  run(target, target === "sample" ? "sales-call.sample.json" : "sales-call.invalid.json", strict);
}
