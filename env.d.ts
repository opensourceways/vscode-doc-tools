declare module 'cspell-lib' {
  export interface Document {
    uri: string;
    text: string;
    languageId: string;
    locale: string;
  }

  export interface SpellCheckFileOptions {
    generateSuggestions: boolean;
    noConfigSearch?: boolean;
  }

  export interface CSpellUserSettings {
    words: string[];
    suggestionsTimeout: number;
    ignoreRegExpList: string[];
  }

  export interface SpellCheckFileResult {
    issues: Issue[];
  }

  export interface Issue {
    text: string;
    offset: number;
    suggestions: string[];
  }

  export declare function spellCheckDocument(
    document: Document,
    options: SpellCheckFileOptions,
    settingsOrConfigFile: CSpellUserSettings
  ): Promise<SpellCheckFileResult>;
}
