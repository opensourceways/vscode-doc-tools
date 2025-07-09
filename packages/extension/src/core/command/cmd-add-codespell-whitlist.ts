import * as vscode from 'vscode';

/**
 * 加入单词白名单
 * @param {string} word 错误单词
 * @param {vscode.DiagnosticCollection} diagnosticsCollection Diagnostic Collection
 * @returns 
 */
export async function addCodespellWhitelist(word: string, diagnosticsCollection: vscode.DiagnosticCollection) {
  if (!word) {
    return;
  }

  // 加入白名单配置
  const config = vscode.workspace.getConfiguration('docTools.check.codespell');
  const whiteList = config.get<string[]>('whiteList', []);
  whiteList.push(word);
  await config.update('whiteList', whiteList, vscode.ConfigurationTarget.Global);

  // 更新单词标记
  diagnosticsCollection.forEach((uri, diagnostics) => {
    const filterDiagnostics = diagnostics.filter((item) => {
      if (item.source !== 'codespell-check') {
        return true;
      }

      return item.code !== word;
    });

    if (filterDiagnostics.length !== diagnostics.length) {
      diagnosticsCollection.set(uri, filterDiagnostics);
    }
  });
}
