const vscode = require("vscode");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const CATEGORY_ORDER = ["clients", "personal", "school", "sandbox", "archive"];
const PROJECT_MARKERS = [".git", "package.json", "composer.json", "Cargo.toml", "pyproject.toml", "go.mod"];
const SKIP = new Set(["node_modules", ".DS_Store"]);

function rootDir() {
  const value = vscode.workspace.getConfiguration("devProjects").get("root", "~/Developer");
  return value.startsWith("~") ? path.join(os.homedir(), value.slice(1)) : value;
}

function subdirs(dir) {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith(".") && !SKIP.has(d.name) && !d.name.endsWith(".worktrees"))
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  } catch {
    return [];
  }
}

function isProject(dir) {
  return PROJECT_MARKERS.some((m) => fs.existsSync(path.join(dir, m)));
}

function gitBranch(dir) {
  try {
    const head = fs.readFileSync(path.join(dir, ".git", "HEAD"), "utf8").trim();
    return head.startsWith("ref: refs/heads/") ? head.slice(16) : head.slice(0, 7);
  } catch {
    return undefined;
  }
}

// root/<category>/<project> or root/<category>/<group>/<project>. A folder without a project
// marker counts as a group only if at least one of its children is a project.
function scan() {
  const root = rootDir();
  const categories = subdirs(root).sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a), ib = CATEGORY_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
  return categories.map((category) => {
    const dir = path.join(root, category);
    const children = subdirs(dir).map((name) => {
      const full = path.join(dir, name);
      if (!isProject(full)) {
        const inner = subdirs(full);
        if (inner.some((n) => isProject(path.join(full, n)))) {
          return { kind: "group", name, path: full, children: inner.map((n) => project(path.join(full, n), `${category}/${name}`)) };
        }
      }
      return project(full, category);
    });
    return { kind: "category", name: category, path: dir, children };
  });
}

function project(full, parent) {
  return { kind: "project", name: path.basename(full), path: full, parent, branch: gitBranch(full) };
}

function allProjects(nodes) {
  return nodes.flatMap((n) => (n.kind === "project" ? [n] : allProjects(n.children)));
}

function currentPaths() {
  return new Set((vscode.workspace.workspaceFolders || []).map((f) => f.uri.fsPath));
}

class ProjectTree {
  constructor() {
    this.changed = new vscode.EventEmitter();
    this.onDidChangeTreeData = this.changed.event;
    this.nodes = [];
  }

  refresh() {
    this.nodes = scan();
    this.changed.fire();
  }

  getChildren(node) {
    if (!node) {
      if (!this.nodes.length) this.nodes = scan();
      return this.nodes;
    }
    return node.children || [];
  }

  getTreeItem(node) {
    const collapsed = vscode.workspace.getConfiguration("devProjects").get("collapsed", ["archive"]);
    if (node.kind !== "project") {
      const item = new vscode.TreeItem(
        node.kind === "category" ? node.name.charAt(0).toUpperCase() + node.name.slice(1) : node.name,
        collapsed.includes(node.name) || node.kind === "group"
          ? vscode.TreeItemCollapsibleState.Collapsed
          : vscode.TreeItemCollapsibleState.Expanded,
      );
      item.iconPath = new vscode.ThemeIcon(node.kind === "category" ? "folder-library" : "folder");
      item.description = String(allProjects(node.children).length);
      item.contextValue = node.kind;
      return item;
    }
    const open = currentPaths().has(node.path);
    const item = new vscode.TreeItem(node.name, vscode.TreeItemCollapsibleState.None);
    item.id = node.path;
    item.description = [node.branch, open ? "open" : ""].filter(Boolean).join(" · ");
    item.tooltip = node.path;
    item.iconPath = new vscode.ThemeIcon(
      node.branch ? "repo" : "folder",
      open ? new vscode.ThemeColor("charts.green") : undefined,
    );
    item.contextValue = open ? "project-open" : "project";
    item.command = { command: "devProjects.open", title: "Open", arguments: [node] };
    return item;
  }
}

function openFolder(node, forceNewWindow) {
  if (!forceNewWindow && currentPaths().has(node.path)) return;
  return vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(node.path), { forceNewWindow });
}

function activate(context) {
  const tree = new ProjectTree();
  const newWindowButton = { iconPath: new vscode.ThemeIcon("empty-window"), tooltip: "Open in New Window" };

  // The current project's name, bottom left; click it to switch.
  const status = vscode.window.createStatusBarItem("devProjects.status", vscode.StatusBarAlignment.Left, 1000);
  status.name = "Projects";
  status.text = `$(folder-library) ${vscode.workspace.name || "Projects"}`;
  status.tooltip = "Switch project (⌥⌘P)";
  status.command = "devProjects.pick";
  status.show();

  context.subscriptions.push(
    status,
    vscode.window.registerTreeDataProvider("devProjects.list", tree),
    vscode.commands.registerCommand("devProjects.refresh", () => tree.refresh()),
    vscode.commands.registerCommand("devProjects.open", (node) => openFolder(node, false)),
    vscode.commands.registerCommand("devProjects.openNewWindow", (node) => openFolder(node, true)),
    vscode.commands.registerCommand("devProjects.reveal", (node) =>
      vscode.commands.executeCommand("revealFileInOS", vscode.Uri.file(node.path)),
    ),
    vscode.commands.registerCommand("devProjects.copyPath", (node) => vscode.env.clipboard.writeText(node.path)),
    vscode.commands.registerCommand("devProjects.pick", () => {
      const open = currentPaths();
      const pick = vscode.window.createQuickPick();
      pick.placeholder = "Open project (Enter: this window, button: new window)";
      pick.matchOnDescription = true;
      pick.items = allProjects(scan()).map((p) => ({
        label: `$(${p.branch ? "repo" : "folder"}) ${p.name}`,
        description: [p.parent, p.branch, open.has(p.path) ? "open" : ""].filter(Boolean).join(" · "),
        buttons: [newWindowButton],
        project: p,
      }));
      pick.onDidAccept(() => {
        const [item] = pick.selectedItems;
        pick.hide();
        if (item) openFolder(item.project, false);
      });
      pick.onDidTriggerItemButton((e) => {
        pick.hide();
        openFolder(e.item.project, true);
      });
      pick.onDidHide(() => pick.dispose());
      pick.show();
    }),
    // New or moved projects show up when you come back to the window.
    vscode.window.onDidChangeWindowState((s) => s.focused && tree.refresh()),
    vscode.workspace.onDidChangeConfiguration((e) => e.affectsConfiguration("devProjects") && tree.refresh()),
  );
}

module.exports = { activate };
