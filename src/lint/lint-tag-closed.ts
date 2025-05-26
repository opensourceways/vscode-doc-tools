import * as vscode from 'vscode';

export default function lintTagClosed(document: vscode.TextDocument) {
  const diagnostics: vscode.Diagnostic[] = [];
  const text = document.getText();
  const stack: { tag: string; start: number }[] = []; // 保存标签及其起始位置
  const selfClosingTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

  // 正则表达式，匹配 HTML 标签、注释和代码块，同时排除被转义的标签
  const tagRegex = /(?<!\\)<\s*\/?\s*([a-zA-Z0-9]+)([^>]*)>|<!--[\s\S]*?-->|(```[\s\S]*?```|`[^`]*`)|\\<[^>]*>|<[^>]*\\>/g;
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

    const tag = match[1]?.toLowerCase();
    const isClosingTag = tag && match[0].startsWith('</');
    const isSelfClosingTag = tag && selfClosingTags.has(tag);
    const isComment = match[0].startsWith('<!--');
    const isCodeBlock = match[0].startsWith('```') || match[0].startsWith('`');

    if (isClosingTag) {
      if (stack.length === 0 || stack.pop()?.tag !== tag) {
        const range = new vscode.Range(
          document.positionAt(match.index).line,
          document.positionAt(match.index).character,
          document.positionAt(match.index + match[0].length).line,
          document.positionAt(match.index + match[0].length).character
        );
        diagnostics.push(new vscode.Diagnostic(range, `Unclosed html tag: <${tag}>. If you want to ignore the check add \\ after < or >, e.g. \\<test\\>`, vscode.DiagnosticSeverity.Error));
      }
    } else if (tag && !isSelfClosingTag && !isComment && !isCodeBlock) {
      stack.push({ tag, start: match.index });
    }
  }

  // 检查剩余未闭合的标签
  while (stack.length > 0) {
    const { tag, start } = stack.pop()!;
    const range = new vscode.Range(
      document.positionAt(start).line,
      document.positionAt(start).character,
      document.positionAt(start + tag.length + 1).line,
      document.positionAt(start + tag.length + 1).character
    );
    diagnostics.push(new vscode.Diagnostic(range, `Unclosed HTML tag: <${tag}>. If you want to ignore the check add \\ after < or >, e.g. \\<test\\>`, vscode.DiagnosticSeverity.Error));
  }

  return diagnostics;
}
