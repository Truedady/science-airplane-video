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
		const thumb = 0.12 * Math.exp(-(((s - 0.6) / 0.1) ** 2));
		const knuckle = 0.04 * Math.exp(-(((s - 0.4) / 0.07) ** 2));
		const y = upper ? (0.17 + 0.1 * s) * round + thumb + knuckle : -(0.14 + 0.08 * s) * round;
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

export const Hand: React.FC<{view: View; tilt: number; morph: number; armOpacity: number; shoulder?: [number, number]}> = ({
	view,
	tilt,
	morph,
	armOpacity,
	shoulder: shoulderAt,
}) => {
	const id = useSvgId('hd');
	const hand = handOutline(tilt);
	const shape = morphOutline(hand, FLOW.outline, morph);
	const d = outlineD(view, shape);
	const th = (tilt * Math.PI) / 180;
	const wrist = toScreen(view, 2 * Math.cos(th) - 0.02, -2 * Math.sin(th) + 0.02);
	const shoulder = shoulderAt ?? toScreen(view, 3.4, -0.1);
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
				<line x1={shoulder[0]} y1={shoulder[1]} x2={wrist[0] - 10} y2={wrist[1]} stroke="#0f2a63" strokeWidth={view.s * 0.5} strokeLinecap="round" />
				<line x1={shoulder[0]} y1={shoulder[1] - view.s * 0.1} x2={wrist[0] - 10} y2={wrist[1] - view.s * 0.1} stroke="#2f5aa8" strokeWidth={view.s * 0.08} strokeLinecap="round" opacity={0.6} />
				<rect x={wrist[0] - view.s * 0.2} y={wrist[1] - view.s * 0.24} width={view.s * 0.16} height={view.s * 0.44} rx={view.s * 0.05} fill="#fff" opacity={0.9} transform={`rotate(${-tilt} ${wrist[0]} ${wrist[1]})`} />
			</g>
			<path d={d} fill={`url(#${id}s)`} opacity={1 - morph} stroke="#ffe8d2" strokeOpacity={0.6} strokeWidth={1.5} />
			<path d={d} fill={`url(#${id}m)`} opacity={morph} stroke="#fff" strokeOpacity={0.7} strokeWidth={1.5} />
		</g>
	);
};

/**
 * Modern sedan, side view, facing right. Artboard 1000 × 340, tyres touch y = 332.
 * The front door window is open (dark interior) so an arm can come out of it.
 * CAR anchors are in artboard units.
 */
export const CAR = {
	w: 1000,
	h: 340,
	ground: 332,
	window: {x0: 562, x1: 732, y0: 101, y1: 165},
	wheels: [228, 813],
};

const CAR_BODY =
	'M 30,232 C 28,205 40,190 70,186 L 205,178 C 240,176 262,170 280,160 C 330,118 380,96 450,92 L 610,92 C 660,93 700,110 745,140 C 770,157 790,166 820,170 L 930,182 C 960,186 975,200 978,222 L 980,248 C 980,262 970,270 955,272 L 885,272 A 72 72 0 0 0 741,272 L 300,272 A 72 72 0 0 0 156,272 L 45,272 C 35,272 30,262 30,250 Z';

export const Car: React.FC<{x: number; y: number; width: number; wheelAngle: number; opacity?: number; dim?: number; style?: React.CSSProperties}> = ({
	x,
	y,
	width,
	wheelAngle,
	opacity = 1,
	dim = 0,
	style,
}) => {
	const id = useSvgId('car');
	const h = (width / CAR.w) * CAR.h;
	const wheel = (cx: number) => (
		<g transform={`translate(${cx} 272)`}>
			<circle r={62} fill="#070d1d" />
			<circle r={56} fill="#111a30" />
			<circle r={40} fill={`url(#${id}rim)`} />
			<g transform={`rotate(${wheelAngle})`} fill="#d7e1ef">
				{[0, 72, 144, 216, 288].map((a) => (
					<path key={a} d="M -5,-8 L -9,-37 L 9,-37 L 5,-8 Z" transform={`rotate(${a})`} />
				))}
			</g>
			<circle r={40} fill="none" stroke="#e6edf7" strokeWidth={3} />
			<circle r={10} fill="#8a9bb8" />
			<circle r={4} fill="#e6edf7" />
		</g>
	);
	return (
		<svg x={x} y={y} width={width} height={h} viewBox="0 0 1000 340" overflow="visible" opacity={opacity} style={style}>
			<defs>
				<linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#3a72d0" />
					<stop offset="30%" stopColor="#1d4fa8" />
					<stop offset="62%" stopColor={COLORS.navy600} />
					<stop offset="100%" stopColor={COLORS.navy800} />
				</linearGradient>
				<linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="#d6eeff" stopOpacity={0.95} />
					<stop offset="55%" stopColor="#7fb1ea" stopOpacity={0.9} />
					<stop offset="100%" stopColor="#3f73c2" stopOpacity={0.9} />
				</linearGradient>
				<radialGradient id={`${id}rim`} cx="40%" cy="35%" r="70%">
					<stop offset="0%" stopColor="#9fb0cb" />
					<stop offset="100%" stopColor="#4a5b7c" />
				</radialGradient>
				<linearGradient id={`${id}sh`} x1="0" y1="0" x2="1" y2="0">
					<stop offset="0%" stopColor="#fff" stopOpacity={0} />
					<stop offset="50%" stopColor="#fff" stopOpacity={0.55} />
					<stop offset="100%" stopColor="#fff" stopOpacity={0} />
				</linearGradient>
			</defs>
			{/* ground shadow */}
			<ellipse cx={505} cy={334} rx={470} ry={12} fill="#000" opacity={0.35} />
			{/* tyres sit inside the arches, behind the body edge */}
			{wheel(228)}
			{wheel(813)}
			<path d={CAR_BODY} fill={`url(#${id}b)`} />
			{/* wheel-arch lips */}
			<path d="M 156,272 A 72 72 0 0 1 300,272" fill="none" stroke="#0a1838" strokeWidth={6} />
			<path d="M 741,272 A 72 72 0 0 1 885,272" fill="none" stroke="#0a1838" strokeWidth={6} />
			{/* greenhouse */}
			<path d="M 292,168 C 334,124 384,104 450,101 L 548,101 L 548,168 Z" fill={`url(#${id}g)`} />
			<path d="M 300,165 C 330,140 350,124 372,113 L 400,113 C 370,130 345,148 320,165 Z" fill="#fff" opacity={0.35} />
			{/* B-pillar */}
			<rect x={548} y={98} width={14} height={72} fill="#0a1838" />
			{/* front door window: open, dark cabin */}
			<path d="M 562,101 L 606,101 C 650,103 690,122 724,148 L 732,168 L 562,168 Z" fill="#050b1c" />
			<path d="M 640,168 C 650,150 668,140 690,138" fill="none" stroke="#14244a" strokeWidth={8} />
			{/* window trim */}
			<path d="M 292,168 C 334,124 384,104 450,101 L 606,101 C 650,103 690,122 724,148 L 732,168" fill="none" stroke="#c9d6ea" strokeWidth={3} opacity={0.8} />
			<line x1={292} y1={170} x2={736} y2={170} stroke="#c9d6ea" strokeWidth={3} opacity={0.8} />
			{/* body lines & shine */}
			<path d="M 60,212 C 300,204 650,202 965,206" fill="none" stroke="#5f93e6" strokeWidth={3} opacity={0.6} />
			<path d="M 110,190 C 350,182 700,182 930,190" fill="none" stroke={`url(#${id}sh)`} strokeWidth={6} />
			<path d="M 70,236 L 960,236" stroke={COLORS.orange} strokeWidth={3} opacity={0.85} />
			{/* door seams */}
			<path d="M 300,172 L 300,262" stroke="#0a1838" strokeWidth={2.5} />
			<path d="M 555,170 L 555,262" stroke="#0a1838" strokeWidth={2.5} />
			<path d="M 738,170 C 742,200 742,230 734,262" fill="none" stroke="#0a1838" strokeWidth={2.5} />
			{/* handles */}
			<rect x={470} y={190} width={44} height={8} rx={4} fill="#a9bddb" />
			<rect x={670} y={190} width={44} height={8} rx={4} fill="#a9bddb" />
			{/* mirror */}
			<path d="M 728,158 C 734,146 752,144 766,150 L 768,166 L 734,168 Z" fill={COLORS.navy700} />
			{/* lights */}
			<path d="M 944,192 C 958,193 968,200 972,212 L 944,212 Z" fill="#fff4cf" />
			<path d="M 34,198 L 62,194 L 62,214 L 34,214 Z" fill="#ff4d4d" />
			<rect x={950} y={246} width={26} height={8} rx={4} fill="#9fb4d6" />
			{dim > 0 ? (
				<g fill={COLORS.navy900} opacity={dim}>
					<path d={CAR_BODY} />
					<circle cx={228} cy={272} r={62} />
					<circle cx={813} cy={272} r={62} />
				</g>
			) : null}
		</svg>
	);
};
