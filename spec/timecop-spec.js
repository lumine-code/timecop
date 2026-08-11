const path = require("path");
const CompileCache = require(path.join(lumine.application.getResourcePath(), "src", "compile-cache"));

describe("Timecop", () => {
  beforeEach(async () => {
    spyOn(CompileCache, "getCacheStats").and.returnValue({
      ".js": { hits: 3, misses: 4 },
      ".ts": { hits: 5, misses: 6 },
    });

    await lumine.packages.activatePackage("timecop");
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

      spyOn(lumine.packages, "getLoadedPackages").and.returnValue(packages);
      spyOn(lumine.packages, "getActivePackages").and.returnValue(packages);
      spyOn(lumine.packages, "hasLoadedInitialPackages").and.returnValue(true);
      spyOn(lumine.packages, "hasActivatedInitialPackages").and.returnValue(true);

      timecopView = await lumine.workspace.open("lumine://timecop");
    });

    afterEach(() => jasmine.unspy(lumine.packages, "getLoadedPackages"));

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

      expect(cachePanel.element.textContent).toMatch(/Babel files compiled\s*4/);
      expect(cachePanel.element.textContent).toMatch(/Typescript files compiled\s*6/);
    });
  });

  describe("the window panel", () => {
    let deserializeTimings = null;

    const openWindowPanel = async () =>
      (await lumine.workspace.open("lumine://timecop")).refs.windowLoadingPanel;

    beforeEach(() => {
      deserializeTimings = lumine.deserializeTimings;
      lumine.deserializeTimings = {};
      lumine.loadTime = null;
    });

    afterEach(() => {
      lumine.deserializeTimings = deserializeTimings;
      lumine.loadTime = null;
    });

    it("waits for the window to finish loading before showing its timings", async () => {
      // A view restored into a window is built while that window is still
      // loading, so the load time does not exist yet.
      const windowPanel = await openWindowPanel();
      expect(windowPanel.refs.windowLoadTime.textContent).toMatch(/Loading/);

      lumine.setWindowLoadTime(1234);
      await lumine.window.whenLoaded();
      expect(windowPanel.refs.windowLoadTime.textContent).toBe("1234ms");
      expect(windowPanel.refs.windowLoadTime.classList.contains("highlight-error")).toBe(true);
    });

    it("shows the timings straight away once the window has loaded", async () => {
      lumine.setWindowLoadTime(500);
      const windowPanel = await openWindowPanel();
      expect(windowPanel.refs.windowLoadTime.textContent).toBe("500ms");
      expect(windowPanel.refs.windowLoadTime.classList.contains("highlight-info")).toBe(true);
    });

    it("hides the deserialize timings for a project that was not previously opened", async () => {
      const windowPanel = await openWindowPanel();
      lumine.setWindowLoadTime(500);
      await lumine.window.whenLoaded();
      expect(windowPanel.refs.deserializeTimings.style.display).toBe("none");
    });

    it("shows the deserialize timings for a project that was previously opened", async () => {
      lumine.deserializeTimings = { project: 20, workspace: 30 };

      const windowPanel = await openWindowPanel();
      lumine.setWindowLoadTime(500);
      await lumine.window.whenLoaded();
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
