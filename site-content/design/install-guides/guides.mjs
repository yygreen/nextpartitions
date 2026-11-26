// The four installation overview guides: one per mounting style. Each step has short text and one or more shots
// (see shot.js: which parts are installed, which are this step's, camera). Text is written in our own words from the
// consensus of several manufacturers' instructions (research/install-guides/consensus.md); nothing is copied from
// them, and no manufacturer figures are given. Build: node render-shots.mjs && node build.mjs
const RUN = 168.5, MID = RUN / 2
export const CAM = {
  overview: [[MID + 30, 64, 290], [MID, 50, -14], 40],
  room: [[MID + 10, 86, 270], [MID, 0, -24], 40],
  panels: [[RUN + 20, 175, 125], [MID - 6, 8, -36], 40],
  floor: [[RUN * 0.66, 48, 178], [RUN * 0.6, 22, -4], 40],
  top: [[RUN * 0.66, 50, 178], [RUN * 0.6, 78, -4], 40],
  rail: [[RUN * 0.28, 64, 205], [MID, 76, -10], 40],
  above: [[MID + 10, 46, 215], [MID, 100, -14], 46],
  door: [[RUN * 0.34, 58, 150], [RUN * 0.22, 44, -2], 40],
}
const BASE = { 'overhead-braced': ['pilaster', 'shoe'], 'floor-mounted': ['pilaster', 'shoe'], 'ceiling-hung': ['pilaster', 'sleeve', 'rod', 'steel'], 'floor-to-ceiling': ['pilaster', 'shoe', 'cshoe'] }
export const GUIDES = {}
for (const style of Object.keys(BASE)) {
  const pil = BASE[style], rail = style === 'overhead-braced' ? ['rail'] : []
  const all = [...pil, 'panel', ...rail, 'door', 'grab']
  GUIDES[style] = { steps: [
    { shots: [{ show: style === 'ceiling-hung' ? ['steel'] : [], hi: style === 'ceiling-hung' ? ['steel'] : [], cutaway: style === 'ceiling-hung', cam: style === 'ceiling-hung' ? CAM.above : CAM.room }] },
    { shots: [{ show: style === 'ceiling-hung' ? ['steel'] : [], marks: true, cutaway: style === 'ceiling-hung', cam: CAM.room }] },
    { shots: [{ show: pil, hi: pil.filter((p) => p !== 'steel'), cutaway: style === 'ceiling-hung', cam: style === 'ceiling-hung' ? CAM.above : CAM.overview }, { show: pil, hi: pil.filter((p) => p !== 'steel'), cam: style === 'ceiling-hung' ? CAM.top : CAM.floor }] },
    { shots: [{ show: [...pil, 'panel'], hi: ['panel'], noCeiling: true, cam: CAM.panels }] },
    ...(rail.length ? [{ shots: [{ show: [...pil, 'panel', 'rail'], hi: ['rail'], cam: CAM.rail }] }] : []),
    { shots: [{ show: [...pil, 'panel', ...rail, 'door'], hi: ['door'], cam: CAM.door }] },
    { shots: [{ show: all, hi: [], cam: CAM.overview }] },
  ] }
}
