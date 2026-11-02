// The 50 states and DC, each with a hub at /service-area/<slug>/. City pages share that URL space
// (/service-area/<city>/, the live site's pattern), so a state slug must never equal a city slug:
// New York state is 'new-york-state' because 'new-york' is the New York City page.
export interface UsState { slug: string; code: string; name: string }

export const STATES: UsState[] = [
  ['alabama', 'AL', 'Alabama'], ['alaska', 'AK', 'Alaska'], ['arizona', 'AZ', 'Arizona'], ['arkansas', 'AR', 'Arkansas'],
  ['california', 'CA', 'California'], ['colorado', 'CO', 'Colorado'], ['connecticut', 'CT', 'Connecticut'],
  ['delaware', 'DE', 'Delaware'], ['district-of-columbia', 'DC', 'District of Columbia'], ['florida', 'FL', 'Florida'],
  ['georgia', 'GA', 'Georgia'], ['hawaii', 'HI', 'Hawaii'], ['idaho', 'ID', 'Idaho'], ['illinois', 'IL', 'Illinois'],
  ['indiana', 'IN', 'Indiana'], ['iowa', 'IA', 'Iowa'], ['kansas', 'KS', 'Kansas'], ['kentucky', 'KY', 'Kentucky'],
  ['louisiana', 'LA', 'Louisiana'], ['maine', 'ME', 'Maine'], ['maryland', 'MD', 'Maryland'],
  ['massachusetts', 'MA', 'Massachusetts'], ['michigan', 'MI', 'Michigan'], ['minnesota', 'MN', 'Minnesota'],
  ['mississippi', 'MS', 'Mississippi'], ['missouri', 'MO', 'Missouri'], ['montana', 'MT', 'Montana'],
  ['nebraska', 'NE', 'Nebraska'], ['nevada', 'NV', 'Nevada'], ['new-hampshire', 'NH', 'New Hampshire'],
  ['new-jersey', 'NJ', 'New Jersey'], ['new-mexico', 'NM', 'New Mexico'], ['new-york-state', 'NY', 'New York'],
  ['north-carolina', 'NC', 'North Carolina'], ['north-dakota', 'ND', 'North Dakota'], ['ohio', 'OH', 'Ohio'],
  ['oklahoma', 'OK', 'Oklahoma'], ['oregon', 'OR', 'Oregon'], ['pennsylvania', 'PA', 'Pennsylvania'],
  ['rhode-island', 'RI', 'Rhode Island'], ['south-carolina', 'SC', 'South Carolina'], ['south-dakota', 'SD', 'South Dakota'],
  ['tennessee', 'TN', 'Tennessee'], ['texas', 'TX', 'Texas'], ['utah', 'UT', 'Utah'], ['vermont', 'VT', 'Vermont'],
  ['virginia', 'VA', 'Virginia'], ['washington', 'WA', 'Washington'], ['west-virginia', 'WV', 'West Virginia'],
  ['wisconsin', 'WI', 'Wisconsin'], ['wyoming', 'WY', 'Wyoming'],
].map(([slug, code, name]) => ({ slug, code, name }))

const BY_SLUG = new Map(STATES.map((s) => [s.slug, s]))
export const stateBySlug = (slug: string) => BY_SLUG.get(slug) ?? null
export const isStateSlug = (slug: string) => BY_SLUG.has(slug)
export const stateName = (slug: string, fallback = slug) => BY_SLUG.get(slug)?.name ?? fallback
