import fs from "fs";

export function loadJSON<T>(path: string): T {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}
