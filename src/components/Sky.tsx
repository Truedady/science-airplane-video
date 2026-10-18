import React, {useMemo} from 'react';
import {AbsoluteFill} from 'remotion';
import {rng} from '../lib/anim';
import {COLORS} from '../theme';

type Mood = 'dawn' | 'day' | 'lab' | 'dusk';

const GRADIENTS: Record<Mood, string> = {
	dawn: `linear-gradient(180deg, ${COLORS.navy900} 0%, ${COLORS.navy700} 34%, ${COLORS.sky500} 68%, #9fd2ff 86%, #ffd2a1 100%)`,
	day: `linear-gradient(180deg, #0b2d6e 0%, ${COLORS.sky500} 45%, ${COLORS.sky300} 80%, #e6f4ff 100%)`,
	lab: `radial-gradient(120% 90% at 50% 40%, #0d2a66 0%, ${COLORS.navy800} 50%, ${COLORS.navy900} 100%)`,
	dusk: `linear-gradient(180deg, ${COLORS.navy900} 0%, #0c2462 38%, #2d5fae 66%, #f2a46a 90%, #ffcf96 100%)`,
};

/** Layered sky: gradient, sun glow, high-altitude haze and optional stars. */
export const Sky: React.FC<{
	mood?: Mood;
	sunX?: number;
	sunY?: number;
	sunGlow?: number;
	stars?: number;
	frame?: number;
}> = ({mood = 'dawn', sunX = 1500, sunY = 860, sunGlow = 1, stars = 0, frame = 0}) => {
	const starField = useMemo(() => {
		const r = rng(42);
		return new Array(90).fill(0).map(() => ({x: r() * 1920, y: r() * 560, s: 0.6 + r() * 1.6, p: r() * 6.28}));
	}, []);
	return (
		<AbsoluteFill style={{background: GRADIENTS[mood]}}>
			{stars > 0 ? (
				<svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
					{starField.map((s, i) => (
						<circle
							key={i}
							cx={s.x}
							cy={s.y}
							r={s.s}
							fill="#fff"
							opacity={stars * (0.35 + 0.35 * Math.sin(frame * 0.05 + s.p)) * (1 - s.y / 600)}
						/>
					))}
				</svg>
			) : null}
			<div
				style={{
					position: 'absolute',
					left: sunX - 900,
					top: sunY - 900,
					width: 1800,
					height: 1800,
					borderRadius: '50%',
					background: `radial-gradient(circle, rgba(255,214,160,${0.75 * sunGlow}) 0%, rgba(255,170,90,${0.35 * sunGlow}) 14%, rgba(255,150,80,${0.12 * sunGlow}) 32%, rgba(255,150,80,0) 60%)`,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: sunX - 60,
					top: sunY - 60,
					width: 120,
					height: 120,
					borderRadius: '50%',
					background: `radial-gradient(circle, rgba(255,250,235,${sunGlow}) 0%, rgba(255,230,190,${0.8 * sunGlow}) 40%, rgba(255,200,140,0) 72%)`,
				}}
			/>
		</AbsoluteFill>
	);
};

/** Blueprint-style scientific backdrop: deep navy, faint grid, vignette. */
export const LabBackdrop: React.FC<{gridOpacity?: number; offsetX?: number}> = ({gridOpacity = 1, offsetX = 0}) => {
	return (
		<AbsoluteFill style={{background: GRADIENTS.lab}}>
			<svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity: gridOpacity}}>
				<defs>
					<pattern id="grid-s" width="40" height="40" patternUnits="userSpaceOnUse" x={-offsetX % 40}>
						<path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(140,201,255,0.06)" strokeWidth="1" />
					</pattern>
					<pattern id="grid-l" width="200" height="200" patternUnits="userSpaceOnUse" x={-offsetX % 200}>
						<rect width="200" height="200" fill="url(#grid-s)" />
						<path d="M 200 0 L 0 0 0 200" fill="none" stroke="rgba(140,201,255,0.11)" strokeWidth="1" />
					</pattern>
					<radialGradient id="lab-vig" cx="50%" cy="45%" r="75%">
						<stop offset="55%" stopColor="#000" stopOpacity="0" />
						<stop offset="100%" stopColor="#000" stopOpacity="0.55" />
					</radialGradient>
				</defs>
				<rect width="1920" height="1080" fill="url(#grid-l)" />
				<rect width="1920" height="1080" fill="url(#lab-vig)" />
			</svg>
		</AbsoluteFill>
	);
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.5}) => (
	<AbsoluteFill
		style={{
			pointerEvents: 'none',
			background: `radial-gradient(ellipse 80% 75% at 50% 50%, rgba(0,0,0,0) 55%, rgba(2,8,25,${strength}) 100%)`,
		}}
	/>
);
