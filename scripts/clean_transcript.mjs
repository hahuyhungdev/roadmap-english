#!/usr/bin/env node
import fs from "fs/promises";

const args = process.argv.slice(2);
let file = null;
let url = "http://localhost:3000/api/transcript";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--file" || args[i] === "-f") {
    file = args[i + 1];
    i++;
  } else if (args[i] === "--url") {
    url = args[i + 1];
    i++;
  }
}

let raw = null;
if (file) {
  raw = await fs.readFile(file, "utf8");
} else {
  // try reading stdin
  try {
    const stat = await fs.stat("/dev/stdin");
    if (stat && stat.size > 0) {
      raw = await fs.readFile("/dev/stdin", "utf8");
    }
  } catch (e) {
    // ignore
  }
}

if (!raw) {
  console.error(
    "Usage: node scripts/clean_transcript.mjs --file path/to/transcript.txt",
  );
  console.error("Or: cat transcript.txt | node scripts/clean_transcript.mjs");
  process.exit(1);
}

try {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("API error", res.status, text);
    process.exit(2);
  }

  try {
    const json = JSON.parse(text);
    console.log(JSON.stringify(json, null, 2));
  } catch (e) {
    console.log(text);
  }
} catch (err) {
  console.error("Request failed:", String(err));
  process.exit(3);
}
