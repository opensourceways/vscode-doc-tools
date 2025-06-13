import * as vscode from 'vscode';

import { triggerCheck } from '../check/index.js';
import { EVENT_TYPE } from '../../@types/event.js';

export function checkMarkdown(diagnosticsCollection: vscode.DiagnosticCollection) {
  const editor = vscode.window.activeTextEditor;
  if (editor && editor.document.languageId === 'markdown') {
    triggerCheck(EVENT_TYPE.EVENT_RUN_COMMAND, editor.document, diagnosticsCollection);
  } else {
    vscode.window.showInformationMessage('请在Markdown文件中运行Markdownlint');
  }
}
