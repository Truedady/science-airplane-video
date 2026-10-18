// Export the resolved scene timing + visual cue table to data/scene-timing.json
// Usage: node scripts/export-timing.mjs
import {build} from 'esbuild';
import fs from 'node:fs';
const out = 'node_modules/.cache/timeline.mjs';
await build({entryPoints: ['src/timeline.ts'], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'error'});
const t = await import(new URL('../' + out, import.meta.url));
const scenes = Object.keys(t.SCENES).map((id) => ({
	id,
	startSec: +t.SCENES[id].start.toFixed(3),
	endSec: +t.SCENES[id].end.toFixed(3),
	...t.sceneFrames(id),
}));
const cues = Object.fromEntries(Object.entries(t.CUES).map(([k, v]) => [k, {sec: +v.toFixed(3), frame: t.f(v)}]));
const data = {fps: t.FPS, width: t.WIDTH, height: t.HEIGHT, audioDurationSec: t.AUDIO_DURATION, outroSec: t.OUTRO_SEC, totalFrames: t.TOTAL_FRAMES, crossfadeFrames: t.XFADE, scenes, cues};
fs.writeFileSync('data/scene-timing.json', JSON.stringify(data, null, 1));
console.log(scenes.map((s) => `${s.id.padEnd(8)} ${s.startSec.toFixed(2).padStart(7)}–${s.endSec.toFixed(2).padStart(7)}s  frames ${s.from}+${s.durationInFrames}`).join('\n'));
console.log('total frames', t.TOTAL_FRAMES, '| cues', Object.keys(cues).length);
