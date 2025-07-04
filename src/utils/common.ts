import * as vscode from 'vscode';

export function isConfigEnabled(configName: string) {
  return vscode.workspace.getConfiguration(configName).get<boolean>('enable', true);
}
