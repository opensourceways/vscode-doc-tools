import { Bridge } from './bridge';

export class ResourceBridge {
  /**
   * 查看源文件
   * @param {string} fsPath 文件路径
   */
  static viewSource(fsPath: string): Promise<void> {
    return Bridge.getInstance().invoke<void>('viewSource', fsPath);
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
