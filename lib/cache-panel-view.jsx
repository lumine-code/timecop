/** @jsx etch.dom */
const path = require("path");
const etch = require("@lumine-code/etch");

module.exports = class CachePanelView {
  constructor() {
    etch.initialize(this);
  }

  update() {}

  destroy() {
    return etch.destroy(this);
  }

  render() {
    return (
      <div className="tool-panel padded package-panel">
        <div className="inset-panel">
          <div className="panel-heading">Compile Cache</div>
          <div className="panel-body padded">
            <div className="timing">
              <span className="inline-block">Babel files compiled</span>
              <span className="inline-block" ref="babelCompileCount">
                Loading…
              </span>
            </div>

            <div className="timing">
              <span className="inline-block">Typescript files compiled</span>
              <span className="inline-block" ref="typescriptCompileCount">
                Loading…
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  populate() {
    const compileCacheStats = this.getCompileCacheStats();
    if (compileCacheStats) {
      this.refs.babelCompileCount.classList.add("highlight-info");
      this.refs.babelCompileCount.textContent = compileCacheStats[".js"].misses;
      this.refs.typescriptCompileCount.classList.add("highlight-info");
      this.refs.typescriptCompileCount.textContent = compileCacheStats[".ts"].misses;
    }
  }

  getCompileCacheStats() {
    try {
      return require(
        path.join(lumine.app.getResourcePath(), "src", "compile-cache"),
      ).getCacheStats();
    } catch {
      return null;
    }
  }
};
