import fs from "fs-extra";

async function mergeDist() {
  await fs.emptyDir("dist");
  await fs.copy("dist_main", "dist");
  await fs.copy("dist_zx", "dist");
  await fs.copy("dist_m", "dist");
  console.log("Merge completed!");
  await fs.writeJson("dist/build_version", {
    branch: process.env.branchName || "NOT_CI",
    commit: process.env.GIT_COMMIT || "NOT_CI",
    build_number: process.env.BUILD_NUMBER || "NOT_CI",
    build_time: +new Date()
  });
}

try {
  await mergeDist();
} catch (e) {
  console.error(e);
  process.exit(1);
}
