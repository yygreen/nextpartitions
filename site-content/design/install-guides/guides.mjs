// The four installation overview guides, one per mounting style. Step order and advice are the consensus of 25
// installation documents from 7 manufacturers (research/install-guides/consensus.md), written in our own words: no
// manufacturer text, drawings or figures. Each step has one or more shots (shot.js: installed parts, this step's parts
// in orange, camera). Build: node render-shots.mjs && node build.mjs. Wording goes to the lawyer before it is shared.
const RUN = 168.5, MID = RUN / 2
const CAM = {
  overview: [[MID + 30, 64, 290], [MID, 50, -14], 40],
  room: [[MID + 10, 86, 270], [MID, 0, -24], 40],
  panels: [[RUN + 20, 175, 125], [MID - 6, 8, -36], 40],
  floor: [[RUN * 0.66, 48, 178], [RUN * 0.6, 22, -4], 40],
  top: [[RUN * 0.66, 50, 178], [RUN * 0.6, 78, -4], 40],
  rail: [[RUN * 0.28, 64, 205], [MID, 76, -10], 40],
  above: [[MID + 10, 46, 215], [MID, 100, -14], 46],
  door: [[RUN * 0.34, 58, 150], [RUN * 0.22, 44, -2], 40],
}
export const NAMES = { 'overhead-braced': 'Overhead braced', 'floor-mounted': 'Floor mounted', 'ceiling-hung': 'Ceiling hung', 'floor-to-ceiling': 'Floor to ceiling' }

export const COMMON = {
  notice: 'This overview shows the general order in which these partitions go together. It is not installation instructions. Install to the manufacturer\'s instructions supplied with the order and to the approved shop drawings; where they differ from this overview, they win.',
  safety: [
    'Wear proper protective equipment, and check the site for hazards before starting.',
    'Panels, doors and pilasters are heavy. Handle them with two people and hold them on solid temporary supports until they are fastened.',
    'Don\'t fasten into a wall or ceiling until the backing or structure behind it is confirmed. If it isn\'t there, stop and tell the general contractor.',
    'Before handover, check that every latch can be opened from outside in an emergency.',
  ],
  disclaimer: 'Installers are independent businesses. You hire, schedule and pay them directly. Next Partitions isn\'t a party to installation agreements and doesn\'t perform, supervise or guarantee installation work. Local code compliance rests with the installer and the building owner.',
  images: 'Images are simplified 3D illustrations of a sample four-stall layout, not of any one manufacturer\'s product. Parts and hardware vary by manufacturer and material.',
  before: [
    'Read the manufacturer\'s instructions and the approved shop drawings from start to finish before drilling anything.',
    'Measure the room, wall to wall and floor to ceiling, and compare it with the drawings.',
    'Unpack and count every part. Report freight damage straight away, and don\'t start with parts missing.',
    'Floor, walls and ceiling should be finished, clean and free of debris and sticking-out fasteners.',
    'Store panels and doors flat, not leaning, and leave the protective film on until the end.',
    'Solid plastic (HDPE) needs time to adjust to the room\'s temperature. Install it in a climate-controlled space, out of direct sun.',
  ],
  after: [
    'Peel off the protective film and clean with mild soap and water only. Acid, tile cleaners and abrasives damage the finish; let the other trades on site know.',
    'Leave the manufacturer\'s care and warranty information with the building owner.',
    'Keep the spare hardware and the keys or tools for the latches with the owner.',
  ],
}

// shots: show = parts installed, hi = this step's parts (orange)
const OB = ['pilaster', 'shoe'], FM = ['pilaster', 'shoe'], CH = ['steel', 'rod', 'pilaster'], FTC = ['pilaster', 'shoe', 'cshoe']
export const GUIDES = {
  'overhead-braced': {
    intro: 'Pilasters stand on the floor, and an aluminum headrail across their tops ties them to the walls. It is the most common mounting style and needs nothing above the ceiling.',
    before: ['Solid backing has to be in the walls wherever a bracket or the headrail is fastened. It goes in before the walls are finished, by others; the partition maker doesn\'t supply it.', 'Floors usually slope to a drain. Take heights from the highest point of the floor so every pilaster can be set to the same level.'],
    steps: [
      { title: 'Check the room against the drawings', text: 'Confirm the room size, the toilet positions and the wall backing match the shop drawings, and that the floor is finished and clean.', shots: [{ show: [], cam: CAM.room }] },
      { title: 'Lay out the stalls', text: 'Mark the pilaster line across the front and each dividing panel line back to the wall, straight and square, from the drawings.', shots: [{ show: [], marks: true, cam: CAM.room }] },
      { title: 'Put up the wall brackets and panels', text: 'Fasten the wall brackets into the backing, using each bracket as a drilling guide. Set the dividing panels into them on temporary supports at the right height, but don\'t tighten anything yet.', shots: [{ show: ['panel'], hi: ['panel'], noCeiling: true, cam: CAM.panels }] },
      { title: 'Stand the pilasters', text: 'Fix the floor hardware loosely at each marked position. Slide the shoe onto the pilaster and hold it up out of the way, then stand the pilaster on its leveling hardware and connect it to the panel.', shots: [{ show: [...OB, 'panel'], hi: ['pilaster'], cam: CAM.overview }] },
      { title: 'Plumb, level, then tighten', text: 'Adjust each pilaster until it is plumb both ways and its top is level with the others, with the leveling hardware, never by forcing a panel. Set every door opening to the drawings, square and plumb, and only then tighten the brackets and floor fixings.', shots: [{ show: [...OB, 'panel'], cam: CAM.top }] },
      { title: 'Fit the headrail', text: 'Run the headrail across the pilaster tops and fasten it to every pilaster and to the walls at both ends. It is what keeps the run straight and stiff, so every fastening counts.', shots: [{ show: [...OB, 'panel', 'rail'], hi: ['rail'], cam: CAM.rail }] },
      { title: 'Seat the shoes', text: 'Lower each shoe over the pilaster base so it sits on the floor and covers the leveling hardware, and secure it.', shots: [{ show: [...OB, 'panel', 'rail'], hi: ['shoe'], cam: CAM.floor }] },
      { title: 'Hang the doors', text: 'With the pilasters and headrail fixed, hang each door on its hinges. Adjust it until the gaps are even, it swings freely and the latch meets its keeper. Set each door\'s resting position; the accessible stall\'s door closes on its own.', shots: [{ show: [...OB, 'panel', 'rail', 'door'], hi: ['door'], cam: CAM.door }] },
      { title: 'Check the finished run', text: 'Check every pilaster is still plumb and every fastening is tight, then open and close each door and test each latch, including opening it from outside. Fit any accessories the drawings show.', shots: [{ show: [...OB, 'panel', 'rail', 'door', 'grab'], cam: CAM.overview }] },
    ],
  },
  'floor-mounted': {
    intro: 'Each pilaster is anchored into the floor and nothing ties the tops together, so the space above the stalls stays open. The floor anchoring carries the whole load.',
    before: ['The floor has to be sound structural concrete. Confirm what is in the slab before drilling: heating pipes, conduit or post-tension cables change where anchors can go.', 'Solid backing has to be in the walls wherever a bracket is fastened. It goes in before the walls are finished, by others.', 'Floors usually slope to a drain. Take heights from the highest point of the floor so every pilaster can be set to the same level.'],
    safety: ['Without a headrail, a pilaster is only as steady as its floor anchors. Use the anchors the manufacturer specifies for the floor you have.'],
    steps: [
      { title: 'Check the room and the floor', text: 'Confirm the room size, the toilet positions and the wall backing match the shop drawings, and that the concrete floor is sound, finished and clean.', shots: [{ show: [], cam: CAM.room }] },
      { title: 'Lay out the stalls', text: 'Mark the pilaster line across the front, each pilaster\'s anchor positions and each dividing panel line back to the wall, from the drawings.', shots: [{ show: [], marks: true, cam: CAM.room }] },
      { title: 'Set the floor anchors', text: 'Drill and set the anchors at each pilaster position, with the leveling hardware on them. Set the leveling hardware so all the pilaster tops will end up level with one another.', shots: [{ show: [], marks: true, cam: CAM.floor }] },
      { title: 'Put up the wall brackets and panels', text: 'Fasten the wall brackets into the backing and set the dividing panels into them on temporary supports at the right height, without tightening.', shots: [{ show: ['panel'], hi: ['panel'], noCeiling: true, cam: CAM.panels }] },
      { title: 'Lower the pilasters onto the anchors', text: 'Slide the shoe onto each pilaster and hold it up, then lower the pilaster onto its anchors and connect it to the panel.', shots: [{ show: [...FM, 'panel'], hi: ['pilaster'], cam: CAM.overview }] },
      { title: 'Plumb, level, then tighten', text: 'Bring each pilaster plumb both ways and level with the others, set every door opening to the drawings, then tighten the anchors and brackets fully. Each pilaster has to stand rigid on its own.', shots: [{ show: [...FM, 'panel'], cam: CAM.top }] },
      { title: 'Hang the doors', text: 'Hang each door on its hinges and adjust it until the gaps are even, it swings freely and the latch meets its keeper. Set each door\'s resting position; the accessible stall\'s door closes on its own.', shots: [{ show: [...FM, 'panel', 'door'], hi: ['door'], cam: CAM.door }] },
      { title: 'Seat the shoes', text: 'Lower each shoe over the pilaster base so it covers the anchors, and secure it.', shots: [{ show: [...FM, 'panel', 'door'], hi: ['shoe'], cam: CAM.floor }] },
      { title: 'Check the finished run', text: 'Push on each pilaster top: none should move. Check every fastening is tight, then test each door and latch, including opening it from outside. Fit any accessories the drawings show.', shots: [{ show: [...FM, 'panel', 'door', 'grab'], cam: CAM.overview }] },
    ],
  },
  'ceiling-hung': {
    intro: 'Each pilaster hangs from structural steel above the ceiling, so nothing touches the floor and it can be cleaned in one pass. Everything depends on that overhead structure.',
    before: ['Structural steel above the ceiling has to be in place at every pilaster position, designed for the load, before the ceiling is closed. It is installed by others. If it isn\'t there, don\'t hang anything: stop and tell the general contractor.', 'Agree with the general contractor who fits the hanging rods; on some jobs the steel contractor does, on others the partition installer does.', 'Solid backing has to be in the walls wherever a bracket is fastened.'],
    safety: ['Never hang a pilaster from the ceiling grid, drywall or framing that wasn\'t designed for it.'],
    steps: [
      { title: 'Confirm the structure above the ceiling', text: 'The steel support has to run above every pilaster position, as the drawings show. Check it is there, and that the hanging rods come through the ceiling where the pilasters will hang.', shots: [{ show: ['steel'], hi: ['steel'], cutaway: true, cam: CAM.above }] },
      { title: 'Lay out the stalls', text: 'Mark the pilaster line and each dividing panel line on the floor from the drawings, and check the marks line up plumb with the hanging points above.', shots: [{ show: ['steel'], marks: true, cam: CAM.room }] },
      { title: 'Put up the wall brackets and panels', text: 'Fasten the wall brackets into the backing and set the dividing panels into them on temporary supports at the right height, without tightening.', shots: [{ show: ['steel', 'panel'], hi: ['panel'], noCeiling: true, cam: CAM.panels }] },
      { title: 'Hang the pilasters', text: 'Slide the trim sleeve onto the pilaster top, then hang the pilaster on its rod and support hardware and connect it to the panel. Support it from below until it is set.', shots: [{ show: [...CH, 'panel'], hi: ['pilaster', 'rod'], cutaway: true, cam: CAM.above }] },
      { title: 'Plumb, level, then tighten', text: 'Adjust the hanging hardware until each pilaster is plumb both ways and its bottom sits level with the others, clear of the floor. Set every door opening to the drawings, then tighten. Fit any extra bracing the manufacturer calls for on a tall ceiling.', shots: [{ show: [...CH, 'panel'], cam: CAM.floor }] },
      { title: 'Raise the sleeves to the ceiling', text: 'Push each trim sleeve up so it meets the ceiling and covers the hanging hardware, and secure it.', shots: [{ show: [...CH, 'panel', 'sleeve'], hi: ['sleeve'], cam: CAM.top }] },
      { title: 'Hang the doors', text: 'Hang each door on its hinges and adjust it until the gaps are even, it swings freely and the latch meets its keeper. Set each door\'s resting position; the accessible stall\'s door closes on its own.', shots: [{ show: [...CH, 'panel', 'sleeve', 'door'], hi: ['door'], cam: CAM.door }] },
      { title: 'Check the finished run', text: 'Check every pilaster is still plumb and level, the floor below is clear, and every fastening is tight. Test each door and latch, including opening it from outside. Fit any accessories the drawings show.', shots: [{ show: [...CH, 'panel', 'sleeve', 'door', 'grab'], cam: CAM.overview }] },
    ],
  },
  'floor-to-ceiling': {
    intro: 'Each pilaster is anchored into both the floor and the ceiling structure. It is the sturdiest style, often chosen for heavy use such as schools.',
    before: ['The ceiling has to have structure above every pilaster position that the top fixing can go into. It is installed by others, before the ceiling is closed.', 'Pilasters are made to the room\'s height, so measure floor to ceiling at every pilaster position and compare with the drawings before anything is cut or ordered.', 'Solid backing has to be in the walls wherever a bracket is fastened.'],
    steps: [
      { title: 'Check the room, the ceiling and the drawings', text: 'Confirm the room size, the ceiling height at each pilaster position, the structure above the ceiling and the wall backing all match the shop drawings.', shots: [{ show: [], cam: CAM.room }] },
      { title: 'Lay out floor and ceiling', text: 'Mark the pilaster and panel lines on the floor from the drawings, then carry each pilaster position straight up to the ceiling with a plumb line or laser, so top and bottom line up.', shots: [{ show: [], marks: true, cam: CAM.room }] },
      { title: 'Put up the wall brackets and panels', text: 'Fasten the wall brackets into the backing, fix the floor and ceiling hardware at each pilaster position, and set the dividing panels into the brackets on temporary supports, without tightening.', shots: [{ show: ['panel'], hi: ['panel'], noCeiling: true, cam: CAM.panels }] },
      { title: 'Set the pilasters', text: 'Slide a shoe onto each end of the pilaster and hold them clear, then stand the pilaster between its floor and ceiling hardware and connect it to the panel.', shots: [{ show: [...FTC, 'panel'], hi: ['pilaster'], cam: CAM.overview }] },
      { title: 'Plumb, then tighten both ends', text: 'Bring each pilaster plumb both ways and set every door opening to the drawings, then tighten the fixings at the floor and at the ceiling.', shots: [{ show: [...FTC, 'panel'], cam: CAM.floor }, { show: [...FTC, 'panel'], cam: CAM.top }] },
      { title: 'Seat both shoes', text: 'Lower the bottom shoe to the floor and raise the top shoe to the ceiling, so each covers its fixing, and secure them.', shots: [{ show: [...FTC, 'panel'], hi: ['shoe'], cam: CAM.floor }, { show: [...FTC, 'panel'], hi: ['cshoe'], cam: CAM.top }] },
      { title: 'Hang the doors', text: 'Hang each door on its hinges and adjust it until the gaps are even, it swings freely and the latch meets its keeper. Set each door\'s resting position; the accessible stall\'s door closes on its own.', shots: [{ show: [...FTC, 'panel', 'door'], hi: ['door'], cam: CAM.door }] },
      { title: 'Check the finished run', text: 'Check every pilaster is still plumb and every fastening is tight at both ends. Test each door and latch, including opening it from outside. Fit any accessories the drawings show.', shots: [{ show: [...FTC, 'panel', 'door', 'grab'], cam: CAM.overview }] },
    ],
  },
}
for (const g of Object.values(GUIDES)) { g.before = [...COMMON.before, ...g.before]; g.after = COMMON.after }
