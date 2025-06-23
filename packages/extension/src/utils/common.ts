import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';

import { createHeadRequest } from '@/utils/request';

export function isConfigEnabled(configName: string) {
  return vscode.workspace.getConfiguration(configName).get<boolean>('enable', true);
}

export function isValidLink(link: string, document: vscode.TextDocument) {
  return isAccessibleLink(link.startsWith('http') ? link : path.join(path.dirname(document.uri.fsPath), link));
}

export function isAccessibleLink(link: string) {
  if (link.startsWith('http')) {
    return isAccessibleHttpLink(link);
  } 

  return Promise.resolve(fs.existsSync(link));
}

export const isAccessibleHttpLink = (() => {
  const map = new Map<string, boolean | number>();

  return async (url: string) => {
    try {
      if (typeof map.get(url) === 'boolean') {
        return map.get(url) as boolean;
      }

      const res = await createHeadRequest(url, {
        timeout: 5 * 1000,
      });

      if (res.status === 200) {
        map.set(url, true);
        return true;
      }
    } catch {}

    let record = map.get(url);
    if (typeof record === 'boolean') {
      return record;
    } 
    
    if (record === undefined) {
      record = 0;
    }
    
    record++;
    map.set(url, record >= 3 ? false : record);
    
    return false;
  };
})();
