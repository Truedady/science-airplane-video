// Time single-frame renders: node scripts/bench.mjs <frames,...>
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'node:path';
const frames = (process.argv[2] || '0').split(',').map(Number);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.REMOTION_BROWSER || null;
const puppeteerInstance = await openBrowser('chrome', {browserExecutable, chromiumOptions: {gl: process.env.GL === 'default' ? null : (process.env.GL || 'swangle')}});
const composition = await selectComposition({serveUrl, id: 'AirplaneExplainer', puppeteerInstance});
for (const frame of frames) {
	const t = Date.now();
	await renderStill({composition, serveUrl, frame, output: '/tmp/claude-0/-home-user/31acfb72-23d7-50de-997a-c52e3ea28698/scratchpad/b.jpg', imageFormat: 'jpeg', puppeteerInstance});
	console.log(frame, Date.now() - t, 'ms');
}
await puppeteerInstance.close({silent: true});
