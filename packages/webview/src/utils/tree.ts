import type { DocMenuT } from '@/@types/type-doc-menu';

export interface DocMenuNodeT {
  id: string;
  label: string;
  depth: number;
  href?: string;
  parent: DocMenuNodeT | null;
  description: string | null;
  type: string;
  isManual: boolean;
  upstream: string;
  path: string;
  children: Array<DocMenuNodeT>;
}

export class DocMenuTree {
  root: DocMenuNodeT;
  constructor(data: Array<DocMenuT>, base: string = '/') {
    this.root = {
      id: '',
      label: '',
      depth: 0,
      href: base,
      description: null,
      parent: null,
      type: 'root',
      isManual: false,
      upstream: '',
      path: '',
      children: [],
    };

    this.buildTree(this.root, data);
  }

  /**
   * 迭代构造树
   * @param {DocMenuNodeT} parent 父节点
   * @param {Array<DocMenuT>} data 数据
   */
  buildTree(parent: DocMenuNodeT, data: Array<DocMenuT>) {
    for (let i = 0, len = data.length; i < len; i++) {
      const curDepth = parent.depth + 1;
      const info = data[i];
      const node: DocMenuNodeT = {
        id: info.id,
        label: info.label,
        depth: curDepth,
        href: info.href,
        parent,
        description: info.description || null,
        type: info.type || '',
        isManual: info.isManual || false,
        upstream: info.upstream || '',
        path: info.path || '',
        children: [],
      };

      parent.children.push(node);

      if (info.sections && info.sections.length) {
        this.buildTree(node, info.sections);
      }
    }
  }

  /**
   * BFS 广度优先查找第一个符合的节点
   * @param {DocMenuNodeT} node 父节点
   * @param {string} key key
   * @param {string} val value
   * @returns {(DocMenuNodeT|null)} 查找到节点则返回该节点，未找到返回 null
   */
  getNode(node: DocMenuNodeT, key: keyof DocMenuNodeT, val: any): DocMenuNodeT | null {
    if (node[key] === val) {
      return node;
    }

    const children: Array<DocMenuNodeT> = node.children;
    for (let i = 0, len = children.length; i < len; i++) {
      const rlt = this.getNode(children[i], key, val);
      if (rlt) {
        return rlt;
      }
    }

    return null;
  }

  /**
   * 获取前驱节点（不包含目标节点）
   * @param {DocMenuNodeT} node 节点
   * @param {number} stopDepth 停止深度，到达此深度后不再往上收集。默认为0，即根节点。
   * @returns {DocMenuNodeT[]} 返回前驱节点
   */
  getPrevNodes(node: DocMenuNodeT, stopDepth = 0) {
    if (!node || stopDepth < 0 || node.depth <= stopDepth) {
      return [];
    }

    const nodes = [];
    let prev = node.parent;
    while (prev && prev.depth >= stopDepth) {
      nodes.push(prev);
      prev = prev.parent;
    }

    return nodes;
  }
}

export function getNodeHrefSafely(node: DocMenuNodeT): string {
  if (node.href && (node.href.includes('.html') || node.href.startsWith('http'))) {
    return node.href;
  }

  for (const child of node.children) {
    const href = getNodeHrefSafely(child);
    if (href) {
      return href;
    }
  }

  return '';
}
