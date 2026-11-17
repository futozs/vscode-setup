const vscode = require("vscode");
const path = require("node:path");

// A "current-file" launch entry picks another launch.json entry by the active file's extension
// and hands it over. VS Code re-resolves a configuration whose type changed, so the chosen
// entry runs with its own debugger, preLaunchTask and options.
function resolveDebugConfiguration(folder) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("Nyiss meg egy fájlt, amit futtatni szeretnél.");
    return undefined;
  }
  const ext = path.extname(editor.document.fileName).toLowerCase();
  const byExtension = vscode.workspace.getConfiguration("runCurrentFile", folder).get("byExtension", {});
  const name = byExtension[ext];
  if (!name) {
    vscode.window.showErrorMessage(`A(z) ${ext || "kiterjesztés nélküli"} fájlokhoz nincs futtatás beállítva (runCurrentFile.byExtension).`);
    return undefined;
  }
  const configurations = vscode.workspace.getConfiguration("launch", folder).get("configurations", []);
  const target = configurations.find((c) => c.name === name);
  if (!target) {
    vscode.window.showErrorMessage(`A launch.json-ban nincs „${name}” nevű konfiguráció.`);
    return undefined;
  }
  return { ...target };
}

function activate(context) {
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider("current-file", { resolveDebugConfiguration }),
  );
}

module.exports = { activate };
