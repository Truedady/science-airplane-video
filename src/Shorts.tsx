import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {InsetContext} from './lib/layout';
import {COLORS, FONT_BODY, FONT_DISPLAY} from './theme';
import {f, HEIGHT, SCENES, WIDTH} from './timeline';
import {AirplaneExplainer} from './Video';

/**
 * Vertical 9:16 Shorts version. Reuses the complete 16:9 video (same scenes,
 * audio and timing) scaled to SCALE and centred; edge overlays are pulled
 * inward via InsetContext so they survive the side crop. The bands above and
 * below get a matching backdrop.
 */
const SW = 1080;
const SH = 1920;
const SCALE = 0.75;
const INSET = (WIDTH - SW / SCALE) / 2; // 240 px of 1920 cropped each side
const BLOCK_H = HEIGHT * SCALE; // 810
const TOP = (SH - BLOCK_H) / 2; // 555

// Scenes whose lower frame is bright sky/cloud (vs dark lab/road).
const SKY: (keyof typeof SCENES)[] = ['mystery', 'answer', 'forces', 'glide', 'finale'];

export const AirplaneShorts: React.FC = () => {
	const frame = useCurrentFrame();
	const sky = Math.max(
		...SKY.map((id) => {
			const a = f(SCENES[id].start);
			const b = f(SCENES[id].end);
			return interpolate(frame, [a - 18, a, b, b + 18], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
		}),
	);
	const bottom = `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(${Math.round(3 + sky * 120)},${Math.round(11 + sky * 150)},${Math.round(31 + sky * 190)},1) 18%, ${COLORS.navy900} 100%)`;
	return (
		<AbsoluteFill style={{background: `linear-gradient(180deg, ${COLORS.navy900} 0%, ${COLORS.navy800} 29%, ${COLORS.navy800} 71%, ${COLORS.navy900} 100%)`}}>
			<div style={{position: 'absolute', left: -INSET * SCALE, top: TOP, width: WIDTH, height: HEIGHT, transform: `scale(${SCALE})`, transformOrigin: '0 0'}}>
				<InsetContext.Provider value={INSET}>
					<AirplaneExplainer />
				</InsetContext.Provider>
			</div>
			{/* soft blend of the 16:9 block into the bands */}
			<div style={{position: 'absolute', left: 0, right: 0, top: TOP - 2, height: 90, background: `linear-gradient(180deg, ${COLORS.navy800}, rgba(6,20,58,0))`}} />
			<div style={{position: 'absolute', left: 0, right: 0, top: TOP + BLOCK_H - 90, height: SH - TOP - BLOCK_H + 90, background: bottom}} />
			{/* header (existing title text) */}
			<div style={{position: 'absolute', top: 230, left: 80, right: 80, textAlign: 'center', color: '#fff'}}>
				<div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: 30, letterSpacing: '0.34em', color: COLORS.sky300}}>THE PHYSICS OF FLIGHT</div>
				<div style={{fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 68, lineHeight: 1.1, marginTop: 22}}>
					Why don’t airplanes <span style={{color: COLORS.orange}}>fall</span>?
				</div>
			</div>
		</AbsoluteFill>
	);
};
