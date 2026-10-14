// Switches the Claude Code account by setting CLAUDE_CONFIG_DIR — the only thing that selects the
// account (config file + Keychain entry) — for the Claude Code panel and integrated terminals,
// then reloads the window so the panel restarts its claude process under it.
const vscode = require('vscode');
const os = require('os');
const path = require('path');

const VAR = 'CLAUDE_CONFIG_DIR';
const expand = p => (p ? (p.startsWith('~') ? path.join(os.homedir(), p.slice(1)) : p) : null);

const profiles = () => vscode.workspace.getConfiguration('claudeAccountSwitch').get('profiles') || [];

function currentDir() {
  const env = vscode.workspace.getConfiguration('claudeCode').inspect('environmentVariables').globalValue || [];
  const entry = env.find(v => v.name === VAR);
  return entry ? expand(entry.value) : null;
}

const activeProfile = () => profiles().find(p => expand(p.configDir) === currentDir());

async function switchTo(profile) {
  const dir = expand(profile.configDir);

  const claude = vscode.workspace.getConfiguration('claudeCode');
  const env = (claude.inspect('environmentVariables').globalValue || []).filter(v => v.name !== VAR);
  if (dir) env.push({ name: VAR, value: dir });
  await claude.update('environmentVariables', env, vscode.ConfigurationTarget.Global);

  const terminal = vscode.workspace.getConfiguration('terminal.integrated.env');
  const osx = { ...(terminal.inspect('osx').globalValue || {}) };
  if (dir) osx[VAR] = dir;
  else delete osx[VAR];
  await terminal.update('osx', osx, vscode.ConfigurationTarget.Global);

  await vscode.commands.executeCommand('workbench.action.reloadWindow');
}

function activate(context) {
  const log = vscode.window.createOutputChannel('Claude Account Switch');
  log.appendLine(`activated; profiles=${JSON.stringify(profiles())} current=${currentDir()}`);
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  item.command = 'claudeAccountSwitch.switch';
  const render = () => {
    const active = activeProfile();
    item.text = `$(account) Claude: ${active ? active.name : 'Unknown'}`;
    item.tooltip = `${VAR}=${currentDir() ?? '(default ~/.claude)'}\nClick to switch account`;
    item.backgroundColor = active ? undefined : new vscode.ThemeColor('statusBarItem.warningBackground');
  };
  render();
  item.show();

  context.subscriptions.push(
    item,
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('claudeCode.environmentVariables') || e.affectsConfiguration('claudeAccountSwitch')) render();
    }),
    log,
    vscode.commands.registerCommand('claudeAccountSwitch.switch', async () => {
      log.appendLine('switch clicked');
      try {
      const active = activeProfile();
      const pick = await vscode.window.showQuickPick(
        profiles().map(p => ({
          label: p.name,
          description: p.configDir ?? '~/.claude (default)',
          detail: p === active ? 'active' : undefined,
          profile: p,
        })),
        { placeHolder: 'Switch Claude Code account (reloads the window)' }
      );
      log.appendLine(`picked: ${pick ? pick.label : '(dismissed)'}`);
      if (pick && pick.profile !== active) await switchTo(pick.profile);
      } catch (err) {
        log.appendLine(`error: ${err && err.stack}`);
        vscode.window.showErrorMessage(`Claude account switch failed: ${err.message}`);
      }
    })
  );
}

module.exports = { activate, deactivate() {} };
