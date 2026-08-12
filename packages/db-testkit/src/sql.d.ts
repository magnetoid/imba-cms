// The plugins import their migrations as `?raw` strings. Each plugin declares
// this ambiently in its own src/, but those declarations are not visible when
// typechecking from here, so redeclare it.
declare module '*.sql?raw' {
  const value: string
  export default value
}
