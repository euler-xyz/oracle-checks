import fs from "fs";
import path from "path";

export function cleanDataDir(): void {
  const dataDir = "./data";
  if (fs.existsSync(dataDir)) {
    // Delete all contents except .gitkeep
    const files = fs.readdirSync(dataDir);
    for (const file of files) {
      const filePath = path.join(dataDir, file);
      if (file !== ".gitkeep") {
        if (fs.lstatSync(filePath).isDirectory()) {
          fs.rmSync(filePath, { recursive: true });
        } else {
          fs.unlinkSync(filePath);
        }
      }
    }
    console.log(`Cleaned data directory: ${dataDir}`);
  }
}
