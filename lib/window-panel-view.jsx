/** @jsx etch.dom */
const { CompositeDisposable } = require("lumine");
const etch = require("@lumine-code/etch");

module.exports = class WindowPanelView {
  constructor() {
    etch.initialize(this);

    this.disposables = new CompositeDisposable();
    this.disposables.add(
      lumine.tooltips.add(this.refs.shellTiming, { title: "The time taken to launch the app" }),
    );
    this.disposables.add(
      lumine.tooltips.add(this.refs.windowTiming, { title: "The time taken to load this window" }),
    );
    this.disposables.add(
      lumine.tooltips.add(this.refs.projectTiming, {
        title: "The time taken to rebuild the previously opened buffers",
      }),
    );
    this.disposables.add(
      lumine.tooltips.add(this.refs.workspaceTiming, {
        title: "The time taken to rebuild the previously opened editors",
      }),
    );

    // A view restored into a window is built while that window is still
    // loading, so every one of these timings is waited for rather than read
    // now — the window load time is the last of them to be recorded.
    lumine.window.whenLoaded().then(() => this.populate());
  }

  update() {}

  destroy() {
    this.disposables.dispose();
    return etch.destroy(this);
  }

  render() {
    return (
      <div className="tool-panel padded package-panel">
        <div className="inset-panel">
          <div className="panel-heading">Startup Time</div>
          <div className="panel-body padded">
            <div className="timing" ref="shellTiming">
              <span className="inline-block">Shell load time</span>
              <span className="inline-block" ref="shellLoadTime">
                Loading…
              </span>
            </div>

            <div className="timing" ref="windowTiming">
              <span className="inline-block">Window load time</span>
              <span className="inline-block" ref="windowLoadTime">
                Loading…
              </span>
            </div>

            <div ref="deserializeTimings">
              <div className="timing" ref="projectTiming">
                <span className="inline-block">Project load time</span>
                <span className="inline-block" ref="projectLoadTime">
                  Loading…
                </span>
              </div>

              <div className="timing" ref="workspaceTiming">
                <span className="inline-block">Workspace load time</span>
                <span className="inline-block" ref="workspaceLoadTime">
                  Loading…
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  populate() {
    const time = lumine.window.getLoadTime();
    this.refs.windowLoadTime.classList.add(this.getHighlightClass(time));
    this.refs.windowLoadTime.textContent = `${time}ms`;

    const shellLoadTime = lumine.runtime.getShellLoadTime();
    if (shellLoadTime != null) {
      this.refs.shellLoadTime.classList.add(this.getHighlightClass(shellLoadTime));
      this.refs.shellLoadTime.textContent = `${shellLoadTime}ms`;
    } else {
      this.refs.shellTiming.style.display = "none";
    }

    if (lumine.deserializeTimings.project != null) {
      // Project and workspace timings only exist if the current project was previously opened
      this.refs.projectLoadTime.classList.add(
        this.getHighlightClass(lumine.deserializeTimings.project),
      );
      this.refs.projectLoadTime.textContent = `${lumine.deserializeTimings.project}ms`;
      this.refs.workspaceLoadTime.classList.add(
        this.getHighlightClass(lumine.deserializeTimings.workspace),
      );
      this.refs.workspaceLoadTime.textContent = `${lumine.deserializeTimings.workspace}ms`;
    } else {
      this.refs.deserializeTimings.style.display = "none";
    }
  }

  getHighlightClass(time) {
    if (time > 1000) {
      return "highlight-error";
    } else if (time > 800) {
      return "highlight-warning";
    } else {
      return "highlight-info";
    }
  }
};
