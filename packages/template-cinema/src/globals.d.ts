// When tsc type-checks this package it follows imports into @imba/core, which
// uses Vite's `?raw` suffix to inline SQL. core declares this module for its own
// build, but that ambient declaration is scoped to core's `include`. Re-declare
// it here so template-cinema's `tsc --noEmit` resolves the cross-package import.
declare module '*.sql?raw' {
  const content: string
  export default content
}
