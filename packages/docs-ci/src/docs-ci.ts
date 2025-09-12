import path from 'path';
import fs from 'fs';
import { getGitChangedFiles, getMarkdownFilterContent } from 'shared';
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
  const [repoPath, checkDirsStr, targetOwnerRepo, targetBranch, detailUrl] = process.argv.slice(2);
  if (!repoPath) {
    console.error('请提供仓库存放路径');
    return;
  }

  const checkDirs = checkDirsStr.trim() ? checkDirsStr.trim().split(',') : ['docs/zh', 'docs/en'];
  console.log(`检查目录: ${checkDirsStr}`);
  console.log(`目标仓库: ${targetOwnerRepo}`);
  console.log(`目标分支: ${targetBranch}`);

  const changed = getGitChangedFiles(repoPath);
  const outputItems: OutputItemT[] = [];
  for (const filePath of changed) {
    if (!checkDirs.some((dir) => filePath.startsWith(dir))) {
      continue;
    }

    try {
      const completeFilePath = path.join(repoPath, filePath);
      const content = getMarkdownFilterContent(fs.readFileSync(completeFilePath, 'utf-8'), {
        disableHtmlComment: true,
        disableCode: true,
      });

      if (completeFilePath.endsWith('.md')) {
        // markdownlint
        outputItems.push(...(await execMarkdownlintCi(content, filePath)));
        // link validity check
        outputItems.push(...(await execCheckLinkValidityCi(content, repoPath, filePath)));
        // resource existence check
        outputItems.push(...(await execCheckResourceExistenceCi(content, repoPath, filePath)));
        if (targetOwnerRepo === 'openeuler/docs-centralized') {
          continue;
        }

        // codespell check
        outputItems.push(...(await execCheckCodespellCi(content, filePath)));
        // tag closed check
        outputItems.push(...(await execCheckTagClosedCi(content, filePath)));
        // file naming check
        outputItems.push(...(await execCheckFileNamingCi(completeFilePath)));
        // file naming consistency check
        outputItems.push(...(await execCheckFileNamingConsistencyCi(completeFilePath)));
        continue;
      }

      // toc check
      if (completeFilePath.endsWith('_toc.yaml') && targetOwnerRepo !== 'openeuler/docs-centralized') {
        outputItems.push(...(await execCheckTocCi(content, repoPath, filePath)));
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
  const checkItems: Record<string, boolean> = {
    [MARKDOWNLINT]: true,
    [LINK_VALIDITY_CHECK]: true,
    [RESOURCE_EXISTENCE_CHECK]: true,
  };

  if (targetOwnerRepo !== 'openeuler/docs-centralized') {
    checkItems[CODESPELL_CHECK] = true;
    checkItems[TAG_CLOSED_CHECK] = true;
    checkItems[FILE_NAMING_CHECK] = true;
    checkItems[FILE_NAMING_CONSISTENCY_CHECK] = true;
    checkItems[TOC_CHECK] = true;
  }

  if (outputItems.length === 0) {
    const outputCheckItemsTable = ['| 检查项 | 检查结果 | 详情 |', '| --- | --- | --- |'];
    Object.keys(checkItems).forEach((item) => {
      outputCheckItemsTable.push(`| ${item} | ${checkItems[item] ? '✅ 已通过' : '❌ 未通过'} | [查看详情](${detailUrl}) |`);
    });
    console.log('✅ 门禁检查通过！');
    fs.writeFileSync(outputPath, `✅ 门禁检查通过！\n\n${outputCheckItemsTable.join('\n')}`);
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
