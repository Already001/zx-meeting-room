import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function autoExportAssets(options = {}) {
  const {
    targetDir = "./src/assets",
    outputFile = "index.ts",
    exclude = ["faces"],
    customImport
  } = options;

  let assetsDir;
  let outputPath;

  return {
    name: "auto-export-assets",
    configResolved(config) {
      assetsDir = path.resolve(config.root, targetDir);
      outputPath = path.join(assetsDir, outputFile);
    },
    buildStart() {
      generateAssetExports();
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(assetsDir) && file !== outputPath) {
        const ext = path.extname(file).slice(1);
        if (["svg", "png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
          generateAssetExports();
          server.ws.send({ type: "full-reload" });
        }
      }
    }
  };

  function generateAssetExports() {
    if (!fs.existsSync(assetsDir)) {
      console.warn(`Assets directory not found: ${assetsDir}`);
      return;
    }
    const files = [];
    function scanDir(dir, basePath = "") {
      if (!fs.existsSync(dir)) return;
      const items = fs.readdirSync(dir);
      items.forEach((item) => {
        if (item === outputFile) return;
        const fullPath = path.join(dir, item);
        const relativePath = path.join(basePath, item);
        if (fs.statSync(fullPath).isDirectory() && !exclude.includes(item)) {
          scanDir(fullPath, relativePath);
        } else if (/\.(svg|png|jpg|jpeg|gif|webp)$/i.test(item)) {
          const fileName = path.basename(item, path.extname(item));
          const fileType = path.extname(item).slice(1);
          const relativeFilePath = `./${relativePath.replace(/\\/g, "/")}`;
          let importName;
          if (customImport) {
            const customResult = customImport(
              fileName,
              relativePath.replace(/\\/g, "/"),
              fileType
            );
            if (typeof customResult === "string") {
              const match = customResult.match(/import\s+(\w+)\s+from/);
              if (match) {
                files.push({
                  importName: match[1],
                  customImport: customResult
                });
                return;
              }
            }
          }
          if (fileType === "svg" && relativePath.startsWith("svg")) {
            importName = `iSvg${fileName.charAt(0).toUpperCase() + fileName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}`;
          } else {
            importName = `${fileType}${fileName.charAt(0).toUpperCase() + fileName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())}`;
          }
          files.push({ importName, path: relativeFilePath });
        }
      });
    }
    scanDir(assetsDir);
    if (files.length === 0) {
      console.warn("No asset files found");
      return;
    }
    // 显式排序：readdir 顺序依赖文件系统（macOS APFS 大小写敏感序 vs Linux 常为大小写不敏感），
    // 不排序会导致不同平台生成的 index.ts 顺序不一致、产生无意义 diff。
    files.sort((a, b) => {
      const pathA = a.path || a.importName;
      const pathB = b.path || b.importName;
      return pathA.localeCompare(pathB, "en", { sensitivity: "base" });
    });
    const imports = files
      .map(
        (file) =>
          file.customImport || `import ${file.importName} from "${file.path}";`
      )
      .join("\n");
    const exports = files.map((file) => `  ${file.importName}`).join(",\n");
    const content = `${imports}

export {
${exports}
}
`;
    try {
      fs.writeFileSync(outputPath, content);
      console.log("✅ Assets index.ts generated successfully!");
    } catch (error) {
      console.error("❌ Failed to write assets index.ts:", error);
    }
  }
}
