const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

function removeFixture(directory) {
  const resolved = fs.realpathSync.native(directory);
  const relative = path.relative(fs.realpathSync.native(os.tmpdir()), resolved);
  if (
    resolved !== directory ||
    path.isAbsolute(relative) ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`)
  ) {
    throw new Error("Unsafe Timecop fixture cleanup");
  }
  fs.rmSync(resolved, { recursive: true, force: true });
}

describe("Timecop compile-cache extension counts", () => {
  it("counts actual JSX and TSX cache misses in their respective displayed totals", async () => {
    const directory = fs.realpathSync.native(
      fs.mkdtempSync(path.join(os.tmpdir(), "timecop-compile-")),
    );
    const compiler = require(path.join(lumine.application.getResourcePath(), "src/compile-cache"));
    const previousCache = compiler.getCacheDirectory();
    const main = (await lumine.packages.activatePackage("timecop")).mainModule;
    const view = main.createTimecopView({ uri: "lumine://timecop" });
    try {
      compiler.resetCacheStats();
      for (const extension of ["jsx", "tsx"]) {
        const file = path.join(directory, `${randomUUID()}.${extension}`);
        fs.writeFileSync(file, "const tree = <div />;");
        compiler.addPathToCache(file, path.join(directory, "cache-home"));
      }
      const stats = compiler.getCacheStats();
      expect(stats[".jsx"].misses).toBe(1);
      expect(stats[".tsx"].misses).toBe(1);
      view.refs.cacheLoadingPanel.populate();
      expect(view.refs.cacheLoadingPanel.refs.babelCompileCount.textContent).toBe("1");
      expect(view.refs.cacheLoadingPanel.refs.typescriptCompileCount.textContent).toBe("1");
    } finally {
      compiler.setCacheDirectory(previousCache);
      await view.destroy();
      await lumine.packages.deactivatePackage("timecop");
      removeFixture(directory);
    }
  });
});
