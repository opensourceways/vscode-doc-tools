import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import { applyFixes, type Configuration, type LintError } from 'markdownlint';
import { existsAsync, getFileContentAsync, readdirAsync } from 'shared';
import { BroadcastT, MessageT, OPERATION_TYPE, ServerMessageHandler, SOURCE_TYPE } from 'webview-bridge';
import { execMarkdownlint } from 'checkers';

import { createWebviewPanel } from '@/utils/webview';
import { MD_DEFAULT_CONFIG } from '@/config/markdownlint';

let controller: AbortController | null = null;
let errorsMap: Map<string, LintError[]> | null;

function stop() {
  controller?.abort();
  ServerMessageHandler.broadcast('onAsyncTaskOutput', 'batchExecMarkdownlint:stop');
}
async function walkDir(dir: string, config: Configuration, signal: AbortSignal) {
  const names = await readdirAsync(dir);
  for (const name of names) {
    if (signal.aborted) {
      throw new Error('aborted');
    }

    const completePath = path.join(dir, name).replace(/\\/g, '/');
    ServerMessageHandler.broadcast('onAsyncTaskOutput', 'batchExecMarkdownlint:scanTarget', completePath);

    if (fs.statSync(completePath).isDirectory()) {
      await walkDir(completePath, config, signal);
    } else if (name.endsWith('.md')) {
      const content = await getFileContentAsync(completePath);
      const [results, errors] = await execMarkdownlint(content, config);
      if (signal.aborted) {
        throw new Error('aborted');
      }

      if (results.length > 0) {
        results.reverse();
        errorsMap!.set(completePath, errors);
        ServerMessageHandler.broadcast('onAsyncTaskOutput', 'batchExecMarkdownlint:addItem', {
          file: completePath,
          msgs: results.map((item) => {
            return {
              start: item.start,
              end: item.end,
              file: completePath,
              msg: `${item.extras?.split(',')[0]}：${item.message.zh}`,
            };
          }),
        });
      }
    }
  }
}

async function startWalk(targetPath: string) {
  try {
    controller?.abort();
    controller = new AbortController();
    controller.signal.addEventListener('abort', () => {
      throw new Error('abort');
    });

    errorsMap = new Map();
    const settingConfig = vscode.workspace.getConfiguration('docTools.markdownlint').get<Configuration>('config', {});
    const config = Object.keys(settingConfig).length > 0 ? settingConfig : MD_DEFAULT_CONFIG;
    await walkDir(targetPath, config, controller.signal);
    if (controller && !controller.signal.aborted) {
      ServerMessageHandler.broadcast('onAsyncTaskOutput', 'batchExecMarkdownlint:stop');
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
  const config = Object.keys(settingConfig).length > 0 ? settingConfig : MD_DEFAULT_CONFIG;
  const [results, errors] = await execMarkdownlint(content, config);

  if (results.length > 0) {
    results.reverse();
    errorsMap.set(targetPath, errors);
  } else {
    errorsMap.delete(targetPath);
  }

  ServerMessageHandler.broadcast('onAsyncTaskOutput', 'batchExecMarkdownlint:fixItem', {
    tip,
    file: targetPath,
    msgs: results.map((item) => {;
      return {
        start: item.start,
        end: item.end,
        file: targetPath,
        msg: `${item.extras?.split(',')[0]}：${item.message.zh}`,
      };
    }),
  });

  await fs.promises.writeFile(targetPath, content, 'utf-8');
}

async function batchFixMarkdown(targetPaths: string[]) {
  try {
    controller?.abort();
    controller = new AbortController();
    controller.signal.addEventListener('abort', () => {
      throw new Error('abort');
    });

    for (const targetPath of targetPaths) {
      ServerMessageHandler.broadcast('onAsyncTaskOutput', 'batchExecMarkdownlint:scanTarget', targetPath);
      await fixMarkdown(targetPath, false);
      if (controller && controller.signal.aborted) {
        return;
      }
    }

    if (controller && !controller.signal.aborted) {
      ServerMessageHandler.broadcast('onAsyncTaskOutput', 'batchExecMarkdownlint:stop');
    }
  } catch {
    stop();
  }
}

/**
 * 批量执行 Markdownlint
 * @param {vscode.ExtensionContext} context 上下文
 * @param {vscode.Uri} uri 目标目录 uri
 */
export async function batchExecMarkdownlint(context: vscode.ExtensionContext, uri: vscode.Uri) {
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
    showOptions: vscode.ViewColumn.Beside,
    iconPath: vscode.Uri.file(path.join(context.extensionPath, 'resources', isDarkTheme ? 'icon-preview-dark.svg' : 'icon-preview-light.svg')),
    injectData: {
      path: '/batch-exec-markdownlint-result',
      theme: isDarkTheme ? 'dark' : 'light',
      locale: fsPath.includes('/en/') ? 'en' : 'zh',
      extras: {
        fsPath,
      },
    },
    onBeforeLoad(webviewPanel, isDev) {
      ServerMessageHandler.bind(webviewPanel, isDev);
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
    if (name === 'asyncTask:batchExecMarkdownlint' && typeof extras?.[0] === 'string') {
      startWalk(extras[0]);
    } else if (name === 'asyncTask:stopBatchExecMarkdownlint' || name === 'asyncTask:stopBatchFixMarkdownlint') {
      stop();
    } else if (name === 'asyncTask:fixMarkdownlint' && typeof extras?.[0] === 'string') {
      fixMarkdown(extras[0], true);
    } else if (name === 'asyncTask:batchFixMarkdownlint' && Array.isArray(extras)) {
      batchFixMarkdown(extras[0]);
    }
  });
}
