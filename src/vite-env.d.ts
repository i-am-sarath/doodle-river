/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PLATFORM?: 'local' | 'poki' | 'crazygames' | 'gamedistribution' | 'mobile';
  readonly VITE_GD_GAME_ID?: string;
  readonly VITE_ADMOB_TESTING?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }
