describe("Timecop pending window timing lifetime", () => {
  let previousLoadTime, item, panel, oldPopulate;
  beforeEach(async () => {
    jasmine.useRealClock();
    for (const method of ["openExternal", "openPath", "showItemInFolder", "openApplication"])
      spyOn(lumine.shell, method).and.resolveTo();
    spyOn(lumine.application, "openWindow").and.resolveTo();
    previousLoadTime = lumine.loadTime;
    lumine.loadTime = null;
    jasmine.attachToDOM(lumine.workspace.getElement());
    await lumine.packages.activatePackage("timecop");
    item = await lumine.workspace.open("lumine://timecop");
    panel = item.refs.windowLoadingPanel;
    expect(panel.refs.windowLoadTime.textContent).toContain("Loading");
  });
  afterEach(async () => {
    await lumine.packages.deactivatePackage("timecop");
    lumine.loadTime = previousLoadTime;
    item = panel = oldPopulate = null;
  });
  it("does not deliver startup timing into a pane item already closed", async () => {
    oldPopulate = spyOn(panel, "populate");
    await lumine.workspace.paneForItem(item).destroyItem(item, true);
    lumine.setWindowLoadTime(1500);
    await lumine.window.whenLoaded();
    expect(oldPopulate).not.toHaveBeenCalled();
  });
  it("does not populate a retired child when the package is reactivated before startup completes", async () => {
    oldPopulate = spyOn(panel, "populate");
    await lumine.packages.deactivatePackage("timecop");
    await lumine.packages.activatePackage("timecop");
    item = await lumine.workspace.open("lumine://timecop");
    panel = item.refs.windowLoadingPanel;
    lumine.setWindowLoadTime(1500);
    await lumine.window.whenLoaded();
    expect(oldPopulate).not.toHaveBeenCalled();
    expect(panel.refs.windowLoadTime.textContent).toBe("1500ms");
  });
  it("keeps ordinary live startup timing and its real rendered highlight", async () => {
    lumine.setWindowLoadTime(1500);
    await lumine.window.whenLoaded();
    expect(panel.refs.windowLoadTime.textContent).toBe("1500ms");
    expect(panel.refs.windowLoadTime.classList.contains("highlight-error")).toBe(true);
  });
});
