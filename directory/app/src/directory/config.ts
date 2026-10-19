// Every "Configure your partitions" button goes to the live configurator, carrying the area
// (and the installer, when the visitor came from a profile) so the quote is routed correctly.
const BASE = import.meta.env.VITE_CONFIGURATOR_URL ?? 'https://nextpartitions.com/get-a-quote'

export function configuratorUrl(opts: { area?: string; installer?: string; from?: 'directory' | 'profile' } = {}): string {
  const url = new URL(BASE)
  if (opts.area) url.searchParams.set('area', opts.area)
  if (opts.installer) url.searchParams.set('installer', opts.installer)
  url.searchParams.set('src', opts.from === 'profile' ? 'installer_profile' : 'installer_directory')
  return url.toString()
}

export const DISCLAIMER =
  "Installers are independent businesses. You hire, schedule and pay them directly. Next Partitions isn't a party to installation agreements and doesn't perform, supervise or guarantee installation work."
