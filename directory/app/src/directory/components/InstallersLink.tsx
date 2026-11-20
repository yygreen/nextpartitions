// For the main site's /service-area/[city]/ buy pages: a small "Installers in Houston" text link, shown only once
// that city's installer page is published (getInstallersLink returns null until then). Not in nav or footer.
export function InstallersLink({ link }: { link: { href: string; label: string } | null }) {
  if (!link) return null
  return <a href={link.href} className="text-sm font-semibold text-brand-red hover:underline">{link.label}</a>
}
