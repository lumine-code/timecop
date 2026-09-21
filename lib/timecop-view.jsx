/** @jsx etch.dom */
const _ = require("@lumine-code/underscore-plus");
const dedent = require("dedent");
const etch = require("@lumine-code/etch");
const { CompositeDisposable } = require("lumine");
const CachePanelView = require("./cache-panel-view");
const PackagePanelView = require("./package-panel-view");
const normalizeDuration = require("./timing");
const WindowPanelView = require("./window-panel-view");

module.exports = class TimecopView {
  constructor({ uri }) {
    this.uri = uri;
    this.disposables = new CompositeDisposable();
    etch.initialize(this);
    this.refs.cacheLoadingPanel.populate();
    if (lumine.packages.hasLoadedInitialPackages()) {
      this.populateLoadingViews();
    } else {
      this.disposables.add(
        lumine.packages.onDidLoadInitialPackages(() => this.populateLoadingViews()),
      );
    }

    if (lumine.packages.hasActivatedInitialPackages()) {
      this.populateActivationViews();
    } else {
      this.disposables.add(
        lumine.packages.onDidActivateInitialPackages(() => this.populateActivationViews()),
      );
    }
  }

  update() {}

  destroy() {
    this.disposables.dispose();
    return etch.destroy(this);
  }

  render() {
    return (
      <div className="timecop pane-item native-key-bindings" tabIndex="-1">
        <div className="timecop-panel">
          <div className="panels">
            <WindowPanelView ref="windowLoadingPanel" />
            <CachePanelView ref="cacheLoadingPanel" />
          </div>
          <div className="panels">
            <PackagePanelView ref="packageLoadingPanel" title="Package Loading" />
            <PackagePanelView ref="packageActivationPanel" title="Package Activation" />
            <PackagePanelView ref="themeLoadingPanel" title="Theme Loading" />
            <PackagePanelView ref="themeActivationPanel" title="Theme Activation" />
          </div>
        </div>
      </div>
    );
  }

  populateLoadingViews() {
    this.showLoadedPackages();
    this.showLoadedThemes();
  }

  populateActivationViews() {
    this.showActivePackages();
    this.showActiveThemes();
  }

  showLoadedPackages() {
    const { time, count, packages } = this.getSlowPackages(
      lumine.packages.getLoadedPackages().filter((pack) => pack.getType() !== "theme"),
      "loadTime",
    );
    this.refs.packageLoadingPanel.addPackages(packages, "loadTime");
    this.refs.packageLoadingPanel.refs.summary.textContent = dedent`
      Loaded ${count} packages in ${time}ms.
      ${_.pluralize(packages.length, "package")} took longer than 5ms to load.
    `;
  }

  showActivePackages() {
    const { time, count, packages } = this.getSlowPackages(
      lumine.packages.getActivePackages().filter((pack) => pack.getType() !== "theme"),
      "activateTime",
    );
    const batchTime = lumine.packages.initialPackagesActivationTime;
    const totalTime = batchTime == null ? time : normalizeDuration(batchTime);
    this.refs.packageActivationPanel.addPackages(packages, "activateTime");
    this.refs.packageActivationPanel.refs.summary.textContent = dedent`
      Activated ${count} packages in ${totalTime}ms.
      ${_.pluralize(packages.length, "package")} took longer than 5ms to activate.\
    `;
  }

  showLoadedThemes() {
    const { time, count, packages } = this.getSlowPackages(
      lumine.themes.getLoadedThemes(),
      "loadTime",
    );
    this.refs.themeLoadingPanel.addPackages(packages, "loadTime");
    this.refs.themeLoadingPanel.refs.summary.textContent = dedent`
      Loaded ${count} themes in ${time}ms.
      ${_.pluralize(packages.length, "theme")} took longer than 5ms to load.\
    `;
  }

  showActiveThemes() {
    const { time, count, packages } = this.getSlowPackages(
      lumine.themes.getActiveThemes(),
      "activateTime",
    );
    this.refs.themeActivationPanel.addPackages(packages, "activateTime");
    this.refs.themeActivationPanel.refs.summary.textContent = dedent`
      Activated ${count} themes in ${time}ms.
      ${_.pluralize(packages.length, "theme")} took longer than 5ms to activate.\
    `;
  }

  getSlowPackages(packages, timeKey) {
    let time = 0;
    let count = 0;
    const measuredPackages = packages.map((pack) => ({
      pack,
      duration: normalizeDuration(pack[timeKey]),
    }));
    const slowPackages = measuredPackages.filter(function ({ duration }) {
      time += duration;
      count++;
      return duration > 5;
    });
    slowPackages.sort((entry1, entry2) => entry2.duration - entry1.duration);
    return { time, count, packages: slowPackages.map(({ pack }) => pack) };
  }

  serialize() {
    return {
      deserializer: this.constructor.name,
      uri: this.getURI(),
    };
  }

  getURI() {
    return this.uri;
  }

  getTitle() {
    return "Timecop";
  }

  getIconName() {
    return "dashboard";
  }
};
