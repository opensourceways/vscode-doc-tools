# 开发指南

## 环境准备

1. **Node.js & 包管理器**

   - 推荐 Node.js 20 及以上版本。
   - 使用 [Yarn](https://yarnpkg.com/)进行包管理,需全局安装`Yarn`: `npm i yarn -g`。

2. **依赖安装**

   - 在项目根目录下执行：
     ```sh
     yarn install
     ```

3. **VS Code 插件开发环境**

   - 推荐安装 `dbaeumer.vscode-eslint`、`ms-vscode.extension-test-runner` 等扩展。

## 开发流程

1. **启动开发模式**

   - 运行打包并监听源码变更（自动编译）：
     ```sh
     yarn watch
     ```

2. **调试插件**

   - 在 VS Code 中按 `F5`，会启动一个新的 Extension Host 窗口，加载当前插件。
   - 可以在 `src/extension.ts` 等源码中设置断点进行调试。

3. **代码规范与检查**

   - 使用 ESLint 进行代码规范检查：
     ```sh
     yarn lint
     ```

4. **测试**

   - 测试用例位于 `src/test` 目录。
   - 编译测试代码并运行测试：
     ```sh
     yarn pretest
     yarn test
     ```
   - 也可通过 VS Code 的 Testing 面板运行和调试测试用例。

5. **打包发布**
   - 生产环境打包：
     ```sh
     yarn package
     ```
   - 生成的扩展包在 `dist` 目录下，可用于发布到 VS Code Marketplace。

---

## 其他说明

- 插件主入口为 `src/extension.ts`。
- 功能模块都在 `src/core` 目录下实现。
- 配置项详见 `package.json` 的 `contributes.configuration` 字段。
- 插件支持热重载，修改代码后只需重新编译并刷新 Extension Host 窗口即可生效。

---
