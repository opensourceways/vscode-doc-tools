import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { lint } from 'markdownlint/async';

export function activate(context: vscode.ExtensionContext) {
  // 用于存储错误信息
  const diagnosticsCollection = vscode.languages.createDiagnosticCollection('markdownlint');

  // 首次激活后检查
  if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.languageId === 'markdown') {
    lintMarkdown(vscode.window.activeTextEditor.document, diagnosticsCollection);
  }

  // 监听文件打开
  const onDidOpenTextDocumentListener = vscode.workspace.onDidOpenTextDocument((document) => {
    if (document.languageId === 'markdown') {
      lintMarkdown(document, diagnosticsCollection);
    }
  });

  context.subscriptions.push(onDidOpenTextDocumentListener);

  // 监听文件保存
  const onDidSaveTextDocumentListener = vscode.workspace.onDidSaveTextDocument((document) => {
    if (document.languageId === 'markdown') {
      lintMarkdown(document, diagnosticsCollection);
    }
  });

  context.subscriptions.push(onDidSaveTextDocumentListener);

  // 注册命令
  const lintCommand = vscode.commands.registerCommand('markdownlint.run', () => {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.languageId === 'markdown') {
      lintMarkdown(editor.document, diagnosticsCollection);
    } else {
      vscode.window.showInformationMessage('请在Markdown文件中运行Markdownlint');
    }
  });

  context.subscriptions.push(lintCommand);
}

const lintMarkdown = (document: vscode.TextDocument, diagnosticsCollection: vscode.DiagnosticCollection) => {
  const config = vscode.workspace.getConfiguration('markdownlint');
  const enableLint = config.get<boolean>('enable', true);

  if (!enableLint) {
    return;
  }

  const filePath = document.fileName;

  // 读取文件内容
  const content = document.getText();

  // 加载配置
  const options = {
    strings: { [filePath]: content },
    config: loadCustomConfig(config.get<string>('configPath', '')),
  };

  lint(options, (err, result) => {
    if (err) {
      vscode.window.showErrorMessage(`Markdownlint执行错误: ${err.message}`);
      return;
    }

    if (!result) {
      return;
    }

    // 解析结果并显示诊断信息
    const diagnostics = parseLintResult(result);
    diagnosticsCollection.delete(document.uri);
    diagnosticsCollection.set(document.uri, diagnostics);
  });
};

const loadCustomConfig = (configPath: string): any | undefined => {
  if (!configPath) {
    return undefined;
  }

  try {
    const absolutePath = path.isAbsolute(configPath) ? configPath : path.join(vscode.workspace.rootPath || '', configPath);

    if (fs.existsSync(absolutePath)) {
      const configContent = fs.readFileSync(absolutePath, 'utf8');
      return JSON.parse(configContent);
    }

    vscode.window.showWarningMessage(`Markdownlint配置文件不存在: ${absolutePath}`);
  } catch (error) {
    vscode.window.showErrorMessage(`读取Markdownlint配置文件失败: ${error}`);
  }

  return undefined;
};

const parseLintResult = (result: any): vscode.Diagnostic[] => {
  const diagnostics: vscode.Diagnostic[] = [];

  // 遍历每个文件的结果
  Object.keys(result).forEach((file) => {
    const fileResults = result[file];

    // 遍历每个问题
    fileResults.forEach((issue: any) => {
      const range = new vscode.Range(new vscode.Position(issue.lineNumber - 1, 0), new vscode.Position(issue.lineNumber - 1, Number.MAX_SAFE_INTEGER));

      const diagnostic = new vscode.Diagnostic(
        range,
        `${issue.ruleDescription} (${issue.ruleNames.join(', ')})`,
        issue.errorContext ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning
      );

      diagnostic.code = issue.ruleNames.join(',');
      diagnostic.source = 'markdownlint';

      diagnostics.push(diagnostic);
    });
  });

  return diagnostics;
};

export function deactivate() {}
