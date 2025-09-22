import path from 'path';
import fs from 'fs';
import { createRequest, getGitChangedFiles, getMarkdownFilterContent } from 'shared';
import { OutputItemT } from './@types/output';
import { execCheckTocCi } from './ci/check-toc';
import { execMarkdownlintCi } from './ci/markdownlint';
import { execCheckFileNamingConsistencyCi } from './ci/check-file-naming-consistency';
import { execCheckTagClosedCi } from './ci/check-tag-closed';
import { execCheckFileNamingCi } from './ci/check-file-naming';
import { execCheckLinkValidityCi } from './ci/check-link-validity';
import { execCheckResourceExistenceCi } from './ci/check-resource-existence';
import { execCheckCodespellCi } from './ci/check-codespell';
import {
  CODESPELL_CHECK,
  FILE_NAMING_CHECK,
  FILE_NAMING_CONSISTENCY_CHECK,
  LINK_VALIDITY_CHECK,
  MARKDOWNLINT,
  RESOURCE_EXISTENCE_CHECK,
  TAG_CLOSED_CHECK,
  TOC_CHECK,
} from 'checkers';

(async () => {
  // 获取参数
  const [repoPath, checkDirsStr, targetOwnerRepo, targetBranch, detailUrl] = process.argv.slice(2);
  if (!repoPath) {
    console.error('请提供仓库存放路径');
    return;
  }

  // 输出检查目标信息
  const checkDirs = checkDirsStr.trim() ? checkDirsStr.trim().split(',') : ['docs/zh', 'docs/en'];
  console.log(`检查目录: ${checkDirsStr}`);
  console.log(`目标仓库: ${targetOwnerRepo}`);
  console.log(`目标分支: ${targetBranch}`);

  // 获取 ci 检查配置
  let ciConfig: string[] = ['all'];
  try {
    const res = await createRequest('https://gitee.com/Zherphy/docs-ci/raw/master/repo_ci.json', 'get');
    const config = await res.json();
    if (config?.[targetOwnerRepo]) {
      if (Array.isArray(config?.[targetOwnerRepo]?.[targetBranch])) {
        ciConfig = config[targetOwnerRepo][targetBranch];
      } else if (Array.isArray(config?.[targetOwnerRepo]?.global)) {
        ciConfig = config[targetOwnerRepo].global;
      }
    }
  } catch (err: any) {
    console.error('获取 CI 配置失败：', err?.message);
  }

  // 获取可检查项
  const checkItems: Record<string, boolean> = {};
  const allCis = [
    MARKDOWNLINT,
    LINK_VALIDITY_CHECK,
    RESOURCE_EXISTENCE_CHECK,
    CODESPELL_CHECK,
    TAG_CLOSED_CHECK,
    FILE_NAMING_CHECK,
    FILE_NAMING_CONSISTENCY_CHECK,
    TOC_CHECK,
  ];

  allCis.forEach((item) => {
    if (ciConfig?.[0] === 'all' || (Array.isArray(ciConfig) && ciConfig.includes(item))) {
      checkItems[item] = true;
    }
  });

  // 执行检查
  const changed = getGitChangedFiles(repoPath);
  const outputItems: OutputItemT[] = [];
  for (const filePath of changed) {
    if (!checkDirs.some((dir) => filePath.startsWith(dir))) {
      continue;
    }

    try {
      const completeFilePath = path.join(repoPath, filePath);
      const content = fs.readFileSync(completeFilePath, 'utf-8');
      const filterContent = getMarkdownFilterContent(content, {
        disableHtmlComment: true,
        disableCode: true,
      });

      if (completeFilePath.endsWith('.md')) {
        // markdownlint
        if (checkItems[MARKDOWNLINT]) {
          outputItems.push(...(await execMarkdownlintCi(content, filePath)));
        }

        // link validity check
        if (checkItems[LINK_VALIDITY_CHECK]) {
          outputItems.push(...(await execCheckLinkValidityCi(filterContent, repoPath, filePath)));
        }

        // resource existence check
        if (checkItems[RESOURCE_EXISTENCE_CHECK]) {
          outputItems.push(...(await execCheckResourceExistenceCi(filterContent, repoPath, filePath)));
        }

        // codespell check
        if (checkItems[CODESPELL_CHECK]) {
          outputItems.push(...(await execCheckCodespellCi(filterContent, filePath)));
        }

        // tag closed check
        if (checkItems[TAG_CLOSED_CHECK]) {
          outputItems.push(...(await execCheckTagClosedCi(filterContent, filePath)));
        }

        // file naming check
        if (checkItems[FILE_NAMING_CHECK]) {
          outputItems.push(...(await execCheckFileNamingCi(filePath)));
        }

        // file naming consistency check
        if (checkItems[FILE_NAMING_CONSISTENCY_CHECK]) {
          outputItems.push(...(await execCheckFileNamingConsistencyCi(repoPath, filePath)));
        }

        continue;
      }

      // toc check
      if (completeFilePath.endsWith('_toc.yaml')) {
        if (checkItems[TOC_CHECK]) {
          outputItems.push(...(await execCheckTocCi(filterContent, repoPath, filePath)));
        }

        continue;
      }
    } catch (error: any) {
      console.error(`检查文件 ${filePath} 失败：`, error?.message);
      outputItems.push({
        filePath,
        message: '检查异常~',
      });
    }
  }

  // 检查执行结果
  const outputPath = './output.md';
  if (outputItems.length === 0) {
    const outputCheckItemsTable = ['| 检查项 | 检查结果 | 详情 |', '| --- | --- | --- |'];
    Object.keys(checkItems).forEach((item) => {
      outputCheckItemsTable.push(`| ${item} | ✅ 已通过 | [查看详情](${detailUrl}) |`);
    });
    console.log('✅ 门禁检查通过！');
    fs.writeFileSync(outputPath, `✅ 门禁检查通过！\n\n${outputCheckItemsTable.length > 1 ? outputCheckItemsTable.join('\n') : ''}`);
    return;
  }

  const outputErrorsTable = ['| 序号 | 错误详情 |', '| --- | --- |'];
  let tableOversize = false;
  outputItems.forEach((item, index) => {
    if (item.checkType) {
      checkItems[item.checkType] = false;
    }

    if (outputErrorsTable.length < 53) {
      const detail = [
        `[文件路径]：${item.filePath}`,
        item.position ? `[错误位置]：${item.position}` : '',
        item.checkType ? `[检查类型]：${item.checkType}` : '',
        `[错误信息]：${item.message.length > 100 ? item.message.slice(0, 100) + '...' : item.message}`,
        item.content && item.content.trim()
          ? `[错误内容]：${item.content.trim().length > 100 ? item.content.trim().slice(0, 100) + '...' : item.content.trim()}`
          : '',
      ].filter(Boolean);

      outputErrorsTable.push(`| ${index + 1} | ${detail.join('<br>')} |`);
    } else {
      tableOversize = true;
    }
  });

  const outputCheckItemsTable = ['| 检查项 | 检查结果 | 详情 |', '| --- | --- | --- |'];
  Object.keys(checkItems).forEach((item) => {
    outputCheckItemsTable.push(`| ${item} | ${checkItems[item] ? '✅ 已通过' : '❌ 未通过'} | [查看详情](${detailUrl}) |`);
  });

  const output = `❌ 门禁检查未通过！\n\n ${outputCheckItemsTable.join('\n')} \n\n ${
    tableOversize
      ? `💡 本次检查出 ${outputItems.length} 项错误，仅展示前50条，请通过上方表格的 “查看详情” 获取更多信息~`
      : `💡 本次检查出 ${outputItems.length} 项错误，详情内容如下：`
  } \n\n ${outputErrorsTable.join('\n')}`;
  fs.writeFileSync(outputPath, output);
})();
