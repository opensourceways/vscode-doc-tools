import * as vscode from 'vscode';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

import { TocItem } from '@/@types/toc';
import { copyDirectorySync, getYamlContent } from '@/utils/file';
import { isMdInToc } from '@/utils/markdwon';
import { delay } from '@/utils/common';

const DOCS_WEBSITE_GIT = 'https://gitee.com/luckyasme/openeuler-docs.git';
const DOCS_WEBSITE_BRANCH = 'preview';

let repoPath = '';
let previewUrl = '';
let outputChannel: vscode.OutputChannel;

function execForResult(command: string): Promise<[boolean, string]> {
  return new Promise((resolve) => {
    let output = '';
    let errMessage = '';
    const child = exec(command);

    child.stdout?.on('data', (data) => {
      output += data;
    });

    child.stderr?.on('data', (data) => {
      errMessage += data;
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve([true, output]);
      } else {
        resolve([false, errMessage]);
      }
    });

    child.on('error', (error) => {
      errMessage += error?.message;
    });
  });
}

async function init() {
  outputChannel.appendLine('预览文档需要安装：');
  outputChannel.appendLine('1.git');
  outputChannel.appendLine('2.nodejs');
  outputChannel.appendLine('3.npm、pnpm');
  outputChannel.appendLine('');

  // 检测 git
  outputChannel.appendLine('检测 git 是否存在');
  let [result, output] = await execForResult('git -v');
  if (result && output.includes('git version')) {
    outputChannel.appendLine(`存在 git：${output}`);
  } else {
    outputChannel.appendLine(`不存在 git，请先安装 git！执行返回：`);
    outputChannel.appendLine(output);
    vscode.window.showErrorMessage(`不存在 git，请先安装 git！`);
    return;
  }

  // 检测 nodejs
  outputChannel.appendLine('检测 nodejs 是否存在');
  [result, output] = await execForResult('node -v');
  if (result && output) {
    outputChannel.appendLine(`存在 nodejs：${output}`);
  } else {
    outputChannel.appendLine(`不存在 nodejs，请先安装 nodejs！执行返回：`);
    outputChannel.appendLine(output);
    vscode.window.showErrorMessage(`不存在 nodejs，请先安装 Nodejs！`);
    return;
  }

  // 检测 npm
  outputChannel.appendLine('检测 npm 是否存在');
  [result, output] = await execForResult('npm -v');
  if (result && output) {
    outputChannel.appendLine(`存在 npm：${output}`);
  } else {
    outputChannel.appendLine(`不存在 npm，请先安装 npm！执行返回：`);
    outputChannel.appendLine(output);
    vscode.window.showErrorMessage(`不存在 npm，请先安装 npm！`);
    return;
  }

  // 检测 pnpm
  outputChannel.appendLine('检测 pnpm 是否存在');
  [result, output] = await execForResult('pnpm -v');
  if (result && output) {
    outputChannel.appendLine(`存在 pnpm：${output}`);
  } else {
    outputChannel.appendLine(`不存在 pnpm，尝试安装 pnpm`);
    outputChannel.appendLine(`开始安装pnpm...`);
    [result, output] = await execForResult('npm i pnpm -g');
    if (result) {
      outputChannel.appendLine('安装 pnpm 成功');
    } else {
      outputChannel.appendLine('安装 pnpm 失败，执行返回：');
      outputChannel.appendLine(output);
      return;
    }
  }

  // 获取 docs-website 目录
  const config = vscode.workspace.getConfiguration('docTools.preview.markdown');
  repoPath = config.get<string>('repoPath', '');
  if (!repoPath) {
    const uri = await vscode.window.showOpenDialog({
      title: '请选择存放构建仓库的目录',
      canSelectMany: false, // 是否可以选择多个目录
      canSelectFiles: false, // 是否可以选择文件
      canSelectFolders: true, // 是否可以选择目录
    });
    if (uri && uri.length > 0) {
      repoPath = path.join(uri[0].fsPath, 'docs-website');
      outputChannel.appendLine(`已选择存放构建仓库的目录: ${uri[0].fsPath}`);
    } else {
      outputChannel.appendLine(`未选择任何目录！`);
      return;
    }
  }

  // 克隆 docs-website 仓库
  if (!fs.existsSync(repoPath)) {
    outputChannel.appendLine('开始克隆 docs-website 仓库...');
    [result, output] = await execForResult(`git clone ${DOCS_WEBSITE_GIT} ${repoPath}`);
    if (result) {
      outputChannel.appendLine('克隆完成');
    } else {
      outputChannel.appendLine('克隆失败，执行返回：');
      outputChannel.appendLine(output);
      return;
    }
  }

  // 检测 repo
  [result, output] = await execForResult(`cd ${repoPath} && git remote -v`);
  if (output.includes(DOCS_WEBSITE_GIT)) {
    outputChannel.appendLine('检测到 docs-website 仓库');
    config.update('repoPath', repoPath, vscode.ConfigurationTarget.Global);
  } else {
    outputChannel.appendLine(`目录下存在docs-website，但并非是仓库，执行返回：`);
    outputChannel.appendLine(output);
    vscode.window.showErrorMessage(`目录下存在docs-website文件夹，但并非是仓库，请手动删除该文件夹`);
    return;
  }

  // 检测目标分支
  outputChannel.appendLine(`检测 ${DOCS_WEBSITE_BRANCH} 分支是否存在`);
  [result, output] = await execForResult(`cd ${repoPath} && git branch --list ${DOCS_WEBSITE_BRANCH}`);
  if (output) {
    outputChannel.appendLine(`分支存在，开始更新 ${DOCS_WEBSITE_BRANCH} 分支内容`);
    await execForResult(`cd ${repoPath} && git pull`);
    [result, output] = await execForResult(`cd ${repoPath} && git reset --hard origin/${DOCS_WEBSITE_BRANCH}`);
    if (result) {
      outputChannel.appendLine(`拉取远程分支 ${DOCS_WEBSITE_BRANCH} 内容成功`);
    } else {
      outputChannel.appendLine(`拉取远程分支 ${DOCS_WEBSITE_BRANCH} 内容失败，执行返回：`);
      outputChannel.appendLine(output);
      return;
    }
  } else {
    outputChannel.appendLine(`本地不存在 ${DOCS_WEBSITE_BRANCH} 分支，开始尝试拉取分支内容`);
    [result, output] = await execForResult(`cd ${repoPath} && git checkout -b ${DOCS_WEBSITE_BRANCH} --track origin/${DOCS_WEBSITE_BRANCH}`);
    if (result) {
      outputChannel.appendLine(`拉取远程分支 ${DOCS_WEBSITE_BRANCH} 内容成功`);
    } else {
      outputChannel.appendLine(`拉取远程分支 ${DOCS_WEBSITE_BRANCH} 内容失败，执行返回：`);
      outputChannel.appendLine(output);
      return;
    }
  }

  // 安装/更新依赖
  outputChannel.appendLine(`开始安装/更新nodejs依赖...`);
  [result, output] = await execForResult(`cd ${repoPath} && pnpm i`);
  if (result) {
    outputChannel.appendLine(`安装/更新nodejs依赖完成`);
  } else {
    outputChannel.appendLine(`安装/更新nodejs依赖失败，执行返回：`);
    outputChannel.appendLine(output);
  }

  outputChannel.appendLine('');
}

function copyFile(uri: vscode.Uri) {
  const mdPath = uri.fsPath.replace(/\\/g, '/');
  const dirArr = mdPath.split('/');
  const poped = [];

  while (dirArr.length) {
    const dirPath = dirArr.join('/');
    const tocPath = path.join(dirPath, '_toc.yaml');
    if (fs.existsSync(tocPath)) {
      const yamlObj = getYamlContent(tocPath) as TocItem;
      if (isMdInToc(yamlObj, dirPath, mdPath)) {
        break;
      }
    }

    poped.push(dirArr.pop());
  }

  const sourcePath = dirArr.join('/');
  const destPath = path.join(repoPath, 'app/temp-docs/');

  if (fs.existsSync(destPath)) {
    fs.rmSync(destPath, { recursive: true, force: true, retryDelay: 300, maxRetries: 10 });
    fs.mkdirSync(destPath, { recursive: true });
  }

  if (dirArr.length) {
    copyDirectorySync(sourcePath, destPath);
    previewUrl = `temp-docs/${poped.reverse().join('/').replace('.md', '.html')}`;
    return true;
  } else {
    vscode.window.showErrorMessage('markdown 未加入任何 _toc.yaml，无法预览');
  }

  return false;
}

function build() {
  const terminal = vscode.window.createTerminal({
    name: 'Doc Tools: Preview',
    cwd: repoPath,
  });
  terminal.show();
  terminal.sendText(`node scripts/preview.js ${previewUrl}`, true);
}

export function cleanLastPreview() {
  vscode.window.terminals.forEach((terminal) => {
    if (terminal.name === 'Doc Tools: Preview') {
      terminal.sendText('^C');
      terminal.sendText('exit');
      terminal.dispose();
    }
  });
}

export async function previewMarkdown(uri: vscode.Uri) {
  if (outputChannel) {
    outputChannel.show();
  } else {
    outputChannel = vscode.window.createOutputChannel('Doc Tools: Preview');
    outputChannel.show();
    await init();
  }

  cleanLastPreview();

  await delay(1 * 1000);

  if (copyFile(uri)) {
    build();
  }
}
