import React from 'react';
import {FLOW} from '../lib/flow';
import {useSvgId} from '../lib/anim';
import {COLORS} from '../theme';
import {toScreen, type View} from './Flow';

/**
 * Side profile of a flat hand in flow coordinates, sampled with the same
 * parameterisation as FLOW.outline (trailing end → over the top → leading
 * end → underneath) so it can morph vertex-for-vertex into the airfoil.
 * Fingertips point into the wind (flow x = −2), wrist at x = +2.
 */
export const handOutline = (tiltDeg: number): [number, number][] => {
	const n = FLOW.outline.length;
	const th = (tiltDeg * Math.PI) / 180;
	const pts: [number, number][] = [];
	for (let i = 0; i < n; i++) {
		const u = i / (n - 1);
		const upper = u <= 0.5;
		const x = upper ? 2 - 4 * (u / 0.5) : -2 + 4 * ((u - 0.5) / 0.5);
		const s = (x + 2) / 4; // 0 fingertip → 1 wrist
		const round = Math.sqrt(Math.max(0, Math.sin(Math.min(1, s * 6) * (Math.PI / 2))));
		const thumb = 0.11 * Math.exp(-(((s - 0.62) / 0.09) ** 2));
		const knuckle = 0.03 * Math.exp(-(((s - 0.36) / 0.07) ** 2));
		const y = upper ? (0.13 + 0.06 * s) * round + thumb + knuckle : -(0.11 + 0.06 * s) * round;
		pts.push([x * Math.cos(th) + y * Math.sin(th), -x * Math.sin(th) + y * Math.cos(th)]);
	}
	return pts;
};

export const morphOutline = (a: [number, number][], b: [number, number][], t: number): [number, number][] =>
	a.map((p, i) => [p[0] + (b[i][0] - p[0]) * t, p[1] + (b[i][1] - p[1]) * t]);

export const outlineD = (v: View, pts: [number, number][]) =>
	pts.map(([x, y], i) => {
		const [sx, sy] = toScreen(v, x, y);
		return `${i ? 'L' : 'M'}${sx.toFixed(1)},${sy.toFixed(1)}`;
	}).join('') + 'Z';

export const Hand: React.FC<{view: View; tilt: number; morph: number; armOpacity: number}> = ({view, tilt, morph, armOpacity}) => {
	const id = useSvgId('hd');
	const hand = handOutline(tilt);
	const shape = morphOutline(hand, FLOW.outline, morph);
	const d = outlineD(view, shape);
	const th = (tilt * Math.PI) / 180;
	const wrist = toScreen(view, 2 * Math.cos(th) - 0.02, -2 * Math.sin(th) + 0.02);
	const shoulder = toScreen(view, 3.4, -0.1);
	return (
		<g>
			<defs>
				<linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#ffd9b3" />
					<stop offset="60%" stopColor="#f2a877" />
					<stop offset="100%" stopColor="#c97a4f" />
				</linearGradient>
				<linearGradient id={`${id}m`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#ffffff" />
					<stop offset="45%" stopColor="#dbe6f3" />
					<stop offset="100%" stopColor="#7f95b8" />
				</linearGradient>
			</defs>
			<g opacity={armOpacity}>
				<line x1={shoulder[0]} y1={shoulder[1]} x2={wrist[0] - 10} y2={wrist[1]} stroke="#0f2a63" strokeWidth={view.s * 0.42} strokeLinecap="round" />
				<line x1={shoulder[0]} y1={shoulder[1] - view.s * 0.1} x2={wrist[0] - 10} y2={wrist[1] - view.s * 0.1} stroke="#2f5aa8" strokeWidth={view.s * 0.08} strokeLinecap="round" opacity={0.6} />
				<rect x={wrist[0] - view.s * 0.2} y={wrist[1] - view.s * 0.24} width={view.s * 0.16} height={view.s * 0.44} rx={view.s * 0.05} fill="#fff" opacity={0.9} transform={`rotate(${-tilt} ${wrist[0]} ${wrist[1]})`} />
			</g>
			<path d={d} fill={`url(#${id}s)`} opacity={1 - morph} stroke="#ffe8d2" strokeOpacity={0.6} strokeWidth={1.5} />
			<path d={d} fill={`url(#${id}m)`} opacity={morph} stroke="#fff" strokeOpacity={0.7} strokeWidth={1.5} />
		</g>
	);
};

/** Stylised modern car, side view, facing right. Artboard 1000 × 330. */
export const Car: React.FC<{x: number; y: number; width: number; wheelAngle: number; opacity?: number}> = ({x, y, width, wheelAngle, opacity = 1}) => {
	const id = useSvgId('car');
	const h = (width / 1000) * 330;
	const wheel = (cx: number) => (
		<g transform={`translate(${cx} 272)`}>
			<circle r={58} fill="#0b1226" />
			<circle r={40} fill="#5c6f92" />
			<circle r={34} fill="#273556" />
			<g transform={`rotate(${wheelAngle})`} stroke="#9fb0cb" strokeWidth={7} strokeLinecap="round">
				{[0, 72, 144, 216, 288].map((a) => (
					<line key={a} x1={0} y1={0} x2={30 * Math.cos((a * Math.PI) / 180)} y2={30 * Math.sin((a * Math.PI) / 180)} />
				))}
			</g>
			<circle r={9} fill="#cfd9e8" />
		</g>
	);
	return (
		<svg x={x} y={y} width={width} height={h} viewBox="0 0 1000 330" overflow="visible" opacity={opacity}>
			<defs>
				<linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#2a5cb8" />
					<stop offset="45%" stopColor={COLORS.navy600} />
					<stop offset="100%" stopColor={COLORS.navy800} />
				</linearGradient>
				<linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="#bfe3ff" stopOpacity={0.9} />
					<stop offset="100%" stopColor="#5c8fd6" stopOpacity={0.85} />
				</linearGradient>
			</defs>
			<ellipse cx={510} cy={318} rx={470} ry={14} fill="#000" opacity={0.25} />
			<path
				d="M 40,232 C 40,202 62,186 102,180 L 252,168 C 304,118 362,88 452,84 L 640,84 C 702,84 762,120 822,164 L 922,180 C 962,186 976,206 976,232 L 976,252 C 976,264 966,272 950,272 L 60,272 C 48,272 40,264 40,252 Z"
				fill={`url(#${id}b)`}
			/>
			<path d="M 300,166 C 340,120 392,100 452,98 L 560,98 L 560,166 Z" fill={`url(#${id}g)`} />
			{/* front window open: dark interior */}
			<path d="M 580,98 L 640,98 C 692,100 742,130 782,166 L 580,166 Z" fill="#06102a" />
			<path d="M 60,208 L 960,200" stroke={COLORS.orange} strokeWidth={4} opacity={0.9} />
			<path d="M 120,186 C 400,176 700,176 930,186" stroke="#fff" strokeWidth={3} opacity={0.25} fill="none" />
			<rect x={600} y={190} width={50} height={8} rx={4} fill="#9fb4d6" />
			<rect x={940} y={196} width={30} height={14} rx={6} fill="#fff2c4" />
			<rect x={44} y={196} width={22} height={14} rx={5} fill="#ff4d4d" />
			{wheel(232)}
			{wheel(792)}
		</svg>
	);
};
