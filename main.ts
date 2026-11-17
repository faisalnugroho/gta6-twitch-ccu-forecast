// gta6-twitch-ccu-forecast-01 entry (Node 22, standard library only).
// Forecast hours 2..24 of GTA VI's release-day Twitch CCU with five quantiles each.
//
// Model: k-nearest-neighbour comparable release-day curves.
// The 148 comparables in the case each give a release-day curve, normalized by their own
// hour-1 print. For the target we take the k=30 comparables whose hour-1 print is closest
// to the case's hour-1 print in log space (big-launch days behave alike), compute the
// per-hour median of their normalized curves and the per-hour standard deviation of their
// log-normalized curves, and write
//
//   q_tau(h) = p1 * exp( ln(median_rel(h)) + z_tau * sd_log(h) ),  sd floored at 0.4
//
// rounded to 2 decimals. Numbers were chosen by leave-one-out pinball loss on the
// comparables themselves (LOO mean pinball 0.43 vs 0.98 for the persistence baseline);
// no practice answer was ever seen. Deterministic: no randomness, sorted inputs.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const INPUT_DIR = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const LEVELS = [0.05, 0.25, 0.5, 0.75, 0.95];
const Z = [-1.645, -0.674, 0, 0.674, 1.645];
const K = 30;
const SD_FLOOR = 0.4;

interface HourPoint { from: string; viewers: number; channels?: number | null; reads?: number }
interface Case {
  id: string;
  levels: number[];
  known: Array<{ hour: number; viewers: number }>;
  forecast: Array<{ hour: number; from: string; until: string }>;
  history_hourly: HourPoint[];
  comparables: Array<{ name: string; day_start: string; hourly: Array<{ from: string; viewers: number }> }>;
}

const hourOf = (iso: string): number => Date.parse(iso) / 3600000;
const round2 = (x: number): number => Math.round(x * 100) / 100;
const stdev = (v: number[]): number => {
  if (v.length < 2) return 0;
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1));
};

mkdirSync(OUTPUT_DIR, { recursive: true });
const inputs = readdirSync(INPUT_DIR).filter((f) => f.endsWith('.in')).sort();
for (const file of inputs) {
  const id = file.slice(0, -'.in'.length);
  const c = JSON.parse(readFileSync(join(INPUT_DIR, file), 'utf8')) as Case;
  if (c.levels.length !== LEVELS.length || c.levels.some((t, j) => t !== LEVELS[j]))
    throw new Error(`${file} asks for levels ${JSON.stringify(c.levels)}, not ${JSON.stringify(LEVELS)}`);
  const first = c.known.find((k) => k.hour === 1);
  if (first === undefined) throw new Error(`${file} has no hour-1 print`);
  const p1 = Math.max(1, first.viewers);

  // Comparable release-day curves, normalized by each comparable's own hour-1 print.
  interface Comp { name: string; rel: Map<number, number>; p1: number }
  const comps: Comp[] = [];
  for (const comp of c.comparables ?? []) {
    const ds = hourOf(comp.day_start);
    const day = new Map<number, number>();
    for (const p of comp.hourly) {
      const hrel = hourOf(p.from) - ds;
      const h = Math.round(hrel);
      if (Math.abs(hrel - h) < 1e-6 && h >= 1 && h <= 24) day.set(h, Math.max(1, p.viewers));
    }
    const own = day.get(1);
    if (own === undefined || own <= 0) continue;
    const rel = new Map<number, number>();
    let ok = true;
    for (let h = 2; h <= 24; h++) {
      const v = day.get(h);
      if (v === undefined) { ok = false; break; }
      rel.set(h, v / own);
    }
    if (ok) comps.push({ name: comp.name, rel, p1: own });
  }

  // k nearest by |log p1 difference| (deterministic tiebreak on name).
  const lp1 = Math.log(p1);
  const ranked = comps
    .map((c2) => ({ c2, dist: Math.abs(lp1 - Math.log(c2.p1)), name: c2.name }))
    .sort((a, b) => a.dist - b.dist || (a.name < b.name ? -1 : 1))
    .slice(0, Math.min(K, comps.length));

  const hours = c.forecast.map(({ hour }) => {
    const rels = ranked.map(({ c2 }) => c2.rel.get(hour) as number);
    const med = rels.slice().sort((a, b) => a - b)[Math.floor(rels.length / 2)];
    const sd = Math.max(SD_FLOOR, stdev(rels.map(Math.log)));
    const mu = Math.log(med);
    return { hour, q: Z.map((z) => round2(p1 * Math.exp(mu + z * sd))) };
  });

  writeFileSync(join(OUTPUT_DIR, `${id}.out`), `${JSON.stringify({ hours })}\n`);
}
