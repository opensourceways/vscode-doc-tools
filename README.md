# Doc Tools

本插件提供文档静态检查、目录生成等工具，希望能提高文档贡献过程中开发体验。

[开发指南](./README_develop.md)

[CHANGELOG](./CHANGELOG.md)

## 静态检查

| 名称                     | 功能                                                                                 | 执行时 机                                                                      | 提示级别 | 提示语                             |
| ------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | -------- | ---------------------------------- |
| Markdown Lint            | Markdown 语法检查                                                                    | md 文件打 开、保存、停止修改 1s 后                                             | warning  | 具体的 markdownlint 规则           |
| Tag Closed Check         | Html 标签闭合检查                                                                    | md 文件打 开、保存、停止修改 1s 后                                             | error    | Unclosed html tag: ${tag}          |
| Link Validity Check      | 链接有效性检查（包含：1. 内链；2. 外链）                                             | md 文件打开、 保存、停止修改 1s 后                                             | warning  | Invalid link: ${link}              |
| Resource Existence Check | 资源是否存在检查（包含：1. 内链；2. 外链）                                           | md 文件打开、保 存、停止修改 1s 后                                             | warning  | Non-existent resource: ${resource} |
| Toc Check                | 目录文件检查（1. 目录中引用的文件需要存在；2. 每一篇 md 文档都需要在目录中进行维护） | \_toc.yaml 打开、保 存、停止修改 1s 后，md 文件打开后会检测是否加入 \_toc.yaml | error    | Non-existent doc in toc: ${doc}    |
| CodeSpell Check          | 单词拼写检查                                                                         | md 文件打 开、保存、停止修改 1s 后                                             | info     | CodeSpell warning: ${code}         |

### 全局配置说明

插件支持以下配置项（可在 VSCode 设置中搜索 `docTools.scope` 或通过 `settings.json` 进行配置）：

- `docTools.scope`
  - 类型：`boolean`
  - 说明：是否检查范围仅限于 `docs/zh` 和 `docs/en` 目录
  - 默认：`false`

#### 全局配置示例

```json
{
  "docTools.scope": false // 启用检查范围仅限于 docs/zh 和 docs/en 目录，默认检查项目全局文档
}
```

### Markdown Lint

基于 `markdownlint` 实现，帮助用户规范 Markdown 文档格式。

![Markdown Lint](src/assets/gif/lint-markdown.gif)

#### 功能介绍

- 自动检测 Markdown 文件中的格式问题，如标题格式、列表缩进、空行等；
- 检查结果以警告（Warning）的形式在编辑器中高亮显示，并可在“问题”面板中查看详细信息；
- 可通过配置项灵活启用或禁用 lint 功能，并支持自定义 lint 规则，满足不同团队或个人的文档规范需求。

#### 使用方法

1.  安装并启用本插件，打开 Markdown 文件（`.md`），插件会自动对文件内容进行 lint 检查；
2.  检查结果会以警告（Warning）的形式显示在编辑器左侧和底部问题面板；
3.  将光标悬停在警告标记上可查看详细的规则说明和建议。

#### 配置说明

插件支持以下配置项（可在 VSCode 设置中搜索 `docTools.markdownlint`或通过`settings.json`进行配置）：

- `docTools.markdownlint`

  - 类型：`boolean`
  - 说明：是否启用 Markdown lint 功能
  - 默认：`true`

- `docTools.markdownlint.config`
  - 类型：`object`
  - 说明：自定义 markdownlint 配置对象。若未设置，则使用插件内置的默认规则

##### 配置示例

```json
{
  "docTools.markdownlint": true, // 是否开启功能
  "docTools.markdownlint.config": {
    "MD013": false, // 禁用行长度限制
    "MD041": true // 启用标题必须为一级标题
  }
}
```

#### 默认规则

插件内置一套 markdownlint 默认规则（见 `config/markdownlint`），可根据实际需求通过配置覆盖。

### Tag Closed Check

检查 Markdown 文件中的 HTML 标签是否正确闭合，帮助用户避免因标签未闭合导致的渲染或语法错误。

![tag closed check](src/assets/gif/check-tag-closed.gif)

#### 功能介绍

- 自动检测 Markdown 文件中的 HTML 标签是否正确闭合，包括未闭合、嵌套错误等问题；
- 支持快速修复功能，帮助用户一键修正标签闭合和转义问题；
- 支持通过配置项灵活启用或禁用该功能。

#### 使用方法

1.  安装并启用本插件，打开 Markdown 文件（`.md`），插件会自动对文件内容进行 了解有效性检查；
2.  检查结果会以错误（Error）的形式在编辑器中高亮显示，并可在“问题”面板中查看详细信息；
3.  将光标悬停在错误标记处，可查看错误详情；
4.  可通过 VSCode 提供的 Quick Fix（快速修复）功能，点击灯泡图标或按下快捷键（通常为 `Cmd+.` 或 `Ctrl+.`），一键修复标签问题。

#### 配置说明

插件支持以下配置项（可在 VSCode 设置中搜索 `docTools.check.tagClosed`或通过`settings.json`进行配置）：

- `docTools.check.tagClosed`
  类型：`boolean`
  说明：是否启用 HTML 标签闭合检查

##### 配置示例

```json
{
  "docTools.check.tagClosed": true
}
```

#### 快速修复说明

- “转义字符替换”：自动将错误的转义标签替换为正确的 HTML 实体或标签；
- “闭合标签”：自动为未闭合的标签补全闭合部分。

### Link Validity Check

该插件用于在 VSCode 中检查 Markdown 文档中的链接有效性，帮助用户及时发现失效或错误的链接，提升文档质量。

![Link Validity Check](src/assets/gif/check-link-validity.gif)

#### 功能介绍

- 自动扫描 Markdown 文档中的所有链接，包括以下三种格式：
  - `[文本](链接)` 形式的标准 Markdown 链接
  - `<http://example.com>` 形式的裸链接
  - `<a href="链接">` 形式的 HTML 链接
- 支持跳过锚点链接（如 `#section`），并自动忽略链接中的锚点部分，仅校验主链接地址；
- 对于无效链接，会在编辑器中以警告（Warning）的形式在编辑器中高亮显示，并在问题面板中给出详细提示；
- 支持通过配置项灵活启用或禁用该功能。

#### 使用方法

1. 安装并启用插件后，打开任意 Markdown 文件（`.md`），插件会自动检测所有链接的有效性；
2. 检查结果会以警告（Warning）的形式显示在编辑器左侧和底部问题面板；
3. 将光标悬停在警告标记处，可查看错误详情。

#### 配置说明

插件支持以下配置项（可在 VSCode 设置中搜索 `docTools.check.linkValidity`或通过`settings.json`进行配置）：

- `docTools.check.linkValidity`
  - 类型：`boolean`
  - 说明：是否启用链接有效性检查
  - 默认：`true`

##### 配置示例

```json
{
  "docTools.check.linkValidity": true
}
```

#### 注意事项

- 插件仅检测链接的格式和可达性，不保证目标内容的正确性；
- 某些私有或受限网络下的链接可能因网络原因被误判为无效；
- 对于本地文件链接，需确保路径正确且文件存在。

### Resource Existence Check

检查 Markdown 文件中的资源链接（如图片、视频等）是否存在，帮助用户及时发现无效或丢失的资源引用。

#### 功能介绍

- 自动检测 Markdown 文件中的图片、视频等资源链接是否有效，包括 Markdown 语法和 HTML 标签（如 `<img>`、`<image>`、`<video>`）中的资源路径；
- 支持多种资源引用方式，全面覆盖常见的资源链接格式；
- 对于无效或不存在的资源链接，会在编辑器中以警告形式提示用户，并在“问题”面板中列出详细信息；
- 支持通过配置项灵活启用或禁用该功能。

#### 使用方法

1. 安装并启用本插件，打开 Markdown 文件（`.md`），插件会自动检查文档中的资源链接有效性；
2. 检查结果会以警告（Warning）的形式在编辑器中高亮显示，并可在“问题”面板中查看详细信息；
3. 将光标悬停在警告标记处，可查看无效资源的具体路径和提示信息。

#### 配置说明

插件支持以下配置项（可在 VSCode 设置中搜索 `docTools.check.resourceExistence` 或通过 `settings.json` 进行配置）：

- `docTools.check.resourceExistence`
  - 类型：`boolean`
  - 说明：是否启用资源存在性检查
  - 默认：`true`

##### 配置示例

```json
{
  "docTools.check.resourceExistence": true
}
```

### Toc Check

检查目录中链接的有效性，同时将爱吃那好每一篇文档是否已被包含在任意上级目录的 `_toc.yaml` 目录结构中，帮助用户及时发现和修正文档目录结构中的问题。

#### 功能介绍

- 自动解析 TOC（目录）YAML 文件，递归收集所有链接（如 `href`、`upstream`），检查每个链接是否有效（即对应的文档是否存在于项目中）；
- 自动检测当前打开的 Markdown 文档是否已被加入到项目的 `_toc.yaml` 目录结构中。

#### 使用方法

1. 安装并启用本插件，打开包含 TOC 的 YAML 文件（如 `toc.yaml`），插件会自动对文件内容进行有效性检查以及该文件是否已被包含在当前目录或任意上级目录的 `_toc.yaml` 文件中；
2. 检查结果会以错误（Error）的形式在编辑器中高亮显示，并可在“问题”面板中查看详细信息，同时，若文档未被目录包含，编辑器右下角会弹出提示信息，提醒用户将该文件加入 `_toc.yaml`；
3. 将光标悬停在错误标记处，可查看错误详情。

#### 配置说明

插件支持以下配置项（可在 VSCode 设置中搜索 `docTools.check.toc` 或通过 `settings.json` 进行配置）：

- `docTools.check.toc`
  - 类型：`boolean`
  - 说明：是否启用 TOC 校验功能
  - 默认：`true`

##### 配置示例

```json
{
  "docTools.check.toc": true
}
```

## 目录生成

### 功能介绍

- 自动生成目录：根据实际存在的 Markdown 文件，自动生成 \_toc.yaml，避免手动维护目录结构；
- 同步标题：自动读取每个 Markdown 文件的一级标题（# ），作为目录项的 label；
- 去除无效项：如果 \_toc.yaml 中的某些 href 指向的文件不存在，会自动移除这些无效项；
- 可通过配置项灵活启用或禁用该功能。

### 使用方法

1.  安装并启用本插件；
2.  右键点击对应目录：选择“生成目录”命令，会在目标目录下自动生成或更新`_toc.yaml`。

### 注意事项

- 只有带有一级标题（# 标题）的 Markdown 文件才会被收录；
