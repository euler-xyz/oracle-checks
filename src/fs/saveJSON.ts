import fs from "fs";
import path from "path";

export function saveJSON<T>(data: T, filePath: string): void {
  // Create the directory path without the filename
  const dirPath = path.dirname(filePath);
  fs.mkdirSync(dirPath, { recursive: true });

  const jsonString = JSON.stringify(
    data,
    (key, value) => (typeof value === "bigint" ? value.toString() : value),
    2,
  );

  fs.writeFileSync(filePath, jsonString);
}
