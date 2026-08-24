import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function autoApiExports() {
  const moduleDir = path.join(__dirname, "../server/module");
  const indexFile = path.join(__dirname, "../server/index.js");

  function scanModuleFiles() {
    if (!fs.existsSync(moduleDir)) {
      return [];
    }
    const files = fs.readdirSync(moduleDir);
    return files.filter((file) => /\.(js|ts)$/.test(file));
  }

  function generateIndexContent() {
    const moduleFiles = scanModuleFiles();

    const exports = moduleFiles
      .map((file) => `export * from "./module/${file}";`)
      .join("\n");

    return `${exports}

// 为了保持兼容性，也提供一个包含所有 API 的默认导出
const apiModules = import.meta.glob("./**/*.{js,ts}", { eager: true });
const api = {};
Object.entries(apiModules).forEach(([path, module]) => {
  if (!path.includes("index") && !path.includes("http")) {
    Object.assign(api, module);
  }
});
export default api;
`;
  }

  function writeIndexFile() {
    fs.writeFileSync(indexFile, generateIndexContent());
    console.log("🔄 API exports regenerated automatically!");
  }

  return {
    name: "auto-api-exports",
    buildStart() {
      writeIndexFile();
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(moduleDir) && file !== indexFile) {
        writeIndexFile();
        server.ws.send({ type: "full-reload" });
      }
    }
  };
}
