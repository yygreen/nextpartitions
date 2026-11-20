// Preview build only (vite.preview.config.ts): server functions can't run in a static page, so the two the
// prototype could reach (giving an installer a login, opening real drawings) explain that instead.
export function createServerFn() {
  const builder = {
    validator: () => builder,
    inputValidator: () => builder,
    handler: () => async () => { throw new Error('Not available in the prototype: this runs on the server of the live site.') },
  }
  return builder
}
