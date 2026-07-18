#!/usr/bin/env node

import { checkSourceSize } from "./source_size_policy.mjs";

const report = checkSourceSize();

if (!report.ok) {
  console.error(`Source-size policy failed with ${report.errors.length} error(s):`);
  for (const error of report.errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const bootstrap = report.bootstrap ? " (initial baseline bootstrap)" : "";
  console.log(
    `Source-size policy passed: ${report.scannedFiles} scanned, `
      + `${report.oversizedFiles} grandfathered violations${bootstrap}.`,
  );
}
