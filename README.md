# Claude Account Switch

A tiny VS Code extension that switches the Claude Code account from the status bar.

Claude Code picks its account (config file + Keychain entry) from `CLAUDE_CONFIG_DIR`, not from
`~/.claude` itself, so this extension sets that variable instead of repointing symlinks:

- `claudeCode.environmentVariables` (user settings) — for the Claude Code panel
- `terminal.integrated.env.osx` (user settings) — for integrated terminals

then reloads the window. A profile with `configDir: null` removes the variable, i.e. Claude Code's
default `~/.claude` + `~/.claude.json`.

## Use

Click **Claude: <profile>** in the status bar (or run **Claude: Switch Account**); the picker opens at
the top of the window. Logs go to Output → *Claude Account Switch*.

Profiles are configured in `claudeAccountSwitch.profiles` (defaults: Work → default, Personal →
`~/.claude-personal`). Log in to a new profile once after switching to it.

## Build and install

```bash
npx @vscode/vsce@3.2.1 package --allow-missing-repository --skip-license -o claude-account-switch.vsix
code --install-extension claude-account-switch.vsix --force
```
