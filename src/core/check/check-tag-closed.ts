import * as vscode from 'vscode';

import { isConfigEnabled } from '@/utils/common';

/**
 * 检查 html 标签是否闭合
 * @param {string} content markdown 内容
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.Diagnostic[]} 返回错误 Diagnostic 提示数组
 */
export async function checkTagClosed(content: string, document: vscode.TextDocument) {
  const diagnostics: vscode.Diagnostic[] = [];
  if (!isConfigEnabled('docTools.check.tagClosed')) {
    return diagnostics;
  }

  const record: { tag: string; match: RegExpExecArray }[] = []; // 保存标签及其起始位置
  const selfClosedTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

  // 正则表达式，匹配 HTML 标签、被转义的标签
  const REGEX_TAG = /(?<!\\)<\s*\/?\s*([a-zA-Z0-9\-]+)([^>]*)>|<\s*\/?\s*([a-zA-Z0-9\-]+)([^>]*?)\/>|\\<([^>]*)>|<([^>]*)\\>/g;

  for (const match of content.matchAll(REGEX_TAG)) {
    // 跳过链接
    if (
      match[0].startsWith('<') &&
      match[0].endsWith('>') &&
      !match[0].includes('href=') &&
      !match[0].includes('src=') &&
      (match[0].includes('://') || match[0].includes('@'))
    ) {
      continue;
    }

    // 转义的标签
    if (match[0].startsWith('\\<') || match[0].endsWith('\\>')) {
      // 处于 html 标签中不允许使用 \<xx\> \<xx> <xx\> 写法
      if (record.length > 0) {
        const range = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + match[0].length));
        const diagnostic = new vscode.Diagnostic(
          range,
          `Unclosed html tag: ${match[0]}.\\<或\\>的转义写法不允许在标签嵌套中使用`,
          vscode.DiagnosticSeverity.Error
        );
        diagnostic.source = 'tag-closed-check';
        diagnostic.code = match[0];
        diagnostics.push(diagnostic);
      }
      continue;
    }

    // 跳过已闭合标签
    if (match[0].startsWith('<') && match[0].endsWith('/>')) {
      continue;
    }

    // 跳过自闭合标签
    if (match[1] && selfClosedTags.has(match[1]?.toLowerCase())) {
      continue;
    }

    // 跳过tag非字母开头
    if (match[1] && !/^[a-zA-Z]/.test(match[1])) {
      continue;
    }

    const tag = match[1]?.toLowerCase();
    const isEndTag = tag && match[0].startsWith('</');

    // 非 </xx> 结束标签保存记录
    if (!isEndTag) {
      record.push({
        tag,
        match,
      });
      continue;
    }

    // </xx> 寻找对应的 <xx>
    let tagMacthed = false;
    for (let i = record.length - 1; i >= 0; i--) {
      if (record[i].tag === tag) {
        tagMacthed = true;
        record.splice(i, 1);
        break;
      }
    }

    if (!tagMacthed) {
      const range = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + match[0].length));
      const diagnostic = new vscode.Diagnostic(range, `Unclosed html tag: <${tag}>.`, vscode.DiagnosticSeverity.Error);
      diagnostic.source = 'tag-closed-check';
      diagnostic.code = match[0];
      diagnostics.push(diagnostic);
    }
  }

  // 检查剩余的标签
  while (record.length > 0) {
    const { tag, match } = record.pop()!;
    const range = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + match[0].length));
    const diagnostic = new vscode.Diagnostic(range, `Unclosed html tag: <${tag}>.`, vscode.DiagnosticSeverity.Error);
    diagnostic.source = 'tag-closed-check';
    diagnostic.code = match[0];
    diagnostics.push(diagnostic);
  }

  return diagnostics;
}

/**
 * 获取标签不闭合可执行的 action
 * @param {vscode.CodeActionContext} context code action 上下文
 * @param {vscode.TextDocument} document 文档对象
 * @returns {vscode.CodeAction[]} 返回可以执行的 action
 */
export function getTagClosedCodeActions(context: vscode.CodeActionContext, document: vscode.TextDocument) {
  const actions: vscode.CodeAction[] = [];
  if (!isConfigEnabled('docTools.check.tagClosed')) {
    return actions;
  }

  context.diagnostics.forEach((item) => {
    if (item.source !== 'tag-closed-check') {
      return;
    }

    const code = String(item.code);
    const escapeAction = new vscode.CodeAction('转义字符替换', vscode.CodeActionKind.QuickFix);
    escapeAction.edit = new vscode.WorkspaceEdit();
    escapeAction.edit.replace(document.uri, item.range, code.replace('\\<', '<').replace('\\>', '>').replace('<', '&lt;').replace('>', '&gt;'));
    actions.push(escapeAction);

    const match = code.match(/<\s*\/?\s*([a-zA-Z0-9\-]+)([^>]*)>/);
    if (match) {
      const closedAction = new vscode.CodeAction('闭合标签', vscode.CodeActionKind.QuickFix);
      closedAction.edit = new vscode.WorkspaceEdit();
      closedAction.edit.replace(document.uri, item.range, `${(item.code as string).replace('\\<', '<').replace('\\>', '>')}</${match[1]}>`);
      actions.push(closedAction);
    }
  });

  return actions;
}
