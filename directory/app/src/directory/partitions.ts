import type { Material, Mounting } from './types'

// SAMPLE partitions prices, matching the configurator and customer-quote prototypes. On the live site the
// configurator's own pricing replaces these (the range shown here must come from the same source).
const PER_STALL_CENTS: Record<Material, number> = {
  powder_coated: 47000,
  hdpe: 73500,
  phenolic: 121000,
  laminate: 59000,
  stainless: 165000,
}
const MOUNTING_ADD_CENTS: Record<Mounting, number> = {
  overhead_braced: 0,
  floor_mounted: 2500,
  ceiling_hung: 6000,
  floor_to_ceiling: 9000,
}
const ADA_UPGRADE_CENTS = 22000        // one accessible stall instead of a standard one
const URINAL_SCREEN_CENTS = 18500      // each
const EXTRA_PRIVACY_PER_STALL_CENTS = 4500

export interface PartitionsChoice {
  material: Material
  mounting: Mounting
  stalls: number
  ada: boolean
  urinalScreens: number
  privacy: 'standard' | 'extra'
}

// A range, not a price: stall widths and heights, colors and hardware aren't chosen yet, and they move the
// price by roughly -10% to +20% of the per-stall base. Rounded to $10 so it doesn't look more exact than it is.
export function partitionsRangeCents(c: PartitionsChoice): { lowCents: number; highCents: number } {
  const base = c.stalls * (PER_STALL_CENTS[c.material] + MOUNTING_ADD_CENTS[c.mounting])
  const fixed = (c.ada ? ADA_UPGRADE_CENTS : 0) + c.urinalScreens * URINAL_SCREEN_CENTS
    + (c.privacy === 'extra' ? c.stalls * EXTRA_PRIVACY_PER_STALL_CENTS : 0)
  const round = (n: number) => Math.round(n / 1000) * 1000
  return { lowCents: round(base * 0.9 + fixed), highCents: round(base * 1.2 + fixed) }
}
