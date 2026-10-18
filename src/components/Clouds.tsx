import React, {useMemo} from 'react';
import {rng, useSvgId} from '../lib/anim';

type Puff = {dx: number; dy: number; r: number};
type CloudShape = {x: number; y: number; w: number; puffs: Puff[]};

const makeCloud = (r: () => number, x: number, y: number, w: number): CloudShape => {
	const puffs: Puff[] = [];
	const n = 5 + Math.floor(r() * 5);
	for (let i = 0; i < n; i++) {
		const t = i / (n - 1);
		const bell = Math.sin(t * Math.PI);
		puffs.push({
			dx: (t - 0.5) * w * 0.9 + (r() - 0.5) * w * 0.08,
			dy: -bell * w * 0.16 - r() * w * 0.06,
			r: w * (0.12 + bell * 0.14 + r() * 0.05),
		});
	}
	return {x, y, w, puffs};
};

/**
 * A horizontally scrolling layer of soft vector clouds. Deterministic
 * (seeded), wraps seamlessly over `span` pixels.
 */
export const CloudLayer: React.FC<{
	seed: number;
	count: number;
	y: [number, number];
	size: [number, number];
	scroll: number;
	span?: number;
	opacity?: number;
	blur?: number;
	shade?: string;
	light?: string;
	rim?: string;
	style?: React.CSSProperties;
}> = ({
	seed,
	count,
	y,
	size,
	scroll,
	span = 2800,
	opacity = 1,
	blur = 0,
	shade = '#a9c8ee',
	light = '#ffffff',
	rim = '#ffe2bf',
	style,
}) => {
	const id = useSvgId('cl');
	const clouds = useMemo(() => {
		const r = rng(seed);
		return new Array(count)
			.fill(0)
			.map((_, i) => makeCloud(r, (i / count) * span + r() * (span / count) * 0.6, y[0] + r() * (y[1] - y[0]), size[0] + r() * (size[1] - size[0])));
	}, [seed, count, span, y, size]);
	return (
		<svg
			width={1920}
			height={1080}
			viewBox="0 0 1920 1080"
			style={{position: 'absolute', inset: 0, opacity, filter: `blur(${blur || 1.2}px)`, overflow: 'visible', ...style}}
		>
			<defs>
				<radialGradient id={`${id}p`} cx="45%" cy="35%" r="65%">
					<stop offset="0%" stopColor={light} />
					<stop offset="55%" stopColor={light} stopOpacity={0.96} />
					<stop offset="100%" stopColor={shade} stopOpacity={0.9} />
				</radialGradient>
				<linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={light} stopOpacity={0.9} />
					<stop offset="100%" stopColor={shade} />
				</linearGradient>
			</defs>
			{clouds.map((cl, i) => {
				const px = ((((cl.x - scroll) % span) + span) % span) - (span - 1920) / 2;
				return (
					<g key={i} transform={`translate(${px} ${cl.y})`}>
						<g fill={shade}>
							<ellipse cx={0} cy={cl.w * 0.035} rx={cl.w * 0.5} ry={cl.w * 0.085} />
							{cl.puffs.map((p, j) => (
								<circle key={j} cx={p.dx + p.r * 0.05} cy={p.dy + p.r * 0.16} r={p.r} />
							))}
						</g>
						{cl.puffs.map((p, j) => (
							<circle key={`h${j}`} cx={p.dx - p.r * 0.05} cy={p.dy} r={p.r * 0.93} fill={`url(#${id}p)`} />
						))}
						<g fill={rim} opacity={0.22}>
							{cl.puffs.map((p, j) => (
								<ellipse key={`r${j}`} cx={p.dx + p.r * 0.2} cy={p.dy - p.r * 0.42} rx={p.r * 0.55} ry={p.r * 0.38} />
							))}
						</g>
						<rect x={-cl.w * 0.47} y={-cl.w * 0.01} width={cl.w * 0.94} height={cl.w * 0.06} rx={cl.w * 0.03} fill={`url(#${id}b)`} />
					</g>
				);
			})}
		</svg>
	);
};

/** A continuous sea of clouds along the bottom of the frame (the "above the clouds" look). */
export const CloudSea: React.FC<{
	seed?: number;
	top: number;
	scroll: number;
	shade?: string;
	light?: string;
	glow?: string;
	deep?: string;
	opacity?: number;
}> = ({seed = 7, top, scroll, shade = '#86acd9', light = '#f6faff', glow = '#ffe0bd', deep = '#3f6ca8', opacity = 1}) => {
	const id = useSvgId('cs');
	const rows = useMemo(() => {
		const r = rng(seed);
		const span = 3200;
		const make = (dy: number, rMin: number, rMax: number, gap: number) => {
			const arr: {x: number; y: number; r: number}[] = [];
			for (let x = 0; x < span; x += gap * (0.7 + r() * 0.6)) {
				arr.push({x, y: dy + r() * 26, r: rMin + r() * (rMax - rMin)});
			}
			return arr;
		};
		return {span, back: make(-30, 50, 95, 80), front: make(40, 80, 150, 120)};
	}, [seed]);
	const wrap = (x: number, depth: number) => ((((x - scroll * depth) % rows.span) + rows.span) % rows.span) - 640;
	return (
		<svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity, overflow: 'visible'}}>
			<defs>
				<radialGradient id={`${id}g`} cx="42%" cy="22%" r="78%">
					<stop offset="0%" stopColor={light} />
					<stop offset="40%" stopColor={light} stopOpacity={0.97} />
					<stop offset="85%" stopColor={shade} />
				</radialGradient>
				<radialGradient id={`${id}h`} cx="50%" cy="50%" r="50%">
					<stop offset="0%" stopColor={glow} stopOpacity={0.55} />
					<stop offset="100%" stopColor={glow} stopOpacity={0} />
				</radialGradient>
				<linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={shade} />
					<stop offset="100%" stopColor={deep} />
				</linearGradient>
			</defs>
			<g style={{filter: 'blur(2px)'}}>
				<g opacity={0.85}>
					{rows.back.map((p, i) => (
						<ellipse key={i} cx={wrap(p.x, 0.6)} cy={top + p.y} rx={p.r * 1.4} ry={p.r} fill={`url(#${id}g)`} />
					))}
				</g>
				<rect x={-100} y={top + 70} width={2120} height={1200} fill={`url(#${id}f)`} />
				{rows.front.map((p, i) => (
					<ellipse key={i} cx={wrap(p.x, 1)} cy={top + p.y + 40} rx={p.r * 1.5} ry={p.r} fill={`url(#${id}g)`} />
				))}
				{rows.front.map((p, i) =>
					i % 2 === 0 ? <ellipse key={`h${i}`} cx={wrap(p.x, 1) + p.r * 0.3} cy={top + p.y + 40 - p.r * 0.55} rx={p.r * 1.1} ry={p.r * 0.45} fill={`url(#${id}h)`} /> : null,
				)}
			</g>
		</svg>
	);
};
