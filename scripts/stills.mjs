// Render inspection stills: node scripts/stills.mjs <compositionId> <frame,frame,...> [outDir]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [, , id = 'AirplaneExplainer', framesArg = '0', outDir = 'out/stills'] = process.argv;
const frames = framesArg.split(',').map(Number);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.REMOTION_BROWSER || null;
const composition = await selectComposition({serveUrl, id, browserExecutable});
for (const frame of frames) {
	const output = path.join(outDir, `${id}-${String(frame).padStart(5, '0')}.jpg`);
	await renderStill({composition, serveUrl, frame, output, imageFormat: 'jpeg', jpegQuality: 85, browserExecutable});
	console.log(output);
}
