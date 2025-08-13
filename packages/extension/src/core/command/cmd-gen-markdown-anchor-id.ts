import * as vscode from 'vscode';
import { getMarkdownTitleId } from 'shared';

export async function genMarkdownAnchorId() {
  // 获取当前活动编辑器
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  // 获取当前选中的文本
  const selection = editor.selection;
  const selectedText = editor.document.getText(selection).trim();

  // 如果没有选中文本，给出提示
  if (!selectedText) {
    vscode.window.showWarningMessage('请先选中需要生成锚点的文本');
    return;
  }

  const anchor = `#${getMarkdownTitleId(selectedText)}`
  await vscode.env.clipboard.writeText(anchor);
  vscode.window.showInformationMessage(`锚点已复制：${anchor}`);
}
