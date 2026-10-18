describe("Timecop theme integration and layout", () => {
  let view;

  beforeEach(async () => {
    const main = (await lumine.packages.activatePackage("timecop")).mainModule;
    view = main.createTimecopView({ uri: "lumine://timecop" });
    jasmine.attachToDOM(view.element);
    view.element.style.cssText = `
      width: 720px;
      --text-color: rgb(210, 220, 230);
      --base-background-color: rgb(15, 20, 25);
      --inset-panel-background-color: rgb(25, 30, 35);
      --panel-heading-background-color: rgb(20, 25, 30);
      --syntax-background-color: rgb(250, 250, 250);
      --syntax-text-color: rgb(25, 25, 25);
    `;
  });

  afterEach(async () => {
    await view.destroy();
    await lumine.packages.deactivatePackage("timecop");
  });

  it("uses UI surfaces even when the syntax palette has the opposite brightness", () => {
    expect(getComputedStyle(view.element).color).toBe("rgb(210, 220, 230)");
    expect(getComputedStyle(view.element).backgroundColor).toBe("rgb(15, 20, 25)");
    expect(getComputedStyle(view.element.querySelector(".inset-panel")).backgroundColor).toBe(
      "rgb(25, 30, 35)",
    );
    expect(getComputedStyle(view.element.querySelector(".panel-heading")).backgroundColor).toBe(
      "rgb(20, 25, 30)",
    );
    expect(getComputedStyle(view.refs.packageLoadingPanel.refs.summary).color).toBe(
      "rgb(210, 220, 230)",
    );
  });

  for (const width of [320, 720, 1400]) {
    it(`keeps long package names and timings inside a ${width}px pane`, () => {
      view.element.style.width = `${width}px`;
      view.refs.packageLoadingPanel.addPackage(
        {
          name: "a-package-with-an-extremely-long-unbroken-identifier-for-layout",
          loadTime: 12345,
        },
        "loadTime",
      );
      for (const element of view.element.querySelectorAll(".panels,.inset-panel,.list-item")) {
        expect(element.scrollWidth)
          .withContext(`${element.className} at ${width}px`)
          .toBeLessThanOrEqual(element.clientWidth + 1);
      }
      const cards = [...view.element.querySelectorAll(".panels:last-child > .package-panel")];
      const columns = new Set(cards.map((card) => card.getBoundingClientRect().left));
      if (width === 320) expect(columns.size).toBe(1);
      if (width === 720) expect(columns.size).toBe(2);
      if (width === 1400) expect(columns.size).toBe(4);
    });
  }
});
