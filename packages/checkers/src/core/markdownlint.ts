import { lint } from 'markdownlint/async';
import { type LintError, type Configuration, type LintResults } from 'markdownlint';

import { CheckResultT } from '../@types/result';
import { MD_DESC } from '../config/markdownlint';

/**
 * 转换 markdownlint 执行结果
 * @param {string} content 内容
 * @param {LintResults} lintResults markdownlint 执行结果
 * @returns {CheckResultT<string>[]} 返回检查结果
 */
function parseLintResults(content: string, lintResults: LintResults) {
  const results: CheckResultT<string>[] = [];
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

      let message = `${issue.ruleDescription}${issue.errorDetail ? `. ${issue.errorDetail}` : ''}${
        MD_DESC[issue.ruleNames[0]] ? `\n${MD_DESC[issue.ruleNames[0]]}` : ''
      }`;

      if (typeof issue.errorDetail === 'string' && typeof MD_DESC[issue.ruleNames[0]] === 'string') {
        const zhDetail = issue.errorDetail.replace('Expected: ', '期望：').replace('; Actual: ', '；当前：');
        message = message.replace('{expected_actual}', zhDetail);
      }

      results.push({
        content: lines[issue.lineNumber - 1],
        message,
        start,
        end: start + lines[issue.lineNumber - 1].length,
        extras: issue.ruleNames.join(',') + (issue.fixInfo ? ',fixable' : ''),
      });
    });
  });

  return results;
}

/**
 * 执行 markdownlint
 * @param {string} content 内容
 * @param {Configuration} config markdownlint 配置
 * @returns {Promise<[CheckResultT<string>[], LintError[]]>} 返回检查结果
 */
export function execMarkdownlint(content: string, config: Configuration): Promise<[CheckResultT<string>[], LintError[]]> {
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
