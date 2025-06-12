import * as vscode from 'vscode';
import { checkMarkdown, checkTocYaml, getCodeActions } from './core/index.js';
import { EVENT_TYPE } from './@types/event.js';
import genTocManual from './command/gen-toc-manual.js';

// 用于存储错误信息
const diagnosticsCollection = vscode.languages.createDiagnosticCollection('markdownlint');
// 用于存储延迟任务记录
const timerMap = new Map<string, NodeJS.Timeout>();

/**
 * 触发器（延迟 1s 触发检查，避免频繁触发）
 * @param document 文档对象
 */
function trigger(document: vscode.TextDocument, event: EVENT_TYPE) {
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
      checkMarkdown(document, diagnosticsCollection, event);
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
 * 注册事件
 * @param context 上下文对象
 */
function registerEvent(context: vscode.ExtensionContext) {
  // 监听文件打开
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      trigger(document, EVENT_TYPE.EVENT_OPEN_TEXT_DOC);
    })
  );

  // 监听文件保存
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      trigger(document, EVENT_TYPE.EVENT_SAVE_TEXT_DOC);
    })
  );

  // 监听内容变化
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      trigger(event.document, EVENT_TYPE.EVENT_CHANGE_TEXT_DOC);
    })
  );
}

/**
 * 注册命令
 * @param context 上下文对象
 */
function registerCommand(context: vscode.ExtensionContext) {
  // 注册 markdownlint.run 命令
  context.subscriptions.push(
    vscode.commands.registerCommand('markdownlint.run', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'markdown') {
        trigger(editor.document, EVENT_TYPE.EVENT_RUN_COMMAND);
      } else {
        vscode.window.showInformationMessage('请在Markdown文件中运行Markdownlint');
      }
    })
  );

  // 注册 gen-toc.manual 命令
  context.subscriptions.push(
    vscode.commands.registerCommand('gen-toc.manual', (uri: vscode.Uri) => {
      genTocManual(uri);
    })
  );
}

/**
 * 注册code action
 * @param context 上下文对象
 */
function registerCodeAction(context: vscode.ExtensionContext) {
  // 注册 code action 菜单
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider('markdown', {
      provideCodeActions(document, _range, context, _token) {
        return getCodeActions(document, context);
      },
    })
  );
}

/**
 * 激活插件
 * @param context 上下文对象
 */
export function activate(context: vscode.ExtensionContext) {
  // 首次激活后检查
  if (vscode.window.activeTextEditor) {
    trigger(vscode.window.activeTextEditor.document, EVENT_TYPE.EVENT_ACTIVE);
  }

  // 注册事件、命令和 code action
  registerEvent(context);
  registerCommand(context);
  registerCodeAction(context);
}

/**
 * 失活插件
 */
export function deactivate() {
  diagnosticsCollection.dispose();
}
