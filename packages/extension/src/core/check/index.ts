import * as vscode from 'vscode';
import { getMarkdownFilterContent } from 'shared';

import { EVENT_TYPE } from '@/@types/event';
import { isConfigEnabled } from '@/utils/common';

import { getMarkdownlintCodeActions, lintMarkdown } from './lint-markdown';
import { checkTagClosed, getTagClosedCodeActions } from './check-tag-closed';
import { checkCodespell, getCodespellCodeActions } from './check-codespell';
import { checkResourceExistence, getResourceExistenceCodeActions } from './check-resource-existence';
import { checkLinkValidity, getLinkValidityCodeActions } from './check-link-validity';
import { checkToc } from './check-toc';
import { checkMdInToc } from './check-md-in-toc';
import { checkPunctuationSpaces, getPunctuationSpacesCodeActions } from './check-punctuation-spaces';
import { checkPunctuationMixing } from './check-punctuation-mixing';
import { checkPunctuationManualLink, getPunctuationMauanlLinkActions } from './check-punctuation-manual-link';
import { checkPunctuationConsecutive } from './check-punctuation-consecutive';
import { checkPunctuationPair } from './check-punctuation-pair';
import { checkFileNaming } from './check-file-naming';
import { checkFileNamingConsistency } from './check-file-naming-consistency';
import { checkExtraSpaces, getExtraSpacesCodeActions } from './check-extra-spaces';

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
  if (isConfigEnabled('docTools.scope') && !key.includes('docs/zh') && !key.includes('docs/en')) {
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
async function checkMarkdown(event: EVENT_TYPE, document: vscode.TextDocument, diagnosticsCollection: vscode.DiagnosticCollection) {
  const content = getMarkdownFilterContent(document.getText(), {
    disableHtmlComment: true,
    disableCode: true,
  });

  // 先执行不耗时的检查
  const diagnostics: vscode.Diagnostic[] = await Promise.all([
    checkPunctuationSpaces(content, document),
    checkPunctuationMixing(content, document),
    checkPunctuationManualLink(content, document),
    checkPunctuationConsecutive(content, document),
    checkPunctuationPair(content, document),
    checkExtraSpaces(content, document),
    checkTagClosed(content, document),
    checkCodespell(content, document),
    lintMarkdown(document),
  ]).then((result) => {
    return result.flat();
  });

  diagnosticsCollection.delete(document.uri);
  diagnosticsCollection.set(document.uri, diagnostics);

  // 耗时久的另外执行
  const diagnosticsLong = [...(await checkResourceExistence(content, document)), ...(await checkLinkValidity(content, document))];
  if (diagnosticsLong.length > 0) {
    diagnostics.push(...diagnosticsLong);
    diagnosticsCollection.set(document.uri, diagnostics);
  }

  // 弹窗提示的检查
  if (event === EVENT_TYPE.EVENT_ACTIVE || event === EVENT_TYPE.EVENT_OPEN_TEXT_DOC) {
    checkMdInToc(document);
    checkFileNaming(document);
    checkFileNamingConsistency(document);
  }
}

/**
 * 检查 _toc.yaml
 * @param {vscode.TextDocument} document 文档对象
 * @param {vscode.DiagnosticCollection} diagnosticsCollection 提示收集
 */
async function checkTocYaml(document: vscode.TextDocument, diagnosticsCollection: vscode.DiagnosticCollection) {
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
  const actions: vscode.CodeAction[] = [
    ...getPunctuationSpacesCodeActions(context, document),
    ...getPunctuationMauanlLinkActions(context, document),
    ...getCodespellCodeActions(context, document),
    ...getTagClosedCodeActions(context, document),
    ...getLinkValidityCodeActions(context),
    ...getResourceExistenceCodeActions(context),
    ...getMarkdownlintCodeActions(context, document),
    ...getExtraSpacesCodeActions(context, document),
  ];
  return actions;
}
