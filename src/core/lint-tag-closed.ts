import * as vscode from 'vscode';

export async function lintTagClosed(document: vscode.TextDocument) {
  const diagnostics: vscode.Diagnostic[] = [];
  const text = document.getText();
  const stack: { tag: string; code: string; start: number }[] = []; // 保存标签及其起始位置
  const selfClosingTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

  // 正则表达式，匹配 HTML 标签、注释和代码块，同时排除被转义的标签
  const tagRegex =
    /(?<!\\)<\s*\/?\s*([a-zA-Z0-9\-]+)([^>]*)>|<\s*\/?\s*([a-zA-Z0-9\-]+)([^>]*?)\/>|<!--[\s\S]*?-->|(```[\s\S]*?```|`[^`]*`)|\\<[^>]*>|<[^>]*\\>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(text)) !== null) {
    // 跳过链接
    if (match[0].startsWith('<') && match[0].endsWith('>') && match[0].includes('://')) {
      continue;
    }

    // 转义的标签
    if (match[0].startsWith('\\<') || match[0].endsWith('\\>')) {
      continue;
    }

    // 跳过代码块
    if (match[0].startsWith('```') || match[0].startsWith('`')) {
      continue;
    }

    // 跳过html注释
    if (match[0].startsWith('<!--')) {
      continue;
    }

    // 跳过已闭合标签
    if (match[0].startsWith('<') && match[0].endsWith('/>')) {
      continue;
    }

    const tag = match[1]?.toLowerCase();
    const isClosingTag = tag && match[0].startsWith('</');
    const isSelfClosingTag = tag && selfClosingTags.has(tag);

    if (isClosingTag) {
      if (stack.length === 0 || stack.pop()?.tag !== tag) {
        const range = new vscode.Range(
          document.positionAt(match.index).line,
          document.positionAt(match.index).character,
          document.positionAt(match.index + match[0].length).line,
          document.positionAt(match.index + match[0].length).character
        );
        const diagnostic = new vscode.Diagnostic(range, `Unclosed html tag: <${tag}>.`, vscode.DiagnosticSeverity.Error);
        diagnostic.source = 'tag-closed-lint';
        diagnostic.code = match[0];
        diagnostics.push(diagnostic);
      }
    } else if (tag && !isSelfClosingTag) {
      stack.push({ tag, code: match[0], start: match.index });
    }
  }

  // 检查剩余未闭合的标签
  while (stack.length > 0) {
    const { tag, code, start } = stack.pop()!;
    const range = new vscode.Range(
      document.positionAt(start).line,
      document.positionAt(start).character,
      document.positionAt(start + code.length + 1).line,
      document.positionAt(start + code.length + 1).character
    );
    const diagnostic = new vscode.Diagnostic(range, `Unclosed HTML tag: <${tag}>.`, vscode.DiagnosticSeverity.Error);
    diagnostic.source = 'tag-closed-lint';
    diagnostic.code = code;
    diagnostics.push(diagnostic);
  }

  return diagnostics;
}

export function getTagClosedCodeActions(document: vscode.TextDocument, context: vscode.CodeActionContext) {
  const actions: vscode.CodeAction[] = [];

  context.diagnostics.forEach((item) => {
    if (item.source !== 'tag-closed-lint') {
      return;
    }

    const code = String(item.code);
    const escapeAction = new vscode.CodeAction('转义字符替换', vscode.CodeActionKind.QuickFix);
    escapeAction.edit = new vscode.WorkspaceEdit();
    escapeAction.edit.replace(document.uri, item.range, code.replace('<', '&lt;').replace('>', '&gt;'));
    actions.push(escapeAction);

    const match = code.match(/<\s*\/?\s*([a-zA-Z0-9\-]+)([^>]*)>/);
    if (match) {
      const closedAction = new vscode.CodeAction('闭合标签', vscode.CodeActionKind.QuickFix);
      closedAction.edit = new vscode.WorkspaceEdit();
      closedAction.edit.replace(document.uri, item.range, `${item.code}</${match[1]}>`);
      actions.push(closedAction);
    }
  });

  return actions;
}
