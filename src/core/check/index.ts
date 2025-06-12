import * as vscode from 'vscode';
import { lintMarkdown } from './lint-markdown.js';
import { checkTagClosed, getTagClosedCodeActions } from './check-tag-closed.js';
import { checkCodespell, getCodespellActions } from './check-codespell.js';
import { checkResourceExistence } from './check-resource-existence.js';
import { checkLinkValidity } from './check-link-validity.js';
import { checkToc } from './check-toc.js';
import { checkMdInToc } from './check-md-in-toc.js';
import { EVENT_TYPE } from '../../@types/event.js';

// 用于存储延迟任务记录
const timerMap = new Map<string, NodeJS.Timeout>();

/**
 * 触发检查（延迟 1s 触发检查，避免频繁触发）
 * @param {EVENT_TYPE} event 事件类型
 * @param {vscode.TextDocument} document 文档对象
 * @param {vscode.DiagnosticCollection} diagnosticsCollection 提示收集
 */
export function triggerCheck(event: EVENT_TYPE, document: vscode.TextDocument, diagnosticsCollection: vscode.DiagnosticCollection) {
  if (document.languageId !== 'markdown' && document.languageId !== 'yaml') {
    return;
  }

  // 不符合 docs/zh 或 docs/en 的跳过检查
  const key = document.uri.path;
  if (!key.includes('docs/zh') && !key.includes('docs/en')) {
    return;
  }

  // 清理上一次还未开始执行的任务
  let timer = timerMap.get(key);
  if (!timer) {
    clearTimeout(timer);
  }

  // 创建延迟任务
  timer = setTimeout(() => {
    timerMap.delete(key);
    // 检查 markdown
    if (document.languageId === 'markdown') {
      checkMarkdown(event, document, diagnosticsCollection);
      return;
    }

    // 检查 _toc.yaml
    if (document.languageId === 'yaml' && document.uri.path.split('/').pop() === '_toc.yaml') {
      checkTocYaml(document, diagnosticsCollection);
      return;
    }
  }, 1000);

  timerMap.set(key, timer);
}

/**
 * 检查 markdown
 * @param {EVENT_TYPE} event 事件类型
 * @param {vscode.TextDocument} document 文档对象
 * @param {vscode.DiagnosticCollection} diagnosticsCollection 提示收集
 */
export async function checkMarkdown(event: EVENT_TYPE, document: vscode.TextDocument, diagnosticsCollection: vscode.DiagnosticCollection) {
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

/**
 * 检查 _toc.yaml
 * @param {vscode.TextDocument} document 文档对象
 * @param {vscode.DiagnosticCollection} diagnosticsCollection 提示收集
 */
export async function checkTocYaml(document: vscode.TextDocument, diagnosticsCollection: vscode.DiagnosticCollection) {
  const diagnostics: vscode.Diagnostic[] = await checkToc(document);
  diagnosticsCollection.delete(document.uri);
  diagnosticsCollection.set(document.uri, diagnostics);
}

/**
 * 获取提示的code action
 * @param {vscode.TextDocument} document 文档对象
 * @param {vscode.CodeActionContext} context 上下文对象
 */
export function getCodeActions(document: vscode.TextDocument, context: vscode.CodeActionContext) {
  const actions: vscode.CodeAction[] = [...getCodespellActions(document, context), ...getTagClosedCodeActions(document, context)];
  return actions;
}
