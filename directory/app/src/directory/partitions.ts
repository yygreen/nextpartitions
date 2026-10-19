import type { Material, Mounting } from './types'

// SAMPLE partitions prices per stall, matching the configurator prototype. On the live site the
// configurator's own pricing replaces this (the "from" price shown here must come from the same source).
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

export function partitionsPriceCents(material: Material, mounting: Mounting, stalls: number): number {
  return stalls * (PER_STALL_CENTS[material] + MOUNTING_ADD_CENTS[mounting])
}
