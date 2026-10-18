import React, {useMemo} from 'react';
import {Img} from 'remotion';
import {FLOW, pathDuration, pointAt, type Streamline} from '../lib/flow';
import {useSvgId} from '../lib/anim';
import {COLORS} from '../theme';

/**
 * Maps flow coordinates (freestream along +x, chord ≈ 4 units, y up) to
 * screen pixels. The aircraft flies to the right, so relative wind moves
 * right → left: flow x is mirrored on screen.
 */
export type View = {cx: number; cy: number; s: number};
export const toScreen = (v: View, x: number, y: number): [number, number] => [v.cx - x * v.s, v.cy - y * v.s];

const outlinePath = (v: View, outline: [number, number][]) =>
	outline.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${toScreen(v, x, y)[0].toFixed(1)},${toScreen(v, x, y)[1].toFixed(1)}`).join(' ') + ' Z';

/** The airfoil (wing cross-section) as a polished metallic shape. */
export const Airfoil: React.FC<{
	view: View;
	opacity?: number;
	glow?: number;
	outline?: [number, number][];
	showChord?: number;
}> = ({view, opacity = 1, glow = 0, outline = FLOW.outline, showChord = 0}) => {
	const id = useSvgId('af');
	const d = outlinePath(view, outline);
	const le = toScreen(view, -2.01, 0.25);
	const te = toScreen(view, 1.98, -0.24);
	return (
		<g opacity={opacity}>
			<defs>
				<linearGradient id={`${id}m`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#ffffff" />
					<stop offset="45%" stopColor="#dbe6f3" />
					<stop offset="100%" stopColor="#7f95b8" />
				</linearGradient>
				<filter id={`${id}g`} x="-30%" y="-80%" width="160%" height="260%">
					<feGaussianBlur stdDeviation="14" />
				</filter>
			</defs>
			{glow > 0 ? <path d={d} fill={COLORS.cyan} opacity={glow * 0.55} filter={`url(#${id}g)`} /> : null}
			<path d={d} fill={`url(#${id}m)`} stroke="#ffffff" strokeOpacity={0.7} strokeWidth={1.5} />
			{showChord > 0 ? (
				<line
					x1={le[0]}
					y1={le[1]}
					x2={le[0] + (te[0] - le[0]) * showChord}
					y2={le[1] + (te[1] - le[1]) * showChord}
					stroke={COLORS.navy700}
					strokeWidth={2}
					strokeDasharray="10 8"
				/>
			) : null}
		</g>
	);
};

/**
 * Blend a flow point toward a symmetric "no lift" path (used for the flat hand):
 * straight lines that simply part around a thin, level object.
 */
export const straightY = (x: number, seedY: number) =>
	seedY + Math.sign(seedY || 1) * 0.28 * Math.exp(-((seedY / 0.55) ** 2)) * Math.exp(-((x / 2.3) ** 4));
const bend = (p: [number, number], seedY: number, k: number): [number, number] =>
	k <= 0 ? p : [p[0], p[1] + (straightY(p[0], seedY) - p[1]) * k];

const streamPath = (v: View, s: Streamline, step = 5, straighten = 0) => {
	let d = '';
	for (let i = 0; i < s.pts.length; i += step) {
		const q = bend(s.pts[i], s.seedY, straighten);
		const [x, y] = toScreen(v, q[0], q[1]);
		d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
	}
	return d;
};

/** Static streamlines (drawn on with `progress`), optionally tinted by local vertical velocity. */
export const Streamlines: React.FC<{
	view: View;
	progress?: number;
	opacity?: number;
	color?: string;
	width?: number;
	every?: number;
	straighten?: number;
}> = ({view, progress = 1, opacity = 0.35, color = COLORS.sky200, width = 1.6, every = 1, straighten = 0}) => {
	const paths = useMemo(
		() => FLOW.streamlines.filter((_, i) => i % every === 0).map((s) => streamPath(view, s, 5, straighten)),
		[view, every, straighten],
	);
	return (
		<g opacity={opacity} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round">
			{paths.map((d, i) => (
				<path key={i} d={d} pathLength={1} strokeDasharray="1 1" style={{strokeDashoffset: 1 - progress}} />
			))}
		</g>
	);
};

const smooth = (e0: number, e1: number, x: number) => {
	const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
	return t * t * (3 - 2 * t);
};

/**
 * Moving air parcels. `tau` is flow time (integrate speed yourself if it varies).
 * Each parcel is drawn as a short streak whose length is proportional to local speed,
 * so faster air over the wing is immediately visible. Colour modes:
 *  - 'plain'    : uniform cyan-white
 *  - 'speed'    : faster → cyan, slower → orange
 *  - 'downwash' : air moving downward highlighted in orange
 */
export const Particles: React.FC<{
	view: View;
	tau: number;
	perLine?: number;
	trail?: number;
	opacity?: number;
	mode?: 'plain' | 'speed' | 'downwash';
	width?: number;
	every?: number;
	xFade?: [number, number];
	straighten?: number;
}> = ({view, tau, perLine = 9, trail = 0.16, opacity = 1, mode = 'plain', width = 3, every = 1, xFade = [4.6, 6.6], straighten = 0}) => {
	const buckets: Record<string, string[]> = {};
	const push = (k: string, d: string) => {
		(buckets[k] ??= []).push(d);
	};
	FLOW.streamlines.forEach((s, li) => {
		if (li % every !== 0) return;
		const D = pathDuration(s);
		const phase = ((li * 0.618) % 1) * (D / perLine);
		for (let j = 0; j < perLine; j++) {
			const t = (((tau + phase + (j * D) / perLine) % D) + D) % D;
			const a = bend(pointAt(s, Math.max(0, t - trail)), s.seedY, straighten);
			const b = bend(pointAt(s, t), s.seedY, straighten);
			const fadeX = 1 - smooth(xFade[0], xFade[1], Math.abs(b[0]));
			if (fadeX <= 0.02) continue;
			const vx = (b[0] - a[0]) / trail;
			const vy = (b[1] - a[1]) / trail;
			const sp = Math.hypot(vx, vy);
			let key = 'p';
			if (mode === 'speed') key = sp > 1.12 ? 'fast' : sp < 0.9 ? 'slow' : 'mid';
			if (mode === 'downwash') key = vy < -0.06 && b[0] > -0.5 ? 'down' : vy > 0.06 && b[0] < 0 ? 'up' : 'p';
			const alphaKey = fadeX > 0.66 ? 3 : fadeX > 0.33 ? 2 : 1;
			const [x1, y1] = toScreen(view, a[0], a[1]);
			const [x2, y2] = toScreen(view, b[0], b[1]);
			push(`${key}|${alphaKey}`, `M${x1.toFixed(1)},${y1.toFixed(1)}L${x2.toFixed(1)},${y2.toFixed(1)}`);
		}
	});
	const colorOf = (k: string) =>
		({
			p: '#dff6ff',
			fast: COLORS.cyan,
			mid: '#dff6ff',
			slow: COLORS.orangeSoft,
			down: COLORS.orange,
			up: COLORS.sky300,
		})[k] ?? '#fff';
	return (
		<g opacity={opacity} fill="none" strokeLinecap="round">
			{Object.entries(buckets).map(([k, ds]) => {
				const [ck, ak] = k.split('|');
				return <path key={k} d={ds.join('')} stroke={colorOf(ck)} strokeWidth={width} opacity={Number(ak) / 3} />;
			})}
		</g>
	);
};

/**
 * A "smoke pulse": parcels released on one vertical line at the same instant.
 * As time passes, the parcels above the wing pull ahead — they do NOT meet
 * their lower partners at the trailing edge (no equal-transit-time myth).
 */
export const SmokePulse: React.FC<{view: View; age: number; opacity?: number; releaseX?: number}> = ({
	view,
	age,
	opacity = 1,
	releaseX = -3.6,
}) => {
	const pts = FLOW.streamlines
		.filter((s) => Math.abs(s.seedY) < 1.6)
		.map((s) => {
			// find release time where streamline crosses releaseX
			let i0 = 0;
			while (i0 < s.pts.length - 1 && s.pts[i0][0] < releaseX) i0++;
			const p = pointAt(s, i0 * FLOW.dt + age);
			return {p, upper: s.seedY > 0.05};
		});
	const scr = pts.map(({p, upper}) => ({xy: toScreen(view, p[0], p[1]), upper}));
	const d = scr.map((q, i) => `${i === 0 ? 'M' : 'L'}${q.xy[0].toFixed(1)},${q.xy[1].toFixed(1)}`).join('');
	return (
		<g opacity={opacity}>
			<path d={d} fill="none" stroke="#fff" strokeOpacity={0.45} strokeWidth={2} strokeDasharray="3 6" />
			{scr.map((q, i) => (
				<circle key={i} cx={q.xy[0]} cy={q.xy[1]} r={7} fill={q.upper ? COLORS.cyan : COLORS.orange} stroke="#fff" strokeWidth={2} />
			))}
		</g>
	);
};

/** Pressure field image (Cp), rendered once per view to a data URL. */
const pressureCache = new Map<string, string>();
const PR = {x0: -5.2, x1: 5.2, y0: -3, y1: 3};
const pressureImage = (w = 360, h = 208) => {
	const key = `${w}x${h}`;
	const hit = pressureCache.get(key);
	if (hit) return hit;
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
	const img = ctx.createImageData(w, h);
	for (let j = 0; j < h; j++) {
		for (let i = 0; i < w; i++) {
			// screen column i (left→right) ↔ flow x decreasing (mirror)
			const x = PR.x1 - ((i + 0.5) / w) * (PR.x1 - PR.x0);
			const y = PR.y1 - ((j + 0.5) / h) * (PR.y1 - PR.y0);
			const cp = FLOW.cp(x, y);
			const k = (j * w + i) * 4;
			if (cp === null) {
				img.data[k + 3] = 0;
				continue;
			}
			const edge = Math.min(1, Math.min(i, w - 1 - i, j, h - 1 - j) / 24);
			if (cp < 0) {
				const a = Math.pow(Math.min(1, -cp / 1.1), 0.75);
				img.data[k] = 40;
				img.data[k + 1] = 200;
				img.data[k + 2] = 255;
				img.data[k + 3] = 235 * a * edge;
			} else {
				const a = Math.pow(Math.min(1, cp / 0.7), 0.85);
				img.data[k] = 255;
				img.data[k + 1] = 135;
				img.data[k + 2] = 55;
				img.data[k + 3] = 165 * a * edge;
			}
		}
	}
	ctx.putImageData(img, 0, 0);
	const url = canvas.toDataURL('image/png');
	pressureCache.set(key, url);
	return url;
};

/** HTML layer — place it as a sibling *behind* the SVG flow layer, in the same coordinate space. */
export const PressureField: React.FC<{view: View; opacity?: number}> = ({view, opacity = 1}) => {
	const src = useMemo(() => pressureImage(), []);
	if (opacity < 0.005) return null;
	const left = view.cx - PR.x1 * view.s;
	const top = view.cy - PR.y1 * view.s;
	return (
		<Img
			src={src}
			style={{
				position: 'absolute',
				left,
				top,
				width: (PR.x1 - PR.x0) * view.s,
				height: (PR.y1 - PR.y0) * view.s,
				opacity,
				filter: 'blur(10px)',
			}}
		/>
	);
};

/**
 * Arrows normal to the wing surface showing the local pressure relative to
 * ambient: suction (Cp<0, cyan) pulls outward; overpressure (Cp>0, orange) pushes in.
 * Their net effect is the lift force.
 */
export const SurfacePressure: React.FC<{view: View; progress: number; scale?: number; opacity?: number}> = ({
	view,
	progress,
	scale = 0.42,
	opacity = 1,
}) => {
	const arrows = useMemo(() => {
		const o = FLOW.outline;
		const out: {x: number; y: number; nx: number; ny: number; cp: number}[] = [];
		for (let i = 4; i < o.length - 4; i += 6) {
			const [x0, y0] = o[i - 1];
			const [x1, y1] = o[i + 1];
			let nx = y1 - y0;
			let ny = -(x1 - x0);
			const L = Math.hypot(nx, ny);
			nx /= L;
			ny /= L;
			const [px, py] = o[i];
			if (FLOW.velocity(px + nx * 0.06, py + ny * 0.06) === null) {
				nx = -nx;
				ny = -ny;
			}
			const cp = FLOW.cp(px + nx * 0.07, py + ny * 0.07);
			if (cp === null) continue;
			out.push({x: px, y: py, nx, ny, cp: Math.max(-2.2, Math.min(1, cp))});
		}
		return out;
	}, []);
	return (
		<g opacity={opacity} strokeLinecap="round">
			{arrows.map((a, i) => {
				const p = Math.min(1, Math.max(0, progress * 1.6 - (i / arrows.length) * 0.6));
				if (p <= 0) return null;
				const len = Math.abs(a.cp) * scale * p;
				const suction = a.cp < 0;
				// suction: from surface outward; overpressure: from outside toward surface
				const sx = suction ? a.x : a.x + a.nx * len;
				const sy = suction ? a.y : a.y + a.ny * len;
				const ex = suction ? a.x + a.nx * len : a.x;
				const ey = suction ? a.y + a.ny * len : a.y;
				const [x1, y1] = toScreen(view, sx, sy);
				const [x2, y2] = toScreen(view, ex, ey);
				const ang = Math.atan2(y2 - y1, x2 - x1);
				const hl = Math.min(12, Math.hypot(x2 - x1, y2 - y1) * 0.5);
				const col = suction ? COLORS.cyan : COLORS.orange;
				return (
					<g key={i} stroke={col} strokeWidth={2.6}>
						<line x1={x1} y1={y1} x2={x2} y2={y2} />
						<path
							d={`M${x2 - hl * Math.cos(ang - 0.45)},${y2 - hl * Math.sin(ang - 0.45)} L${x2},${y2} L${x2 - hl * Math.cos(ang + 0.45)},${y2 - hl * Math.sin(ang + 0.45)}`}
							fill="none"
						/>
					</g>
				);
			})}
		</g>
	);
};

/** Grid of local velocity arrows (relative to freestream direction) — shows upwash ahead and downwash behind. */
export const VelocityGrid: React.FC<{view: View; opacity?: number; progress?: number}> = ({view, opacity = 1, progress = 1}) => {
	const items = useMemo(() => {
		const arr: {x: number; y: number; vx: number; vy: number}[] = [];
		for (let gx = -4.2; gx <= 4.6; gx += 0.75) {
			for (let gy = -2.2; gy <= 2.4; gy += 0.62) {
				const v = FLOW.velocity(gx, gy);
				if (!v) continue;
				if (Math.abs(gy) < 0.55 && Math.abs(gx) < 2.3) continue;
				arr.push({x: gx, y: gy, vx: v[0], vy: v[1]});
			}
		}
		return arr;
	}, []);
	return (
		<g opacity={opacity}>
			{items.map((it, i) => {
				const p = Math.min(1, Math.max(0, progress * 1.5 - ((it.x + 4.2) / 8.8) * 0.5));
				const [x1, y1] = toScreen(view, it.x, it.y);
				const L = 0.5 * p;
				const [x2, y2] = toScreen(view, it.x + it.vx * L, it.y + it.vy * L);
				const ang = Math.atan2(y2 - y1, x2 - x1);
				const tilt = Math.atan2(it.vy, it.vx);
				const col = tilt < -0.05 ? COLORS.orange : tilt > 0.05 ? COLORS.sky300 : '#cfe9ff';
				if (p <= 0.02) return null;
				return (
					<g key={i} stroke={col} strokeWidth={2.2} strokeLinecap="round" opacity={0.85}>
						<line x1={x1} y1={y1} x2={x2} y2={y2} />
						<path d={`M${x2 - 8 * Math.cos(ang - 0.5)},${y2 - 8 * Math.sin(ang - 0.5)} L${x2},${y2} L${x2 - 8 * Math.cos(ang + 0.5)},${y2 - 8 * Math.sin(ang + 0.5)}`} fill="none" />
					</g>
				);
			})}
		</g>
	);
};
