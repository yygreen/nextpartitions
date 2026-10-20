import type { Material, Mounting } from './types'

// Every internal URL comes from here, so the same components work on the live site ('app')
// and in the clickable preview ('static': one page, routes after the #, e.g. '#/area/dallas').
type Mode = 'app' | 'static'
let mode: Mode = 'app'
export const setLinkMode = (m: Mode) => { mode = m }

const CONFIGURATOR = import.meta.env.VITE_CONFIGURATOR_URL ?? 'https://nextpartitions.com/get-a-quote'

export const homeHref = () => (mode === 'app' ? '/' : '#/')
export const serviceAreaHref = () => (mode === 'app' ? '/service-area/' : '#/service-area')
export const stateHref = (state: string) => (mode === 'app' ? `/service-area/${state}/` : `#/state/${state}`)
export const areaHref = (area: string) => (mode === 'app' ? `/service-area/${area}/` : `#/area/${area}`)
export const installerHref = (slug: string) => (mode === 'app' ? `/installers/${slug}/` : `#/installer/${slug}`)
export const applyHref = () => (mode === 'app' ? '/installers/apply/' : '#/apply')
// The portal's sample switches role with ?as=coordinator (app) or its own route (preview).
export const portalHref = (as: 'installer' | 'coordinator' = 'installer') =>
  mode === 'app' ? (as === 'coordinator' ? '/portal/?as=coordinator' : '/portal/') : (as === 'coordinator' ? '#/portal/coordinator' : '#/portal')
export const quoteHref = (token: string) => (mode === 'app' ? `/quote/${token}` : `#/quote/${token}`)

// "Price with Acme" on an area page: same page, configure step, installer pre-selected.
export const priceWithHref = (area: string, slug: string) => `${areaHref(area)}?installer=${slug}#configure`

export interface Selection {
  area?: string
  installer?: string
  material?: Material
  mounting?: Mounting
  stalls?: number
  removeOld?: boolean
  from?: 'directory' | 'profile' | 'hub'
}

// Hand-off to the full configurator, carrying everything chosen so far.
export function configuratorHref(s: Selection = {}): string {
  if (mode === 'static') {
    // The configurator prototype reads "#dfw.acme.hdpe.ob.6".
    const mat: Partial<Record<Material, string>> = { powder_coated: 'pc', hdpe: 'hdpe', phenolic: 'phen', laminate: 'lam' }
    const mnt: Partial<Record<Mounting, string>> = { overhead_braced: 'ob', floor_mounted: 'fm', ceiling_hung: 'ch' }
    const parts = [s.area === 'dallas' ? 'dfw' : '', s.installer ?? '', s.material ? mat[s.material] ?? '' : '',
      s.mounting ? mnt[s.mounting] ?? '' : '', s.stalls ? String(s.stalls) : ''].filter(Boolean)
    return `configurator.html${parts.length ? '#' + parts.join('.') : ''}`
  }
  const url = new URL(CONFIGURATOR)
  const set = (k: string, v: string | number | boolean | undefined) => { if (v !== undefined && v !== false) url.searchParams.set(k, String(v)) }
  set('area', s.area); set('installer', s.installer); set('material', s.material); set('mounting', s.mounting)
  set('stalls', s.stalls); set('remove_old', s.removeOld ? 1 : undefined)
  url.searchParams.set('src', s.from === 'profile' ? 'installer_profile' : s.from === 'hub' ? 'installer_hub' : 'installer_directory')
  return url.toString()
}
