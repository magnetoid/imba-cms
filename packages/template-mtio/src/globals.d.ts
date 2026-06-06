// Re-declare the Vite `?raw` SQL import so this package's `tsc --noEmit`
// resolves the cross-package import into @imba/core (see template-cinema).
declare module '*.sql?raw' {
  const content: string
  export default content
}
