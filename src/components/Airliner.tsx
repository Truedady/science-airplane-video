import React from 'react';
import {useSvgId} from '../lib/anim';
import {COLORS} from '../theme';

/**
 * Original side-view twin-engine passenger jet, nose to the right.
 * Native artboard: 1000 × 300. Anchor points (artboard units) are exported
 * in PLANE so force arrows / callouts can be attached precisely.
 */
export const PLANE = {
	w: 1000,
	h: 300,
	cg: [530, 158] as [number, number],
	wingCentre: [470, 222] as [number, number],
	engine: [560, 222] as [number, number],
	engineExhaust: [492, 222] as [number, number],
	farEngine: [602, 194] as [number, number],
	nose: [952, 150] as [number, number],
	tailTip: [60, 10] as [number, number],
	belly: [600, 192] as [number, number],
};

const FUSELAGE =
	'M 46,112 C 120,108 200,106 300,106 L 830,106 C 890,106 935,124 950,146 C 958,158 952,170 935,178 C 905,190 870,192 840,192 L 330,192 C 250,192 170,170 110,146 C 80,134 56,124 46,118 Z';
const NEAR_WING = 'M 598,174 L 432,180 L 352,268 L 394,268 Z';
const FAR_WING = 'M 595,122 L 445,118 L 382,50 L 410,50 Z';
const TAIL_FIN = 'M 118,110 L 50,14 C 48,8 52,6 58,6 L 98,6 C 104,6 108,9 112,14 L 252,108 Z';

export const Airliner: React.FC<{
	x?: number;
	y?: number;
	width?: number;
	frame?: number;
	engineGlow?: number;
	engineHighlight?: number;
	wingGlow?: number;
	gear?: number;
	navLights?: boolean;
	silhouette?: number;
	silhouetteColor?: string;
	style?: React.CSSProperties;
}> = ({
	x = 0,
	y = 0,
	width = 1000,
	frame = 0,
	engineGlow = 0,
	engineHighlight = 0,
	wingGlow = 0,
	gear = 0,
	navLights = true,
	silhouette = 0,
	silhouetteColor = COLORS.navy900,
	style,
}) => {
	const id = useSvgId('ac');
	const h = (width / PLANE.w) * PLANE.h;
	const beacon = navLights && frame % 36 < 4 ? 1 : 0;
	const strobe = navLights && frame % 48 > 44 ? 1 : 0;
	return (
		<svg x={x} y={y} width={width} height={h} viewBox="0 0 1000 300" overflow="visible" style={style}>
			<defs>
				<linearGradient id={`${id}fus`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#ffffff" />
					<stop offset="40%" stopColor="#f1f6fc" />
					<stop offset="72%" stopColor="#cfdbea" />
					<stop offset="100%" stopColor="#8fa4c3" />
				</linearGradient>
				<linearGradient id={`${id}belly`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={COLORS.navy600} />
					<stop offset="100%" stopColor={COLORS.navy800} />
				</linearGradient>
				<linearGradient id={`${id}wing`} x1="0" y1="0" x2="0.3" y2="1">
					<stop offset="0%" stopColor="#e9f0f8" />
					<stop offset="55%" stopColor="#b9c9de" />
					<stop offset="100%" stopColor="#8197b8" />
				</linearGradient>
				<linearGradient id={`${id}far`} x1="0" y1="1" x2="0" y2="0">
					<stop offset="0%" stopColor="#9fb2cc" />
					<stop offset="100%" stopColor="#6d84a8" />
				</linearGradient>
				<linearGradient id={`${id}tail`} x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor={COLORS.navy600} />
					<stop offset="100%" stopColor={COLORS.navy800} />
				</linearGradient>
				<linearGradient id={`${id}nac`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#f6f9fd" />
					<stop offset="50%" stopColor="#c4d2e4" />
					<stop offset="100%" stopColor="#7d93b4" />
				</linearGradient>
				<linearGradient id={`${id}spec`} x1="0" y1="0" x2="1" y2="0">
					<stop offset="0%" stopColor="#fff" stopOpacity="0" />
					<stop offset="40%" stopColor="#fff" stopOpacity="0.9" />
					<stop offset="100%" stopColor="#fff" stopOpacity="0" />
				</linearGradient>
				<radialGradient id={`${id}heat`} cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor="#fff3d6" stopOpacity="1" />
					<stop offset="35%" stopColor={COLORS.orange} stopOpacity="0.8" />
					<stop offset="100%" stopColor={COLORS.orangeDeep} stopOpacity="0" />
				</radialGradient>
				<radialGradient id={`${id}glow`} cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor={COLORS.cyan} stopOpacity="0.9" />
					<stop offset="100%" stopColor={COLORS.cyan} stopOpacity="0" />
				</radialGradient>
				<clipPath id={`${id}clip`}>
					<path d={FUSELAGE} />
				</clipPath>
				<filter id={`${id}blur`} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="6" />
				</filter>
			</defs>

			{/* far side: wing, stabiliser, engine */}
			<path d={FAR_WING} fill={`url(#${id}far)`} />
			<path d="M 196,118 L 118,116 L 72,90 L 94,90 Z" fill={`url(#${id}far)`} />
			<g>
				<path d="M 652,184 C 652,176 658,172 664,172 L 600,172 L 548,178 L 548,206 L 600,210 L 664,212 C 658,212 652,206 652,198 Z" fill="#7f94b5" />
				<ellipse cx={656} cy={192} rx={6} ry={20} fill="#3b4f72" />
			</g>

			{/* vertical tail */}
			<path d={TAIL_FIN} fill={`url(#${id}tail)`} />
			<path d="M 64,18 C 110,40 150,70 196,104 L 226,104 C 170,64 118,32 70,10 Z" fill={COLORS.orange} opacity={0.95} />
			<path d="M 72,40 C 110,62 140,84 168,104 L 182,104 C 150,78 116,56 76,30 Z" fill={COLORS.cyan} opacity={0.7} />

			{/* fuselage */}
			<path d={FUSELAGE} fill={`url(#${id}fus)`} />
			<g clipPath={`url(#${id}clip)`}>
				<path d="M 0,170 C 300,166 600,168 1000,160 L 1000,300 L 0,300 Z" fill={`url(#${id}belly)`} />
				<path d="M 120,163 C 400,160 700,162 960,152 L 960,157 C 700,167 400,166 120,168 Z" fill={COLORS.orange} />
				<rect x={240} y={110} width={640} height={8} rx={4} fill={`url(#${id}spec)`} opacity={0.8} />
			</g>
			{/* windows */}
			{new Array(34).fill(0).map((_, i) => {
				const wx = 300 + i * 15.5;
				if (i === 3 || i === 20) return null;
				return <rect key={i} x={wx} y={133} width={7} height={11} rx={3.5} fill={COLORS.navy700} opacity={0.88} />;
			})}
			{/* doors */}
			<rect x={340} y={124} width={18} height={40} rx={4} fill="none" stroke="#97aac6" strokeWidth={1.5} />
			<rect x={608} y={124} width={18} height={40} rx={4} fill="none" stroke="#97aac6" strokeWidth={1.5} />
			<rect x={858} y={122} width={18} height={40} rx={4} fill="none" stroke="#97aac6" strokeWidth={1.5} />
			{/* cockpit */}
			<path d="M 896,125 L 921,126 L 938,139 L 902,140 Z" fill={COLORS.navy800} />
			<path d="M 900,127 L 916,127.5 L 905,138 L 902,138 Z" fill="#9fd1ff" opacity={0.55} />

			{/* near horizontal stabiliser */}
			<path d="M 206,140 L 128,138 L 64,180 L 90,182 Z" fill={`url(#${id}wing)`} />

			{/* landing gear */}
			{gear > 0.01 ? (
				<g opacity={Math.min(1, gear * 1.5)}>
					<rect x={478} y={186} width={7} height={46 * gear} fill="#5f7192" />
					<circle cx={472} cy={186 + 50 * gear} r={13 * gear} fill="#1c2742" />
					<circle cx={492} cy={186 + 50 * gear} r={13 * gear} fill="#26324f" />
					<rect x={858} y={186} width={5} height={36 * gear} fill="#5f7192" />
					<circle cx={860} cy={186 + 40 * gear} r={10 * gear} fill="#1c2742" />
				</g>
			) : null}

			{/* near wing */}
			<path d={NEAR_WING} fill={`url(#${id}wing)`} />
			<path d="M 598,174 L 394,268 L 386,268 L 588,174 Z" fill="#fff" opacity={0.75} />
			<path d="M 394,268 L 352,268 L 372,234 L 382,234 Z" fill={`url(#${id}tail)`} />
			<path d="M 442,186 L 368,266" stroke="#8ea0bd" strokeWidth={1.5} />
			{wingGlow > 0 ? (
				<g opacity={wingGlow}>
					<path d={NEAR_WING} fill={`url(#${id}glow)`} filter={`url(#${id}blur)`} />
					<path d={NEAR_WING} fill="none" stroke={COLORS.cyan} strokeWidth={4} strokeLinejoin="round" />
				</g>
			) : null}

			{/* near engine */}
			<path d="M 536,206 L 566,186 L 588,186 L 576,206 Z" fill="#a9b9d0" />
			<path
				d="M 612,212 C 612,204 606,200 600,200 L 528,202 C 515,203 505,210 498,214 L 498,230 C 505,234 515,241 528,242 L 600,244 C 606,244 612,240 612,232 Z"
				fill={`url(#${id}nac)`}
			/>
			<ellipse cx={612} cy={222} rx={7} ry={22} fill="#33476a" />
			<ellipse cx={612} cy={222} rx={3.5} ry={9} fill="#9fb0c9" />
			<path d="M 498,214 L 484,218 L 484,226 L 498,230 Z" fill="#5c6f90" />
			<path d="M 520,226 L 600,228" stroke={COLORS.orange} strokeWidth={2.5} opacity={0.9} />

			{/* engine heat / highlight */}
			{engineGlow > 0 ? (
				<g opacity={engineGlow}>
					<ellipse cx={470} cy={222} rx={46} ry={20} fill={`url(#${id}heat)`} />
					<ellipse cx={536} cy={194} rx={34} ry={14} fill={`url(#${id}heat)`} opacity={0.6} />
				</g>
			) : null}
			{engineHighlight > 0 ? (
				<g opacity={engineHighlight} fill="none" stroke={COLORS.orange} strokeWidth={4}>
					<ellipse cx={556} cy={222} rx={74} ry={36} filter={`url(#${id}blur)`} />
					<ellipse cx={556} cy={222} rx={70} ry={32} />
					<ellipse cx={606} cy={192} rx={64} ry={26} strokeDasharray="8 7" opacity={0.85} />
				</g>
			) : null}

			{/* navigation lights */}
			{navLights ? (
				<g>
					<circle cx={372} cy={237} r={3} fill="#4dff9a" />
					<circle cx={58} cy={8} r={2.5 + strobe * 3} fill="#fff" opacity={0.5 + strobe * 0.5} />
					<circle cx={560} cy={104} r={3 + beacon * 4} fill="#ff3b3b" opacity={0.5 + beacon * 0.5} />
					{beacon ? <circle cx={560} cy={104} r={16} fill="#ff3b3b" opacity={0.25} /> : null}
				</g>
			) : null}

			{silhouette > 0 ? (
				<g opacity={silhouette} fill={silhouetteColor}>
					<path d={FAR_WING} />
					<path d={TAIL_FIN} />
					<path d={FUSELAGE} />
					<path d={NEAR_WING} />
					<path d="M 612,212 C 612,204 606,200 600,200 L 528,202 C 515,203 505,210 498,214 L 498,230 C 505,234 515,241 528,242 L 600,244 C 606,244 612,240 612,232 Z" />
					<path d="M 206,140 L 128,138 L 64,180 L 90,182 Z" />
				</g>
			) : null}
		</svg>
	);
};
