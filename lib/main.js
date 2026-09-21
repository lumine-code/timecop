const { CompositeDisposable } = require("lumine");

let TimecopView = null;
let etchConfigured = false;
const ViewURI = "lumine://timecop";

function ensureEtch() {
  if (etchConfigured) return;
  require("@lumine-code/etch").setScheduler(lumine.views);
  etchConfigured = true;
}

module.exports = {
  activate() {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(
      lumine.workspace.addOpener((filePath) => {
        if (filePath === ViewURI) return this.createTimecopView({ uri: ViewURI });
      }),
    );

    this.subscriptions.add(
      lumine.commands.add("lumine-workspace", "timecop:view", () => lumine.workspace.open(ViewURI)),
    );
  },

  async deactivate() {
    this.subscriptions?.dispose();
    this.subscriptions = null;
    const closures = [];
    for (const item of lumine.workspace.getPaneItems()) {
      if (item?.getURI?.() !== ViewURI) continue;
      const pane = lumine.workspace.paneForItem(item);
      if (pane) closures.push(pane.destroyItem(item, true));
      else item.destroy?.();
    }
    await Promise.all(closures);
    etchConfigured = false;
  },

  createTimecopView(state) {
    ensureEtch();
    if (TimecopView == null) TimecopView = require("./timecop-view");
    return new TimecopView(state);
  },
};
