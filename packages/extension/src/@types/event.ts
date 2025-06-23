export enum EVENT_TYPE {
  EVENT_ACTIVE = 'onActive', // 激活插件
  EVENT_RUN_COMMAND = 'onRunCommand', // 执行命令
  EVENT_OPEN_TEXT_DOC = 'onDidOpenTextDocument', // 打开
  EVENT_SAVE_TEXT_DOC = 'onDidSaveTextDocument', // 保存
  EVENT_CHANGE_TEXT_DOC = 'onDidChangeTextDocument', // 内容改变
}
