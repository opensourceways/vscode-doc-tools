import { Bridge } from './bridge';

export class ResourceBridge {
  /**
   * 查看源文件
   * @param {string} fsPath 文件路径
   * @param {number} start 选中开始位置
   * @param {number} end 选中结束位置
   */
  static viewSource(fsPath: string, start?: number, end?: number): Promise<void> {
    return Bridge.getInstance().invoke<void>('viewSource', fsPath, start, end);
  }

  /**
   * 在资源管理器中选中
   * @param {string} fsPath 文件路径
   */
  static revealInExplorer(fsPath: string): Promise<void> {
    return Bridge.getInstance().invoke<void>('revealInExplorer', fsPath);
  }

  /**
   * 文件/目录重命名
   * @param {string} fsPath 文件路径
   */
  static renameFilenameOrDirname(oldPath: string, newPath: string): Promise<boolean> {
    return Bridge.getInstance().invoke<boolean>('renameFilenameOrDirname', oldPath, newPath);
  }
}
