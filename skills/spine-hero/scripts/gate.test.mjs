// node --test skills/spine-hero/scripts/gate.test.mjs   (plain Node 18 or later, no dependencies)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gate, resolveLimits } from './gate.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GATE = path.join(HERE, 'gate.mjs');
const LIMITS = {
  kinds: {
    idle: { errors: { equals: 0 }, seamMeanAbsDiff: { max: 0.5 }, soleDriftPx: { max: 1 }, chestBobPx: { min: 0.8, max: 3 }, headAngleRangeDeg: { max: 8 }, framePopMeanAbsDiff: { max: 2 }, framePopRatio: { max: 3 }, holeMaxAreaPx: { max: 30 }, holeThinMaxAreaPx: { max: 3 } },
    walk: { errors: { equals: 0 }, slidePxMax: { max: 2 }, groundSpeedRatio: { min: 0.95, max: 1.05 }, stanceSymmetry: { min: 0.8, max: 1.25 }, footfallsPerLoopMin: { min: 1 }, chestBobPx: { min: 2, max: 9 }, holeMaxAreaPx: { max: 30 }, holeThinMaxAreaPx: { max: 3 } },
  },
  heroes: { odd: { walk: { slidePxMax: { max: 5 }, stanceSymmetry: null } } },
};
const idle = () => ({ char: 'h', clip: 'idle', torch: 'off', errors: [], seam: { meanAbsDiff: 0.1 }, soles: { A: { maxDriftPx: 0.2 }, B: { maxDriftPx: 0 } }, chestBobPx: 1.6, headAngleRangeDeg: 3, frameToFrame: { maxMeanAbsDiff: 0.5, meanMeanAbsDiff: 0.3 }, holes: { maxAreaPx: 5, maxThinAreaPx: 1 } });
const walk = () => ({ char: 'h', clip: 'walk', torch: 'off', errors: [], holes: { maxAreaPx: 0, maxThinAreaPx: 0 }, locomotion: { slidePx: { max: 1.2 }, groundSpeed: { ratio: 1 }, stanceSymmetry: 1, footfallsPerLoop: { A: 1, B: 1.1 }, chestBobPx: 5 } });

const failing = (m, kind, id) => { const r = gate(m, kind, LIMITS); const c = r.checks.find(x => x.id === id); assert.ok(c, `check ${id} exists`); assert.equal(c.pass, false, id); assert.equal(r.pass, false); };

test('idle passes with good metrics', () => { const r = gate(idle(), 'idle', LIMITS); assert.equal(r.pass, true); assert.equal(r.checks.length, 9); });
test('walk passes with good metrics', () => { const r = gate(walk(), 'walk', LIMITS); assert.equal(r.pass, true); assert.equal(r.checks.length, 8); });

test('idle: each check can fail', () => {
  let m = idle(); m.errors = ['boom']; failing(m, 'idle', 'errors');
  m = idle(); m.seam.meanAbsDiff = 0.9; failing(m, 'idle', 'seamMeanAbsDiff');
  m = idle(); m.soles.B.maxDriftPx = 1.5; failing(m, 'idle', 'soleDriftPx');
  m = idle(); m.chestBobPx = 0.3; failing(m, 'idle', 'chestBobPx');
  m = idle(); m.chestBobPx = 3.5; failing(m, 'idle', 'chestBobPx');
  m = idle(); m.headAngleRangeDeg = 9; failing(m, 'idle', 'headAngleRangeDeg');
  m = idle(); m.frameToFrame.maxMeanAbsDiff = 5; failing(m, 'idle', 'framePopMeanAbsDiff');
  m = idle(); m.frameToFrame.maxMeanAbsDiff = 1.9; failing(m, 'idle', 'framePopRatio');
  m = idle(); m.holes.maxAreaPx = 99; failing(m, 'idle', 'holeMaxAreaPx');
  m = idle(); m.holes.maxThinAreaPx = 8; failing(m, 'idle', 'holeThinMaxAreaPx');
});

test('idle: a lit capture\'s seam is never gated', () => {
  const m = idle(); m.torch = 'sconce'; m.seam.meanAbsDiff = 9;
  const r = gate(m, 'idle', LIMITS);
  assert.equal(r.pass, true); assert.equal(r.checks.some(c => c.id === 'seamMeanAbsDiff'), false);
});

test('a capture without torch fails the seam check instead of skipping it', () => {
  const m = idle(); delete m.torch; m.seam.meanAbsDiff = 40;
  const r = gate(m, 'idle', LIMITS);
  assert.equal(r.pass, false);
  const c = r.checks.find(x => x.id === 'seamMeanAbsDiff');
  assert.ok(c); assert.equal(c.pass, false); assert.match(c.note, /torch missing/);
  const lim = { kinds: { move: { errors: { equals: 0 }, seamMeanAbsDiff: { max: 0.5 }, holeMaxAreaPx: { max: 12 } } } };
  const mv = { char: 'x', clip: 'shield-bash', errors: [], seam: { meanAbsDiff: 0.1 }, holes: { maxAreaPx: 5 } };
  assert.equal(gate(mv, 'move', lim).pass, false);                 // a rig move without torch: seam fails
  assert.equal(gate({ ...mv, held: true }, 'move', lim).pass, true); // a held move has no seam check at all
  const noSeamLimit = { kinds: { idle: { errors: { equals: 0 } } } };
  assert.equal(gate({ char: 'x', clip: 'idle', errors: [] }, 'idle', noSeamLimit).pass, true);   // no seam limit, nothing to fail
});

test('walk: each check can fail', () => {
  let m = walk(); m.errors = ['x']; failing(m, 'walk', 'errors');
  m = walk(); m.locomotion.slidePx.max = 2.5; failing(m, 'walk', 'slidePxMax');
  m = walk(); m.locomotion.groundSpeed.ratio = 0.9; failing(m, 'walk', 'groundSpeedRatio');
  m = walk(); m.locomotion.groundSpeed.ratio = 1.1; failing(m, 'walk', 'groundSpeedRatio');
  m = walk(); m.locomotion.stanceSymmetry = 0.7; failing(m, 'walk', 'stanceSymmetry');
  m = walk(); m.locomotion.stanceSymmetry = 1.3; failing(m, 'walk', 'stanceSymmetry');
  m = walk(); m.locomotion.footfallsPerLoop.B = 0.5; failing(m, 'walk', 'footfallsPerLoopMin');
  m = walk(); m.locomotion.chestBobPx = 12; failing(m, 'walk', 'chestBobPx');
  m = walk(); m.holes.maxAreaPx = 60; failing(m, 'walk', 'holeMaxAreaPx');
  m = walk(); m.holes.maxThinAreaPx = 9; failing(m, 'walk', 'holeThinMaxAreaPx');
});

test('a missing metric fails its check; a walk without a locomotion block fails', () => {
  const m = walk(); delete m.locomotion.groundSpeed; failing(m, 'walk', 'groundSpeedRatio');
  const n = walk(); delete n.locomotion; assert.equal(gate(n, 'walk', LIMITS).pass, false);
});

test('per-hero overrides merge over the kind defaults and null switches a check off', () => {
  const l = resolveLimits(LIMITS, 'walk', 'odd');
  assert.deepEqual(l.slidePxMax, { max: 5 }); assert.equal(l.stanceSymmetry, null); assert.deepEqual(l.errors, { equals: 0 });
  const m = walk(); m.char = 'odd'; m.locomotion.slidePx.max = 4; m.locomotion.stanceSymmetry = 3;
  const r = gate(m, 'walk', LIMITS);
  assert.equal(r.pass, true); assert.equal(r.checks.some(c => c.id === 'stanceSymmetry'), false);
});

test('CLI writes gate.json beside the metrics and exits 0 / 1 / 2', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-'));
  const lim = path.join(dir, 'limits.json'); fs.writeFileSync(lim, JSON.stringify(LIMITS));
  const f = path.join(dir, 'metrics.json');
  fs.writeFileSync(f, JSON.stringify(idle()));
  const ok = spawnSync(process.execPath, [GATE, f, '--limits', lim], { encoding: 'utf8' });
  assert.equal(ok.status, 0); assert.match(ok.stdout, /^PASS/);
  const g = JSON.parse(fs.readFileSync(path.join(dir, 'gate.json'), 'utf8')); assert.equal(g.pass, true); assert.equal(g.kind, 'idle');
  const bad = idle(); bad.chestBobPx = 9; fs.writeFileSync(f, JSON.stringify(bad));
  const no = spawnSync(process.execPath, [GATE, f, '--limits', lim], { encoding: 'utf8' });
  assert.equal(no.status, 1); assert.match(no.stdout, /^FAIL.*chestBobPx/);
  assert.equal(spawnSync(process.execPath, [GATE]).status, 2);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('the CLI also runs through a symlinked skill folder', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-link-'));
  const link = path.join(dir, 'scripts');
  try { fs.symlinkSync(HERE, link, 'dir'); } catch { fs.rmSync(dir, { recursive: true, force: true }); return; }   // no symlinks here: nothing to test
  const f = path.join(dir, 'metrics.json'), lim = path.join(dir, 'limits.json');
  fs.writeFileSync(f, JSON.stringify(idle())); fs.writeFileSync(lim, JSON.stringify(LIMITS));
  const r = spawnSync(process.execPath, [path.join(link, 'gate.mjs'), f, '--limits', lim], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /^PASS/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a move is gated on returning to rest, not on locomotion', () => {
  const m = { char: 'x', clip: 'shield-bash', torch: 'off', errors: [], seam: { meanAbsDiff: 0.2 }, holes: { maxAreaPx: 5 } };
  const lim = { kinds: { move: { errors: { equals: 0 }, seamMeanAbsDiff: { max: 0.5 }, holeMaxAreaPx: { max: 12 } } } };
  const ok = gate(m, 'move', lim);
  assert.equal(ok.pass, true); assert.ok(!ok.checks.some(c => c.id === 'locomotion'));
  const off = gate({ ...m, seam: { meanAbsDiff: 3 } }, 'move', lim);
  assert.equal(off.pass, false); assert.equal(off.checks.find(c => c.id === 'seamMeanAbsDiff').pass, false);
});

test('a held move (key drawings cut between) is not held to the back-at-rest seam', () => {
  const lim = { kinds: { move: { errors: { equals: 0 }, seamMeanAbsDiff: { max: 0.5 }, holeMaxAreaPx: { max: 12 } } } };
  const m = { char: 'x', clip: 'leap-air', torch: 'off', errors: [], seam: { meanAbsDiff: 37.9 }, holes: { maxAreaPx: 5 } };
  assert.equal(gate(m, 'move', lim).pass, false);   // a rig move must end at rest
  const held = gate({ ...m, held: true }, 'move', lim);
  assert.equal(held.pass, true); assert.equal(held.checks.some(c => c.id === 'seamMeanAbsDiff'), false);
});

test('anything drawn outside the box fails every kind (the lit picture cuts it off there)', () => {
  const lim = { kinds: { move: { errors: { equals: 0 }, boxOverflowUnits: { max: 0 } }, idle: { errors: { equals: 0 }, boxOverflowUnits: { max: 0 } } } };
  const m = { char: 'x', clip: 'leap-air', torch: 'off', errors: [], pictureBox: { overflowUnits: 0 } };
  assert.equal(gate(m, 'move', lim).pass, true);
  const cut = gate({ ...m, pictureBox: { overflowUnits: 80.4, side: 'top', frame: 14 } }, 'move', lim);
  assert.equal(cut.pass, false);
  const c = cut.checks.find(x => x.id === 'boxOverflowUnits');
  assert.equal(c.value, 80.4); assert.match(c.note, /top.*frame 14/);
  assert.equal(gate({ ...m, clip: 'idle', pictureBox: { overflowUnits: 3, side: 'left', frame: 0 } }, 'idle', lim).pass, false);
  // a capture without the measure is not gated on it
  const old = gate({ char: 'x', clip: 'idle', torch: 'off', errors: [] }, 'idle', lim);
  assert.equal(old.pass, true); assert.equal(old.checks.some(x => x.id === 'boxOverflowUnits'), false);
});

test('the shipped gate-limits.json defines idle, walk, run and move and holds each to the box', () => {
  const l = JSON.parse(fs.readFileSync(path.join(HERE, 'gate-limits.json'), 'utf8'));
  for (const k of ['idle', 'walk', 'run', 'move']) { assert.ok(l.kinds[k], k); assert.deepEqual(l.kinds[k].boxOverflowUnits, { max: 0 }, k); }
});

test('the example metrics in assets/ pass the shipped limits as a walk', () => {
  const l = JSON.parse(fs.readFileSync(path.join(HERE, 'gate-limits.json'), 'utf8'));
  const m = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'assets', 'metrics.example.json'), 'utf8'));
  const r = gate(m, 'walk', l);
  assert.equal(r.pass, true, JSON.stringify(r.checks.filter(c => !c.pass)));
  assert.equal(r.checks.length, 8);
});

test('the CLI exits 2 with a plain message when a file is missing or is not JSON, and a move needs no --kind', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gate-bad-'));
  const lim = path.join(dir, 'limits.json'); fs.writeFileSync(lim, JSON.stringify(LIMITS));
  const missing = spawnSync(process.execPath, [GATE, path.join(dir, 'nope.json'), '--limits', lim], { encoding: 'utf8' });
  assert.equal(missing.status, 2); assert.match(missing.stderr, /cannot read .*nope\.json/); assert.doesNotMatch(missing.stderr, /at .*node:/);
  const broken = path.join(dir, 'metrics.json'); fs.writeFileSync(broken, '{ not json');
  const bad = spawnSync(process.execPath, [GATE, broken, '--limits', lim], { encoding: 'utf8' });
  assert.equal(bad.status, 2); assert.match(bad.stderr, /cannot read .*metrics\.json/);
  fs.writeFileSync(broken, JSON.stringify(idle()));
  const noLimits = spawnSync(process.execPath, [GATE, broken, '--limits', path.join(dir, 'absent.json')], { encoding: 'utf8' });
  assert.equal(noLimits.status, 2); assert.match(noLimits.stderr, /cannot read .*absent\.json/);
  // a move's clip name (shield-bash) is not a kind: with limits for 'move' it is gated as a move, and the line says so
  const move = { char: 'h', clip: 'shield-bash', torch: 'off', errors: [], seam: { meanAbsDiff: 0.1 }, holes: { maxAreaPx: 0, maxThinAreaPx: 0 } };
  const withMove = path.join(dir, 'limits-move.json');
  fs.writeFileSync(withMove, JSON.stringify({ kinds: { ...LIMITS.kinds, move: { errors: { equals: 0 }, seamMeanAbsDiff: { max: 0.5 } } } }));
  fs.writeFileSync(broken, JSON.stringify(move));
  const asMove = spawnSync(process.execPath, [GATE, broken, '--limits', withMove], { encoding: 'utf8' });
  assert.equal(asMove.status, 0); assert.match(asMove.stdout, /^PASS h move:/);
  // an explicit kind that has no limits is still a usage error
  assert.equal(spawnSync(process.execPath, [GATE, broken, '--limits', withMove, '--kind', 'dance'], { encoding: 'utf8' }).status, 2);
});
