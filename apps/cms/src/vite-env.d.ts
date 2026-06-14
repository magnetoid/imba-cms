/// <reference types="vite/client" />

declare module '*.sql?raw' {
  const value: string
  export default value
}
