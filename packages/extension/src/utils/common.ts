import * as vscode from 'vscode';

/**
 * 是否开启配置
 * @param {string} configName 配置名
 * @returns {boolean} 开启返回 true，关闭返回 false
 */
export function isConfigEnabled(configName: string) {
  return vscode.workspace.getConfiguration(configName).get<boolean>('enable', true);
}
