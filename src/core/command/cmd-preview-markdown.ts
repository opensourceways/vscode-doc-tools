import * as vscode from 'vscode';
import { type ChildProcess, exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import stripAnsi from 'strip-ansi';

const DOCS_WEBSITE_GIT = 'https://gitee.com/luckyasme/docs-website.git';
const DOCS_WEBSITE_BRANCH = 'master';

let repoPath = '';
let serverProcess: ChildProcess | null;
let outputPanel: vscode.OutputChannel;

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
  outputPanel = vscode.window.createOutputChannel('Doc Tools: Preview');
  outputPanel.show();
  outputPanel.appendLine('预览文档需要安装：');
  outputPanel.appendLine('1.git');
  outputPanel.appendLine('2.nodejs');
  outputPanel.appendLine('3.npm、pnpm');
  outputPanel.appendLine('');

  // 检测 git
  outputPanel.appendLine('检测 git 是否存在');
  let [result, output] = await execForResult('git -v');
  if (result && output.includes('git version')) {
    outputPanel.appendLine(`存在 git：${output}`);
  } else {
    outputPanel.appendLine(`不存在 git，请先安装 git！执行返回：`);
    outputPanel.appendLine(output);
    vscode.window.showErrorMessage(`不存在 git，请先安装 git！`);
    return;
  }

  // 检测 nodejs
  outputPanel.appendLine('检测 nodejs 是否存在');
  [result, output] = await execForResult('node -v');
  if (result && output) {
    outputPanel.appendLine(`存在 nodejs：${output}`);
  } else {
    outputPanel.appendLine(`不存在 nodejs，请先安装 nodejs！执行返回：`);
    outputPanel.appendLine(output);
    vscode.window.showErrorMessage(`不存在 nodejs，请先安装 Nodejs！`);
    return;
  }

  // 检测 npm
  outputPanel.appendLine('检测 npm 是否存在');
  [result, output] = await execForResult('npm -v');
  if (result && output) {
    outputPanel.appendLine(`存在 npm：${output}`);
  } else {
    outputPanel.appendLine(`不存在 npm，请先安装 npm！执行返回：`);
    outputPanel.appendLine(output);
    vscode.window.showErrorMessage(`不存在 npm，请先安装 npm！`);
    return;
  }

  // 检测 pnpm
  outputPanel.appendLine('检测 pnpm 是否存在');
  [result, output] = await execForResult('pnpm -v');
  if (result && output) {
    outputPanel.appendLine(`存在 pnpm：${output}`);
  } else {
    outputPanel.appendLine(`不存在 pnpm，尝试安装 pnpm`);
    outputPanel.appendLine(`开始安装pnpm...`);
    [result, output] = await execForResult('npm i pnpm -g');
    if (result) {
      outputPanel.appendLine('安装 pnpm 成功');
    } else {
      outputPanel.appendLine('安装 pnpm 失败，执行返回：');
      outputPanel.appendLine(output);
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
      outputPanel.appendLine(`已选择存放构建仓库的目录: ${uri[0].fsPath}`);
    } else {
      outputPanel.appendLine(`未选择任何目录！`);
      return;
    }
  }

  // 克隆 docs-website 仓库
  if (!fs.existsSync(repoPath)) {
    outputPanel.appendLine('开始克隆 docs-website 仓库...');
    [result, output] = await execForResult(`git clone ${DOCS_WEBSITE_GIT} ${repoPath}`);
    if (result) {
      outputPanel.appendLine('克隆完成');
    } else {
      outputPanel.appendLine('克隆失败，执行返回：');
      outputPanel.appendLine(output);
      return;
    }
  }

  // 检测 repo
  [result, output] = await execForResult(`cd ${repoPath} && git remote -v`);
  if (output.includes(DOCS_WEBSITE_GIT)) {
    outputPanel.appendLine('检测到 docs-website 仓库');
    config.update('repoPath', repoPath, vscode.ConfigurationTarget.Global);
  } else {
    outputPanel.appendLine(`目录下存在docs-website，但并非是仓库，执行返回：`);
    outputPanel.appendLine(output);
    vscode.window.showErrorMessage(`目录下存在docs-website文件夹，但并非是仓库，请手动删除该文件夹`);
    return;
  }

  // 检测目标分支
  outputPanel.appendLine(`检测 ${DOCS_WEBSITE_BRANCH} 分支是否存在`);
  [result, output] = await execForResult(`cd ${repoPath} && git branch --list ${DOCS_WEBSITE_BRANCH}`);
  if (output) {
    outputPanel.appendLine(`分支存在，开始更新 ${DOCS_WEBSITE_BRANCH} 分支内容`);
    [result, output] = await execForResult(`cd ${repoPath} && git reset --hard origin/${DOCS_WEBSITE_BRANCH}`);
    if (result) {
      outputPanel.appendLine(`拉取远程分支 ${DOCS_WEBSITE_BRANCH} 内容成功`);
    } else {
      outputPanel.appendLine(`拉取远程分支 ${DOCS_WEBSITE_BRANCH} 内容失败，执行返回：`);
      outputPanel.appendLine(output);
      return;
    }
  } else {
    outputPanel.appendLine(`本地不存在 ${DOCS_WEBSITE_BRANCH} 分支，开始尝试拉取分支内容`);
    [result, output] = await execForResult(`cd ${repoPath} && git checkout -b ${DOCS_WEBSITE_BRANCH} --track origin/${DOCS_WEBSITE_BRANCH}`);
    if (result) {
      outputPanel.appendLine(`拉取远程分支 ${DOCS_WEBSITE_BRANCH} 内容成功`);
    } else {
      outputPanel.appendLine(`拉取远程分支 ${DOCS_WEBSITE_BRANCH} 内容失败，执行返回：`);
      outputPanel.appendLine(output);
      return;
    }
  }

  // 安装/更新依赖
  outputPanel.appendLine(`开始安装/更新nodejs依赖...`);
  [result, output] = await execForResult(`cd ${repoPath} && pnpm i`);
  if (result) {
    outputPanel.appendLine(`安装/更新nodejs依赖完成`);
  } else {
    outputPanel.appendLine(`安装/更新nodejs依赖失败，执行返回：`);
    outputPanel.appendLine(output);
  }
}

function createVitepressServer() {
  if (serverProcess) {
    if (serverProcess.kill('SIGKILL')) {
      outputPanel.appendLine('尝试终止进程成功');
    } else {
      outputPanel.appendLine('尝试终止进程失败');
    }
  }

  outputPanel.appendLine('启动服务');
  serverProcess = exec(`cd ${repoPath} && pnpm dev`, {
    signal: new AbortController().signal
  });
  serverProcess.stdout?.on('data', (data) => {
    outputPanel.appendLine(stripAnsi(data));
  });

  serverProcess.stderr?.on('data', (data) => {
    outputPanel.appendLine(stripAnsi(data));
  });

  serverProcess.on('close', (code) => {
    outputPanel.appendLine(`exit code: ${code}`);
    serverProcess = null;
  });

  serverProcess.on('error', (error) => {
    outputPanel.appendLine(stripAnsi(error?.message || ''));
  });

}

export async function previewMarkdown() {
  if (!outputPanel) {
    await init();
  }

  await createVitepressServer();
}
