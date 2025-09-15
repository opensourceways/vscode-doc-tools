import * as vscode from 'vscode';
import { LINK_VALIDITY_CHECK, RESOURCE_EXISTENCE_CHECK } from 'checkers';

/**
 * 加入链接白名单
 * @param {string} url 链接
 * @param {vscode.DiagnosticCollection} diagnosticsCollection Diagnostic Collection
 */
export async function addUrlWhitelist(url: string, diagnosticsCollection: vscode.DiagnosticCollection) {
  if (!url) {
    return;
  }

  // 加入白名单配置
  const config = vscode.workspace.getConfiguration('docTools.check.url');
  const whiteList = config.get<string[]>('whiteList', []);
  whiteList.push(url);
  await config.update('whiteList', whiteList, vscode.ConfigurationTarget.Global);

  // 更新标记
  diagnosticsCollection.forEach((uri, diagnostics) => {
    const filterDiagnostics = diagnostics.filter((item) => {
      if (item.source !== LINK_VALIDITY_CHECK && item.source !== RESOURCE_EXISTENCE_CHECK) {
        return true;
      }

      return item.code !== url;
    });

    if (filterDiagnostics.length !== diagnostics.length) {
      diagnosticsCollection.set(uri, filterDiagnostics);
    }
  });
}
