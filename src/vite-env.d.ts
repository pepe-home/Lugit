/// <reference types="vite-plus/client" />

declare module '*.json' {
  const value: Record<string, any>
  export default value
}
