export default {
  targetDir: "./src/assets",
  outputFile: "index.ts",
  customImport: (fileName, file, fileType) => {
    const name =
      fileName.charAt(0).toUpperCase() +
      fileName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    if (fileType === "svg" && file.startsWith("svg")) {
      return `import iSvg${name} from "./${file}";`;
    } else {
      return `import ${fileType}${name} from "./${file}";`;
    }
  }
};
