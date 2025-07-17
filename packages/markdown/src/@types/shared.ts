/**
 * SFC block extracted from markdown
 */
export interface SfcBlock {
  /**
   * The type of the block
   */
  type: string
  /**
   * The content, including open-tag and close-tag
   */
  content: string
  /**
   * The content that stripped open-tag and close-tag off
   */
  contentStripped: string
  /**
   * The open-tag
   */
  tagOpen: string
  /**
   * The close-tag
   */
  tagClose: string
}

export interface MarkdownSfcBlocks {
  /**
   * The `<template>` block
   */
  template: SfcBlock | null
  /**
   * The common `<script>` block
   */
  script: SfcBlock | null
  /**
   * The `<script setup>` block
   */
  scriptSetup: SfcBlock | null
  /**
   * All `<script>` blocks.
   *
   * By default, SFC only allows one `<script>` block and one `<script setup>` block.
   * However, some tools may support different types of `<script>`s, so we keep all of them here.
   */
  scripts: SfcBlock[]
  /**
   * All `<style>` blocks.
   */
  styles: SfcBlock[]
  /**
   * All custom blocks.
   */
  customBlocks: SfcBlock[]
}

export interface Header {
  /**
   * The level of the header
   *
   * `1` to `6` for `<h1>` to `<h6>`
   */
  level: number
  /**
   * The title of the header
   */
  title: string
  /**
   * The slug of the header
   *
   * Typically the `id` attr of the header anchor
   */
  slug: string
  /**
   * Link of the header
   *
   * Typically using `#${slug}` as the anchor hash
   */
  link: string
  /**
   * The children of the header
   */
  children: Header[]
}

// Manually declaring all properties as rollup-plugin-dts
// is unable to merge augmented module declarations
export interface MarkdownEnv {
  /**
   * The raw Markdown content without frontmatter
   */
  content?: string
  /**
   * The excerpt that extracted by `@mdit-vue/plugin-frontmatter`
   *
   * - Would be the rendered HTML when `renderExcerpt` is enabled
   * - Would be the raw Markdown when `renderExcerpt` is disabled
   */
  excerpt?: string
  /**
   * The frontmatter that extracted by `@mdit-vue/plugin-frontmatter`
   */
  frontmatter?: Record<string, unknown>
  /**
   * The headers that extracted by `@mdit-vue/plugin-headers`
   */
  headers?: Header[]
  /**
   * SFC blocks that extracted by `@mdit-vue/plugin-sfc`
   */
  sfcBlocks?: MarkdownSfcBlocks
  /**
   * The title that extracted by `@mdit-vue/plugin-title`
   */
  title?: string
  path: string
  relativePath: string
  cleanUrls: boolean
  links?: string[]
  includes?: string[]
  realPath?: string
  localeIndex?: string
}
