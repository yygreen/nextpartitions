// Page metadata helpers. Sample-data pages are never indexed.
export const SITE = 'https://nextpartitions.com'

export function pageHead(o: { title: string; description: string; path: string; sample: boolean; jsonLd?: object[] }) {
  return {
    meta: [
      { title: o.title },
      { name: 'description', content: o.description },
      { property: 'og:title', content: o.title },
      { property: 'og:description', content: o.description },
      ...(o.sample ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
    ],
    links: [{ rel: 'canonical', href: SITE + o.path }],
    scripts: (o.jsonLd ?? []).map((d) => ({ type: 'application/ld+json', children: JSON.stringify(d) })),
  }
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, n) => ({ '@type': 'ListItem', position: n + 1, name: it.name, item: SITE + it.path })),
  }
}
