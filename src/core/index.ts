import * as vscode from 'vscode';
import { lintMarkdown } from './lint-markdown.js';
import { checkTagClosed, getTagClosedCodeActions } from './check-tag-closed.js';
import { checkCodespell, getCodespellActions } from './check-codespell.js';
import { checkResourceExistence } from './check-resource-existence.js';
import { checkLinkValidity } from './check-link-validity.js';
import { checkToc } from './check-toc.js';
import { checkMdInToc } from './check-md-in-toc.js';
import { EVENT_TYPE } from '../@types/event.js';

export async function checkMarkdown(document: vscode.TextDocument, diagnosticsCollection: vscode.DiagnosticCollection, event: EVENT_TYPE) {
  // 先执行不耗时的检查
  const diagnostics: vscode.Diagnostic[] = await Promise.all([checkTagClosed(document), checkCodespell(document), lintMarkdown(document)]).then((result) => {
    return result.flat();
  });

  diagnosticsCollection.delete(document.uri);
  diagnosticsCollection.set(document.uri, diagnostics);

  // 耗时久的另外执行
  const diagnosticsLong = [...(await checkResourceExistence(document)), ...(await checkLinkValidity(document))];
  if (diagnosticsLong.length > 0) {
    diagnostics.push(...diagnosticsLong);
    diagnosticsCollection.set(document.uri, diagnostics);
  }

  // 检查 md 是否在 _toc.yaml 中
  if (event === EVENT_TYPE.EVENT_ACTIVE || event === EVENT_TYPE.EVENT_OPEN_TEXT_DOC) {
    checkMdInToc(document);
  }
}

export async function checkTocYaml(document: vscode.TextDocument, diagnosticsCollection: vscode.DiagnosticCollection) {
  const diagnostics: vscode.Diagnostic[] = await checkToc(document);
  diagnosticsCollection.delete(document.uri);
  diagnosticsCollection.set(document.uri, diagnostics);
}

export function getCodeActions(document: vscode.TextDocument, context: vscode.CodeActionContext) {
  const actions: vscode.CodeAction[] = [...getCodespellActions(document, context), ...getTagClosedCodeActions(document, context)];
  return actions;
}
