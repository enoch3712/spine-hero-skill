#!/usr/bin/env node
/**
 * Deterministic gate for one captured clip of a skeletal hero.
 *
 *   node gate.mjs <metrics.json> [--kind idle|walk|run|move] [--limits <file>]
 *
 * Reads the metrics.json your capture step wrote (the contract is in ../references/gate.md), applies the limits in
 * gate-limits.json (per-kind defaults, overridable per hero in "heroes": {"<id>": {"<kind>": {...}}}), writes gate.json
 * beside the metrics ({pass, kind, hero, checks: [{id, value, limit, pass, note}]}), prints one line, and exits 0 on pass,
 * 1 on fail, 2 on bad usage. --kind defaults to the metrics' clip name. Plain Node (18 or later), no dependencies.
 * A missing field fails its check ("metric missing"); a missing `torch` fails the seam check of an idle or a rig move;
 * only a missing `pictureBox` skips its check.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** limit shapes: {max}, {min}, {min,max}, {equals} */
function within(value, lim) {
  if (value === null || value === undefined || Number.isNaN(value)) return false;
  if ('equals' in lim) return value === lim.equals;
  return (lim.min === undefined || value >= lim.min) && (lim.max === undefined || value <= lim.max);
}
const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Merge defaults for a kind with a hero's overrides (one level deep per check id). */
export function resolveLimits(limits, kind, hero) {
  const base = limits.kinds?.[kind] ?? {};
  const over = limits.heroes?.[hero]?.[kind] ?? {};
  const out = { ...base };
  for (const [id, v] of Object.entries(over)) out[id] = v === null ? null : { ...(base[id] ?? {}), ...v };
  return out;
}

/** Runs every check of `kind` against `metrics`. Returns { pass, kind, hero, checks }. */
export function gate(metrics, kind, limits) {
  const lim = resolveLimits(limits, kind, metrics.char);
  const checks = [];
  const add = (id, value, note = '') => {
    const l = lim[id];
    if (l === null || l === undefined) return;   // no limit, or switched off for this hero
    checks.push({ id, value, limit: l, pass: within(value, l), note: value === null ? `${note} (metric missing)`.trim() : note });
  };
  const soles = Object.entries(metrics.soles ?? {});
  const loco = metrics.locomotion;
  // a lit capture's seam can be light flicker: only an unlit capture's seam says anything about the loop. A capture that
  // does not say which it was ('torch' missing) fails the seam check, so a forgotten field never skips it silently.
  const seam = note => {
    if (metrics.torch === 'off') add('seamMeanAbsDiff', num(metrics.seam?.meanAbsDiff), note);
    else if ((metrics.torch === undefined || metrics.torch === null) && lim.seamMeanAbsDiff)
      checks.push({ id: 'seamMeanAbsDiff', value: null, limit: lim.seamMeanAbsDiff, pass: false, note: 'torch missing: capture unlit and set torch "off" (a lit capture names its light)' });
  };

  add('errors', Array.isArray(metrics.errors) ? metrics.errors.length : null, 'runtime errors during capture');
  if (kind === 'idle') {
    seam('unlit last frame against first');
    add('soleDriftPx', soles.length ? Math.max(...soles.map(([, s]) => s.maxDriftPx)) : null, 'max over soles of drift from first position');
    add('chestBobPx', num(metrics.chestBobPx), 'chest bone y range');
    add('headAngleRangeDeg', num(metrics.headAngleRangeDeg), 'head bone world rotation range');
    add('framePopMeanAbsDiff', num(metrics.frameToFrame?.maxMeanAbsDiff), 'largest frame-to-frame change over the figure (0-255)');
    const f = metrics.frameToFrame;   // a pop is one step far bigger than the clip's usual step
    add('framePopRatio', f && f.meanMeanAbsDiff > 0 ? +(f.maxMeanAbsDiff / f.meanMeanAbsDiff).toFixed(3) : null, 'largest frame step / mean frame step');
  } else if (kind === 'move') {
    // a move starts and ends in the idle's rest pose, so its last frame must match its first; no locomotion block.
    // A held move (key drawings cut between) opens on its wind-up drawing and may leave effects in the air, so its
    // first and last frames are not the same pose: errors, holes and the box only.
    if (!metrics.held) seam('unlit last frame against first: back at rest');
  } else {
    if (!loco) {
      checks.push({ id: 'locomotion', value: null, limit: 'present', pass: false, note: 'metrics have no locomotion block (capture a walk/run clip)' });
    } else {
      add('slidePxMax', num(loco.slidePx?.max), 'max planted-sole travel in world x over contacts');
      add('groundSpeedRatio', num(loco.groundSpeed?.ratio), 'world travel per second / the clip\'s declared groundSpeed');
      add('stanceSymmetry', num(loco.stanceSymmetry), 'mean contact duration of sole 1 / sole 2');
      const ff = Object.entries(loco.footfallsPerLoop ?? {});
      add('footfallsPerLoopMin', ff.length ? Math.min(...ff.map(([, v]) => v)) : null, ff.map(([n, v]) => `${n} ${v}`).join(', '));
      add('chestBobPx', num(loco.chestBobPx), 'chest bone y range over the analysed strides');
    }
  }
  add('holeMaxAreaPx', num(metrics.holes?.maxAreaPx), 'largest background region enclosed by the figure');
  add('holeThinMaxAreaPx', num(metrics.holes?.maxThinAreaPx), 'largest enclosed background that is a crack (outside every 5x5 square inside the hole)');
  // if the lit figure is rendered as one picture the size of the hero's box, whatever a pose draws outside the box is
  // cut off there (a raised weapon sliced flat). A capture without the measure is not gated on it.
  const box = metrics.pictureBox;
  if (num(box?.overflowUnits) !== null) add('boxOverflowUnits', box.overflowUnits, box.overflowUnits > 0 ? `drawn past the box's ${box.side} at frame ${box.frame}: the lit picture cuts it off there (widen the box)` : 'nothing drawn outside the box');
  return { pass: checks.every(c => c.pass), kind, hero: metrics.char, checks };
}

function main() {
  const argv = process.argv.slice(2);
  const opt = n => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined; };
  const file = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));
  if (!file) { console.error('usage: gate.mjs <metrics.json> [--kind idle|walk|run|move] [--limits <file>]'); process.exit(2); }
  // an unreadable or broken file is a usage error (exit 2), never a crash that a caller could read as a failed gate (1)
  const readJson = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.error(`cannot read ${f}: ${e.message}`); process.exit(2); } };
  const metrics = readJson(file);
  const limits = readJson(opt('limits') ?? path.join(HERE, 'gate-limits.json'));
  // --kind defaults to the clip's name when that is a kind (idle, walk, run); any other clip is a move
  const kind = opt('kind') ?? (limits.kinds?.[metrics.clip] ? metrics.clip : 'move');
  if (!limits.kinds?.[kind]) { console.error(`no limits for kind '${kind}' (have: ${Object.keys(limits.kinds ?? {}).join(', ')})`); process.exit(2); }
  const result = gate(metrics, kind, limits);
  fs.writeFileSync(path.join(path.dirname(path.resolve(file)), 'gate.json'), JSON.stringify(result, null, 1) + '\n');
  const bad = result.checks.filter(c => !c.pass);
  console.log(`${result.pass ? 'PASS' : 'FAIL'} ${metrics.char} ${kind}: ${result.checks.length - bad.length}/${result.checks.length} checks` +
    (bad.length ? ` | ${bad.map(c => `${c.id}=${c.value} (limit ${JSON.stringify(c.limit)})`).join('; ')}` : ''));
  process.exit(result.pass ? 0 : 1);
}

// run as a command (also through a symlinked skill folder: compare real paths)
const real = p => { try { return fs.realpathSync(p); } catch { return path.resolve(p); } };
if (process.argv[1] && real(process.argv[1]) === real(fileURLToPath(import.meta.url))) main();
