# Rules for every research agent on the city buy pages

nextpartitions.com sells commercial toilet partitions nationwide (it supplies partitions and shop drawings; it does
not install). Each "Bathroom Partitions in [City]" page carries local facts a buyer can use. You research those facts
and write them down twice: as evidence (the exact quote and the URL you read it on) and as page text in everyday
language.

## Research

- Read every fact on the page you cite. Never fill a number, rate, section or rule from memory. If you can't read
  it, set it to null, say why, and name who to ask (`to_confirm`). A gap is fine; a guess is not.
- Official sources first: the city's or state's own site, the legislature's statute site, the state code council,
  the revenue agency, sam.gov, bls.gov. When an official site blocks you, a reliable secondary copy is acceptable
  (UpCodes up.codes for codes, law.cornell.edu or casetext for regulations): say so and mark that item `medium`.
- Tools: WebFetch and WebSearch (load with ToolSearch "select:WebSearch,WebFetch"; if WebFetch isn't offered, use
  curl -L -A "Mozilla/5.0"). For PDFs: curl into a new empty folder under your scratchpad, then `pdftotext -layout`.
  **WebSearch is rationed: at most 12 searches in total.** Prefer fetching known URLs directly (the files you are
  given list many) and following links from official pages.
- Research only: no sign-ins, no forms, no contact with anyone. Don't run git. Write only the one JSON file named
  in your task.
- Today is 2026-11-24; use it as `checked`.

## Page text (the `page` block)

Written for a facility manager or contractor, not a code official.

- Everyday language: say what a rule means for the buyer ("a restroom with stalls needs at least one stall a
  wheelchair user can enter"), never the code's formal name, edition or section number. Formal names go only in
  `sources` and `official_names`.
- State only what the source says, and only from official sources or reliable copies of them. Something known
  only from a news report, a bill not yet law or a vote not yet certified stays out of page text: put it in `notes`.
- State only what the source says. No advice, no opinion, no commentary on laws; state them neutrally.
- Short, plain sentences. No dashes used as punctuation (use commas, colons or full stops). No sentence that
  announces what the text will do ("below we cover…"). No "last checked" dates in page text.
- Never imply that a permit or licence is needed to **buy** partitions.
- No prices for partitions and no delivery times.
- Next Partitions "supplies" partitions; the request is a "quote", never an "order" or "checkout".
- Where the source leaves a question open, say so and name the office to ask ("ask the Houston Permitting Center
  whether your replacement needs one").
- Each `sources` entry is one markdown bullet: what it supports, then the link(s) with the official document name,
  ending "Checked 2026-11-24." Formal code names belong here.

The Houston page is the model for tone and length: /home/user/nextpartitions/site-content/pages/service-area_houston.md
