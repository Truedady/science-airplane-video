import {useId} from 'react';
import {Easing, interpolate} from 'remotion';

export const EASE = {
	out: Easing.bezier(0.16, 1, 0.3, 1),
	inOut: Easing.bezier(0.65, 0, 0.35, 1),
	soft: Easing.bezier(0.45, 0, 0.2, 1),
	in: Easing.bezier(0.5, 0, 0.75, 0),
	back: Easing.bezier(0.34, 1.45, 0.64, 1),
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 0→1 progress between two frames with easing. */
export const prog = (frame: number, a: number, b: number, easing = EASE.out) =>
	interpolate(frame, [a, b], [0, 1], {...clamp, easing});

/** Map frame through keyframes with clamping. */
export const kf = (frame: number, input: number[], output: number[], easing = EASE.inOut) =>
	interpolate(frame, input, output, {...clamp, easing});

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Fade in at `a` over `d` frames, optionally fade out at `b`. */
export const fade = (frame: number, a: number, d = 12, b?: number, d2 = 12) => {
	const i = prog(frame, a, a + d, EASE.soft);
	if (b === undefined) return i;
	return i * (1 - prog(frame, b, b + d2, EASE.soft));
};

/** Deterministic PRNG (mulberry32) — identical output in every render worker. */
export const rng = (seed: number) => {
	let t = seed >>> 0;
	return () => {
		t += 0x6d2b79f5;
		let r = Math.imul(t ^ (t >>> 15), 1 | t);
		r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
		return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
	};
};

/** Smooth deterministic wobble for organic motion. */
export const wobble = (frame: number, speed = 1, seed = 0) =>
	Math.sin(frame * 0.031 * speed + seed * 1.7) * 0.6 + Math.sin(frame * 0.047 * speed + seed * 3.1) * 0.4;

/** Unique, URL-safe id for SVG defs (gradients/filters) so multiple instances never collide. */
export const useSvgId = (prefix: string) => prefix + useId().replace(/[^a-zA-Z0-9]/g, '');
