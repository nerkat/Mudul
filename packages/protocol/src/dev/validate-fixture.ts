import fs from "fs";
import path from "path";
import { validateSalesCall } from "../salesCall.schema.js";

function run(label: string, filename: string) {
  const filePath = path.join(process.cwd(), "fixtures", filename);
  const content = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(content);
  
  const result = validateSalesCall(json);
  
  if (result.success) {
    console.log(`✅ ${label}: valid`);
  } else {
    console.error(`❌ ${label}: invalid`);
    console.error(JSON.stringify(result.error.issues, null, 2));
    process.exitCode = 1;
  }
}

run("sample", "sales-call.sample.json");
run("invalid", "sales-call.invalid.json");