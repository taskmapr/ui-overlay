/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AGENT_ENDPOINT?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_AGENT_API_TOKEN?: string;
  readonly VITE_AGENT_FRAMEWORK?: string;
  readonly VITE_AGENT_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
