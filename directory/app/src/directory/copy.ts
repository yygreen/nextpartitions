// Intro paragraph and search description for each city installer page. Every version names the city; a city
// always gets the same version (picked from its slug), and neighbouring pages get different ones, so the 99
// area pages don't all open with the same sentence. Business rules hold in every version: installation is
// arranged through us for partitions bought from Next Partitions, and the configurator is a quote, not an order.
import type { Area } from './types'

// Small stable hash of the slug, so the choice never changes between builds or visits.
function pick<T>(slug: string, options: T[]): T {
  let h = 0
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return options[h % options.length]
}

// Up to two nearby cities other than the area's own, for versions that mention them.
function neighbours(a: Area): [string, string] | null {
  const others = a.cities.filter((c) => c !== a.name && c !== a.shortName)
  return others.length >= 2 ? [others[0], others[1]] : null
}

export function areaLead(a: Area): string {
  const n = a.name
  const near = neighbours(a)
  const leads: string[] = [
    `Checked local installers in ${n} for commercial toilet partitions you buy from Next Partitions. Price your partitions and installation in one place, then choose your installer.`,
    `Need toilet partitions installed in ${n}? Configure your restroom, see the price for partitions plus an installation estimate, and choose from verified local installers.`,
    `Planning a restroom in ${n}? Price your commercial partitions in about 2 minutes and have them installed by checked local installers, arranged through us.`,
    `Commercial toilet partitions for ${n} projects: buy them from Next Partitions and have them installed by verified local installers, with one quote for both.`,
  ]
  if (near) {
    leads.push(
      `Verified installers across ${n}, including ${near[0]} and ${near[1]}, install the toilet partitions you buy from Next Partitions. One quote covers the partitions and an installation estimate.`,
      `From ${near[0]} to ${near[1]}, checked installers put in the partitions you buy from Next Partitions across the ${n} area. Price both in one place, then choose your installer.`,
    )
  }
  return pick(a.slug, leads)
}

export function areaDescription(a: Area): string {
  const n = a.name
  return pick(a.slug, [
    `Checked, insured installers in ${n} for commercial toilet partitions bought from Next Partitions. Price partitions and installation in one place.`,
    `Toilet partition installation in ${n}: verified local installers for partitions you buy from Next Partitions, priced together in about 2 minutes.`,
    `Find verified bathroom partition installers in ${n}. Configure your restroom, get a partitions price plus an installation estimate, then choose your installer.`,
    `Commercial restroom partitions installed in ${n} by checked local installers. One quote from Next Partitions covers the partitions and installation.`,
  ])
}
