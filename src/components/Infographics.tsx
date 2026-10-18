import React from 'react';
import {useSvgId} from '../lib/anim';
import {COLORS, FONT_BODY, FONT_DISPLAY} from '../theme';

/**
 * Animated force vector. (x, y) is the point of application; `angle` is in
 * degrees, 0 = straight up, 90 = right, 180 = down, 270 = left.
 */
export const ForceArrow: React.FC<{
	x: number;
	y: number;
	angle: number;
	length: number;
	progress: number;
	color: string;
	width?: number;
	label?: string;
	sublabel?: string;
	labelPos?: 'end' | 'left' | 'right';
	labelSize?: number;
	glow?: number;
	opacity?: number;
	startGap?: number;
}> = ({
	x,
	y,
	angle,
	length,
	progress,
	color,
	width = 22,
	label,
	sublabel,
	labelPos = 'end',
	labelSize = 34,
	glow = 0.6,
	opacity = 1,
	startGap = 0,
}) => {
	const id = useSvgId('fa');
	if (progress <= 0.001) return null;
	const L = Math.max(0.01, length * progress);
	const head = Math.min(width * 2.1, L * 0.55);
	const hw = width * 1.25;
	const sw = width / 2;
	const a = (angle * Math.PI) / 180;
	const dx = Math.sin(a);
	const dy = -Math.cos(a);
	const ex = x + dx * (startGap + L);
	const ey = y + dy * (startGap + L);
	// arrow drawn pointing up in local coords then rotated
	const shape = `M ${-sw * 0.7},0 L ${sw * 0.7},0 L ${sw},${-(L - head)} L ${hw},${-(L - head)} L 0,${-L} L ${-hw},${-(L - head)} L ${-sw},${-(L - head)} Z`;
	const lx = labelPos === 'end' ? ex + dx * 34 : ex + (labelPos === 'left' ? -1 : 1) * 30;
	const ly = labelPos === 'end' ? ey + dy * 34 : ey;
	const anchor = labelPos === 'left' ? 'end' : labelPos === 'right' ? 'start' : Math.abs(dx) < 0.3 ? 'middle' : dx > 0 ? 'start' : 'end';
	const baseline = labelPos === 'end' && dy > 0.5 ? labelSize * 0.9 : 0;
	return (
		<g opacity={opacity}>
			<defs>
				<linearGradient id={`${id}g`} x1="0" y1="1" x2="0" y2="0">
					<stop offset="0%" stopColor={color} stopOpacity={0.25} />
					<stop offset="40%" stopColor={color} stopOpacity={0.95} />
					<stop offset="100%" stopColor="#ffffff" />
				</linearGradient>
				<filter id={`${id}b`} x="-100%" y="-100%" width="300%" height="300%">
					<feGaussianBlur stdDeviation={width * 0.7} />
				</filter>
			</defs>
			<g transform={`translate(${x + dx * startGap} ${y + dy * startGap}) rotate(${angle})`}>
				{glow > 0 ? <path d={shape} fill={color} opacity={glow} filter={`url(#${id}b)`} /> : null}
				<path d={shape} fill={`url(#${id}g)`} stroke={color} strokeWidth={2} strokeLinejoin="round" />
			</g>
			{label ? (
				<g opacity={Math.min(1, Math.max(0, (progress - 0.55) / 0.35))}>
					<text
						x={lx}
						y={ly + baseline}
						textAnchor={anchor}
						dominantBaseline="middle"
						fontFamily={FONT_DISPLAY}
						fontWeight={700}
						fontSize={labelSize}
						letterSpacing={labelSize * 0.12}
						fill="#fff"
						style={{paintOrder: 'stroke', stroke: 'rgba(3,11,31,0.55)', strokeWidth: 6}}
					>
						{label}
					</text>
					{sublabel ? (
						<text
							x={lx}
							y={ly + baseline + labelSize * 0.95}
							textAnchor={anchor}
							dominantBaseline="middle"
							fontFamily={FONT_BODY}
							fontWeight={500}
							fontSize={labelSize * 0.56}
							fill={color}
							style={{paintOrder: 'stroke', stroke: 'rgba(3,11,31,0.55)', strokeWidth: 5}}
						>
							{sublabel}
						</text>
					) : null}
				</g>
			) : null}
		</g>
	);
};

/** Circular instrument gauge (270° sweep). No numbers — qualitative only. */
export const Gauge: React.FC<{
	cx: number;
	cy: number;
	r: number;
	value: number;
	label: string;
	color?: string;
	opacity?: number;
	status?: string;
	ticks?: number;
}> = ({cx, cy, r, value, label, color = COLORS.cyan, opacity = 1, status, ticks = 9}) => {
	const id = useSvgId('ga');
	const start = 135;
	const sweep = 270;
	const pt = (deg: number, rr: number): [number, number] => [cx + rr * Math.cos((deg * Math.PI) / 180), cy + rr * Math.sin((deg * Math.PI) / 180)];
	const arc = (from: number, to: number, rr: number) => {
		const [x1, y1] = pt(from, rr);
		const [x2, y2] = pt(to, rr);
		const large = to - from > 180 ? 1 : 0;
		return `M ${x1} ${y1} A ${rr} ${rr} 0 ${large} 1 ${x2} ${y2}`;
	};
	const v = Math.max(0, Math.min(1, value));
	const needle = start + sweep * v;
	const [nx, ny] = pt(needle, r * 0.78);
	return (
		<g opacity={opacity}>
			<defs>
				<radialGradient id={`${id}bg`} cx="50%" cy="40%" r="60%">
					<stop offset="0%" stopColor="#123478" stopOpacity={0.9} />
					<stop offset="100%" stopColor="#030b1f" stopOpacity={0.92} />
				</radialGradient>
				<filter id={`${id}gl`} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation="5" />
				</filter>
			</defs>
			<circle cx={cx} cy={cy} r={r * 1.12} fill={`url(#${id}bg)`} stroke="rgba(140,201,255,0.35)" strokeWidth={2} />
			<path d={arc(start, start + sweep, r * 0.9)} fill="none" stroke="rgba(140,201,255,0.18)" strokeWidth={r * 0.1} strokeLinecap="round" />
			{v > 0.002 ? (
				<>
					<path d={arc(start, needle, r * 0.9)} fill="none" stroke={color} strokeWidth={r * 0.1} strokeLinecap="round" filter={`url(#${id}gl)`} opacity={0.8} />
					<path d={arc(start, needle, r * 0.9)} fill="none" stroke={color} strokeWidth={r * 0.1} strokeLinecap="round" />
				</>
			) : null}
			{new Array(ticks).fill(0).map((_, i) => {
				const d = start + (sweep * i) / (ticks - 1);
				const [x1, y1] = pt(d, r * 0.68);
				const [x2, y2] = pt(d, r * 0.76);
				return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(196,228,255,0.6)" strokeWidth={2} />;
			})}
			<line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#fff" strokeWidth={4} strokeLinecap="round" />
			<circle cx={cx} cy={cy} r={r * 0.09} fill="#fff" />
			<text x={cx} y={cy + r * 0.52} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={r * 0.2} letterSpacing={r * 0.03} fill="#fff">
				{label}
			</text>
			{status ? (
				<text x={cx} y={cy + r * 1.42} textAnchor="middle" fontFamily={FONT_BODY} fontWeight={600} fontSize={r * 0.2} letterSpacing={r * 0.02} fill={color}>
					{status}
				</text>
			) : null}
		</g>
	);
};

/** Vertical meter with a reference marker (e.g. LIFT bar vs WEIGHT line). */
export const Meter: React.FC<{
	x: number;
	y: number;
	h: number;
	value: number;
	marker?: number;
	label: string;
	markerLabel?: string;
	color?: string;
	opacity?: number;
}> = ({x, y, h, value, marker, label, markerLabel, color = COLORS.cyan, opacity = 1}) => {
	const v = Math.max(0, Math.min(1, value));
	const w = 34;
	return (
		<g opacity={opacity}>
			<rect x={x - 10} y={y - 10} width={w + 20} height={h + 20} rx={14} fill="rgba(3,11,31,0.75)" stroke="rgba(140,201,255,0.3)" strokeWidth={2} />
			<rect x={x} y={y} width={w} height={h} rx={8} fill="rgba(140,201,255,0.12)" />
			<rect x={x} y={y + h * (1 - v)} width={w} height={h * v} rx={8} fill={color} />
			{marker !== undefined ? (
				<g>
					<line x1={x - 18} x2={x + w + 18} y1={y + h * (1 - marker)} y2={y + h * (1 - marker)} stroke="#fff" strokeWidth={3} strokeDasharray="6 5" />
					{markerLabel ? (
						<text x={x + w + 26} y={y + h * (1 - marker)} dominantBaseline="middle" fontFamily={FONT_BODY} fontWeight={600} fontSize={20} fill="#fff">
							{markerLabel}
						</text>
					) : null}
				</g>
			) : null}
			<text x={x + w / 2} y={y + h + 44} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={20} letterSpacing={2} fill={color}>
				{label}
			</text>
		</g>
	);
};

/** A thin leader line from a point to a text label, drawn on with `progress`. */
export const Callout: React.FC<{
	from: [number, number];
	to: [number, number];
	progress: number;
	title: string;
	subtitle?: string;
	color?: string;
	align?: 'start' | 'end';
	size?: number;
}> = ({from, to, progress, title, subtitle, color = COLORS.cyan, align = 'start', size = 26}) => {
	if (progress <= 0) return null;
	const lineP = Math.min(1, progress * 1.6);
	const textP = Math.max(0, Math.min(1, (progress - 0.45) / 0.55));
	const mx = from[0] + (to[0] - from[0]) * lineP;
	const my = from[1] + (to[1] - from[1]) * lineP;
	const dir = align === 'start' ? 1 : -1;
	return (
		<g>
			<circle cx={from[0]} cy={from[1]} r={6} fill={color} />
			<circle cx={from[0]} cy={from[1]} r={13} fill="none" stroke={color} strokeWidth={2} opacity={0.5} />
			<line x1={from[0]} y1={from[1]} x2={mx} y2={my} stroke={color} strokeWidth={2} />
			<line x1={to[0]} y1={to[1]} x2={to[0] + dir * 50 * textP} y2={to[1]} stroke={color} strokeWidth={2} />
			<g opacity={textP} transform={`translate(${(1 - textP) * -12 * dir} 0)`}>
				<text
					x={to[0] + dir * 64}
					y={to[1] - 4}
					textAnchor={align}
					fontFamily={FONT_DISPLAY}
					fontWeight={700}
					fontSize={size}
					letterSpacing={size * 0.1}
					fill="#fff"
					style={{paintOrder: 'stroke', stroke: 'rgba(3,11,31,0.5)', strokeWidth: 5}}
				>
					{title}
				</text>
				{subtitle ? (
					<text
						x={to[0] + dir * 64}
						y={to[1] + size * 0.95}
						textAnchor={align}
						fontFamily={FONT_BODY}
						fontWeight={500}
						fontSize={size * 0.7}
						fill={color}
						style={{paintOrder: 'stroke', stroke: 'rgba(3,11,31,0.5)', strokeWidth: 4}}
					>
						{subtitle}
					</text>
				) : null}
			</g>
		</g>
	);
};
