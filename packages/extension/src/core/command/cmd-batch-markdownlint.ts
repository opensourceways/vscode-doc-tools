import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import { applyFixes, type Configuration, type LintError } from 'markdownlint';
import { existsAsync, getFileContentAsync, readdirAsync, sleep } from 'shared';
import { BroadcastT, MessageT, OPERATION_TYPE, ServerMessenger, SOURCE_TYPE } from 'webview-bridge';
import { execMarkdownlint } from 'checkers';

import { createWebviewPanel } from '@/utils/webview';

const ID = 'batch-markdownlint-result';
let controller: AbortController | null = null;
let errorsMap: Map<string, LintError[]> | null;

const sendAsyncTaskOutput = (() => {
  let messages: any[] = [];
  let timer: number | NodeJS.Timeout | undefined;
  let lastTime = 0;

  return (data: any, imediately = false) => {
    if (data?.evt === 'scanTarget') {
      messages = messages.filter((item) => item?.evt !== 'scanTarget');
    }
    messages.push(data);

    if (timer && !imediately && messages.length < 1000) {
      return;
    }

    if (imediately || lastTime === 0 || Date.now() - lastTime > 200 || messages.length >= 1000) {
      clearTimeout(timer);
      ServerMessenger.broadcast(ID, 'onAsyncTaskOutput', messages);
      messages = [];
      timer = undefined;
      lastTime = Date.now();
    } else {
      timer = setTimeout(() => {
        ServerMessenger.broadcast(ID, 'onAsyncTaskOutput', messages);
        messages = [];
        timer = undefined;
      }, 200);
    }
  };
})();

function stop() {
  if (controller && !controller?.signal.aborted) {
    controller.abort();
  }
  controller = null;
  sendAsyncTaskOutput({ evt: 'stop' }, true);
}

async function walkDir(dir: string, config: Configuration, signal: AbortSignal) {
  const names = await readdirAsync(dir);
  for (const name of names) {
    if (signal.aborted) {
      return;
    }

    const completePath = path.join(dir, name).replace(/\\/g, '/');
    sendAsyncTaskOutput({
      evt: 'scanTarget',
      data: completePath,
    });

    if (fs.statSync(completePath).isDirectory()) {
      await walkDir(completePath, config, signal);
    } else if (name.endsWith('.md')) {
      const content = await getFileContentAsync(completePath);
      const [results, errors] = await execMarkdownlint(content, config);
      if (signal.aborted) {
        return;
      }

      if (results.length > 0) {
        results.reverse();
        errorsMap!.set(completePath, errors);
        sendAsyncTaskOutput({
          evt: 'addItem',
          data: {
            file: completePath,
            msgs: results.map((item) => {
              return {
                start: item.start,
                end: item.end,
                file: completePath,
                msg: `${item.extras?.split(',')[0]}：${item.message.zh}`,
              };
            }),
          },
        });
      }
    }

    await sleep(1);
  }
}

async function startWalk(targetPath: string) {
  try {
    controller?.abort();
    controller = new AbortController();
    errorsMap = new Map();
    const settingConfig = vscode.workspace.getConfiguration('docTools.markdownlint').get<Configuration>('config', {});
    await walkDir(targetPath, Object.keys(settingConfig).length > 0 ? settingConfig : {}, controller.signal);
    if (controller && !controller.signal.aborted) {
      sendAsyncTaskOutput({ evt: 'stop' }, true);
    }
  } catch {
    stop();
  }
}

async function fixMarkdown(targetPath: string, tip: boolean) {
  if (!errorsMap?.get(targetPath)) {
    return;
  }

  const content = applyFixes(await getFileContentAsync(targetPath), errorsMap.get(targetPath)!);
  const settingConfig = vscode.workspace.getConfiguration('docTools.markdownlint').get<Configuration>('config', {});
  const [results, errors] = await execMarkdownlint(content, Object.keys(settingConfig).length > 0 ? settingConfig : {});

  if (results.length > 0) {
    results.reverse();
    errorsMap.set(targetPath, errors);
  } else {
    errorsMap.delete(targetPath);
  }

  sendAsyncTaskOutput({
    evt: 'updateItem',
    data: {
      tip,
      file: targetPath,
      msgs: results.map((item) => {
        return {
          start: item.start,
          end: item.end,
          file: targetPath,
          msg: `${item.extras?.split(',')[0]}：${item.message.zh}`,
        };
      }),
    },
  });

  await fs.promises.writeFile(targetPath, content, 'utf-8');
}

async function batchFixMarkdown(targetPaths: string[]) {
  try {
    controller?.abort();
    controller = new AbortController();
    for (const targetPath of targetPaths) {
      if (controller.signal.aborted) {
        return;
      }

      sendAsyncTaskOutput({
        evt: 'scanTarget',
        data: targetPath,
      });
      await fixMarkdown(targetPath, false);
      await sleep(50);
    }

    if (controller && !controller.signal.aborted) {
      sendAsyncTaskOutput({ evt: 'stop' }, true);
    }
  } catch {
    stop();
  }
}

/**
 * 创建批量执行 markdownlint webview
 * @param {vscode.ExtensionContext} context 上下文
 * @param {vscode.Uri} uri 目标目录 uri
 */
export async function createBatchMarkdownlintWebview(context: vscode.ExtensionContext, uri: vscode.Uri) {
  if (!(await existsAsync(uri.fsPath))) {
    vscode.window.showErrorMessage(`路径不存在：${uri.fsPath}`);
    return;
  }

  const fsPath = fs.realpathSync.native(uri.fsPath).replace(/\\/g, '/');
  if (!fs.statSync(fsPath).isDirectory()) {
    vscode.window.showErrorMessage(`非目录路径：${fsPath}`);
    return;
  }

  const isDarkTheme = vscode.workspace.getConfiguration().get<string>('workbench.colorTheme', '').toLowerCase().includes('dark');

  const webviewPanel = createWebviewPanel({
    context,
    viewType: 'Doc Tools：检查结果',
    title: 'Doc Tools：检查结果',
    showOptions: vscode.ViewColumn.Two,
    iconPath: vscode.Uri.file(path.join(context.extensionPath, 'resources', isDarkTheme ? 'icon-preview-dark.svg' : 'icon-preview-light.svg')),
    injectData: {
      path: '/batch-markdownlint-result',
      theme: isDarkTheme ? 'dark' : 'light',
      locale: fsPath.includes('/en/') ? 'en' : 'zh',
      extras: {
        fsPath,
      },
    },
    onBeforeLoad(webviewPanel, isDev) {
      ServerMessenger.bind(ID, webviewPanel, isDev);
    },
  });

  webviewPanel.onDidDispose(() => {
    controller?.abort();
    controller = null;
    errorsMap = null;
  });

  webviewPanel.webview.onDidReceiveMessage((message: MessageT<BroadcastT<string>>) => {
    if (message.source !== SOURCE_TYPE.client || message.operation !== OPERATION_TYPE.broadcast) {
      return;
    }

    const { name, extras } = message.data;
    if (name === 'start' && typeof extras?.[0] === 'string') {
      startWalk(extras[0]);
    } else if (name === 'stop') {
      stop();
    } else if (name === 'fix' && typeof extras?.[0] === 'string') {
      fixMarkdown(extras[0], true);
    } else if (name === 'batchFix' && Array.isArray(extras)) {
      batchFixMarkdown(extras[0]);
    }
  });
}
