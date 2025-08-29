import { lint } from 'markdownlint/async';
import { type LintError, type Configuration, type LintResults } from 'markdownlint';

import { ResultT } from '../@types/result';
import { MD_DESC } from '../config/markdownlint';

export const MARKDOWNLINT = 'markdownlint';

/**
 * 转换 markdownlint 执行结果
 * @param {string} content 内容
 * @param {LintResults} lintResults markdownlint 执行结果
 * @returns {ResultT<string>[]} 返回检查结果
 */
function parseLintResults(content: string, lintResults: LintResults) {
  const results: ResultT<string>[] = [];
  const lines = content.split('\n');

  // 遍历每个文件的结果
  Object.keys(lintResults).forEach((file) => {
    const fileResults = lintResults[file];

    // 遍历每个问题
    fileResults.forEach((issue) => {
      let start = 0;
      for (let i = 0; i < issue.lineNumber - 1; i++) {
        start += lines[i].length + 1;
      }

      const enMsg = `${issue.ruleDescription}${issue.errorDetail ? `. ${issue.errorDetail}` : ''}`;
      let zhMsg = MD_DESC[issue.ruleNames[0]];
      if (typeof issue.errorDetail === 'string' && typeof zhMsg === 'string') {
        const zhDetail = issue.errorDetail.replace('Expected: ', '期望：').replace('; Actual: ', '；当前：');
        zhMsg = zhMsg.replace('{expected_actual}', zhDetail);
      }

      results.push({
        name: MARKDOWNLINT,
        type: 'warning',
        content: lines[issue.lineNumber - 1],
        start,
        end: start + lines[issue.lineNumber - 1].length,
        extras: issue.ruleNames.join(',') + (issue.fixInfo ? ',fixable' : ''),
        message: {
          zh: zhMsg || enMsg,
          en: enMsg,
        },
      });
    });
  });

  return results;
}

/**
 * 执行 markdownlint
 * @param {string} content 内容
 * @param {Configuration} config markdownlint 配置
 * @returns {Promise<[ResultT<string>[], LintError[]]>} 返回检查结果
 */
export function execMarkdownlint(content: string, config: Configuration): Promise<[ResultT<string>[], LintError[]]> {
  return new Promise((resolve) => {
    lint(
      {
        strings: { content },
        config,
      },
      (err, result) => {
        if (err) {
          resolve([[], []]);
        } else if (result) {
          resolve([parseLintResults(content, result), result.content]);
        }
      }
    );
  });
}
