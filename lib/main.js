const { CompositeDisposable } = require("lumine");

let TimecopView = null;
const ViewURI = "lumine://timecop";

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

  deactivate() {
    this.subscriptions.dispose();
  },

  createTimecopView(state) {
    if (TimecopView == null) TimecopView = require("./timecop-view");
    return new TimecopView(state);
  },
};
