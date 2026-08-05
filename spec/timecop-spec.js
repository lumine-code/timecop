const path = require("path");
const CompileCache = require(
  path.join(atom.getLoadSettings().resourcePath, "src", "compile-cache"),
);
const CSON = require(
  path.join(atom.getLoadSettings().resourcePath, "node_modules", "@lumine-code", "season"),
);

const { it, fit, ffit, beforeEach, afterEach } = require("./async-spec-helpers"); // eslint-disable-line no-unused-vars

describe("Timecop", () => {
  beforeEach(async () => {
    spyOn(CompileCache, "getCacheStats").andReturn({
      ".js": { hits: 3, misses: 4 },
      ".ts": { hits: 5, misses: 6 },
      ".coffee": { hits: 7, misses: 8 },
    });

    spyOn(CSON, "getCacheMisses").andReturn(10);

    // The Less cache is created lazily on the first Less compile, which never
    // happens now that the bundled themes ship plain CSS.
    atom.themes.lessCache ??= {};
    atom.themes.lessCache.cache ??= { stats: {} };
    atom.themes.lessCache.cache.stats.misses = 12;

    await atom.packages.activatePackage("timecop");
  });

  describe("the Timecop view", () => {
    let timecopView = null;

    beforeEach(async () => {
      const packages = [
        new FakePackage({
          name: "slow-activating-package-1",
          activateTime: 500,
          loadTime: 5,
        }),
        new FakePackage({
          name: "slow-activating-package-2",
          activateTime: 500,
          loadTime: 5,
        }),
        new FakePackage({
          name: "slow-loading-package",
          activateTime: 5,
          loadTime: 500,
        }),
        new FakePackage({
          name: "fast-package",
          activateTime: 2,
          loadTime: 3,
        }),
      ];

      spyOn(atom.packages, "getLoadedPackages").andReturn(packages);
      spyOn(atom.packages, "getActivePackages").andReturn(packages);
      spyOn(atom.packages, "hasLoadedInitialPackages").andReturn(true);
      spyOn(atom.packages, "hasActivatedInitialPackages").andReturn(true);

      timecopView = await atom.workspace.open("lumine://timecop");
    });

    afterEach(() => jasmine.unspy(atom.packages, "getLoadedPackages"));

    it("shows the packages that loaded slowly", () => {
      const loadingPanel = timecopView.refs.packageLoadingPanel;
      expect(loadingPanel.element.textContent).toMatch(/1 package took longer than 5ms to load/);
      expect(loadingPanel.element.textContent).toMatch(/slow-loading-package/);

      expect(loadingPanel.element.textContent).not.toMatch(/slow-activating-package/);
      expect(loadingPanel.element.textContent).not.toMatch(/fast-package/);
    });

    it("shows the packages that activated slowly", () => {
      const activationPanel = timecopView.refs.packageActivationPanel;
      expect(activationPanel.element.textContent).toMatch(
        /2 packages took longer than 5ms to activate/,
      );
      expect(activationPanel.element.textContent).toMatch(/slow-activating-package-1/);
      expect(activationPanel.element.textContent).toMatch(/slow-activating-package-2/);

      expect(activationPanel.element.textContent).not.toMatch(/slow-loading-package/);
      expect(activationPanel.element.textContent).not.toMatch(/fast-package/);
    });

    it("shows how many files were transpiled from each language", () => {
      const cachePanel = timecopView.refs.cacheLoadingPanel;

      expect(cachePanel.element.textContent).toMatch(/CoffeeScript files compiled\s*8/);
      expect(cachePanel.element.textContent).toMatch(/Babel files compiled\s*4/);
      expect(cachePanel.element.textContent).toMatch(/Typescript files compiled\s*6/);
      expect(cachePanel.element.textContent).toMatch(/CSON files compiled\s*10/);
      expect(cachePanel.element.textContent).toMatch(/Less files compiled\s*12/);
    });
  });

  describe("the window panel", () => {
    let deserializeTimings = null;

    const openWindowPanel = async () =>
      (await atom.workspace.open("lumine://timecop")).refs.windowLoadingPanel;

    beforeEach(() => {
      deserializeTimings = atom.deserializeTimings;
      atom.deserializeTimings = {};
      atom.loadTime = null;
    });

    afterEach(() => {
      atom.deserializeTimings = deserializeTimings;
      atom.loadTime = null;
    });

    it("waits for the window to finish loading before showing its timings", async () => {
      // A view restored into a window is built while that window is still
      // loading, so the load time does not exist yet.
      const windowPanel = await openWindowPanel();
      expect(windowPanel.refs.windowLoadTime.textContent).toMatch(/Loading/);

      atom.setWindowLoadTime(1234);
      expect(windowPanel.refs.windowLoadTime.textContent).toBe("1234ms");
      expect(windowPanel.refs.windowLoadTime.classList.contains("highlight-error")).toBe(true);
    });

    it("shows the timings straight away once the window has loaded", async () => {
      atom.setWindowLoadTime(500);
      const windowPanel = await openWindowPanel();
      expect(windowPanel.refs.windowLoadTime.textContent).toBe("500ms");
      expect(windowPanel.refs.windowLoadTime.classList.contains("highlight-info")).toBe(true);
    });

    it("hides the deserialize timings for a project that was not previously opened", async () => {
      const windowPanel = await openWindowPanel();
      atom.setWindowLoadTime(500);
      expect(windowPanel.refs.deserializeTimings.style.display).toBe("none");
    });

    it("shows the deserialize timings for a project that was previously opened", async () => {
      atom.deserializeTimings = { project: 20, workspace: 30 };

      const windowPanel = await openWindowPanel();
      atom.setWindowLoadTime(500);
      expect(windowPanel.refs.deserializeTimings.style.display).toBe("");
      expect(windowPanel.refs.projectLoadTime.textContent).toBe("20ms");
      expect(windowPanel.refs.workspaceLoadTime.textContent).toBe("30ms");
    });
  });
});

class FakePackage {
  constructor({ name, activateTime, loadTime }) {
    this.name = name;
    this.activateTime = activateTime;
    this.loadTime = loadTime;
  }
  getType() {
    return "package";
  }
  isTheme() {
    return false;
  }
}
