import React from 'react';
import {EASE, prog} from '../lib/anim';
import {useInset} from '../lib/layout';
import {COLORS, FONT_BODY, FONT_DISPLAY} from '../theme';

/**
 * Kinetic headline: each word rises out of a mask, staggered.
 * `frame` and `at` are local frames; `out` (optional) starts the exit.
 */
export const Headline: React.FC<{
	text: string;
	frame: number;
	at: number;
	out?: number;
	size?: number;
	weight?: number;
	color?: string;
	accent?: string[];
	accentColor?: string;
	stagger?: number;
	style?: React.CSSProperties;
	align?: 'center' | 'left' | 'right';
	tracking?: number;
}> = ({
	text,
	frame,
	at,
	out,
	size = 84,
	weight = 800,
	color = '#fff',
	accent = [],
	accentColor = COLORS.orange,
	stagger = 3,
	style,
	align = 'center',
	tracking = 0.02,
}) => {
	const words = text.split(' ');
	const exit = out === undefined ? 0 : prog(frame, out, out + 12, EASE.in);
	return (
		<div
			style={{
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end',
				gap: `0 ${size * 0.28}px`,
				fontFamily: FONT_DISPLAY,
				fontWeight: weight,
				fontSize: size,
				lineHeight: 1.08,
				letterSpacing: `${tracking}em`,
				color,
				opacity: 1 - exit,
				filter: exit > 0 ? `blur(${exit * 8}px)` : undefined,
				...style,
			}}
		>
			{words.map((w, i) => {
				const p = prog(frame, at + i * stagger, at + i * stagger + 16, EASE.out);
				const isAccent = accent.includes(w.replace(/[^A-Za-z']/g, ''));
				return (
					<span key={i} style={{display: 'inline-block', overflow: 'hidden', paddingBottom: size * 0.08}}>
						<span
							style={{
								display: 'inline-block',
								transform: `translateY(${(1 - p) * 105}%)`,
								opacity: p,
								color: isAccent ? accentColor : undefined,
								textShadow: '0 6px 30px rgba(3,11,31,0.55)',
							}}
						>
							{w}
						</span>
					</span>
				);
			})}
		</div>
	);
};

/** Small uppercase label chip with a glowing dot. */
export const Tag: React.FC<{
	children: React.ReactNode;
	frame: number;
	at: number;
	out?: number;
	color?: string;
	size?: number;
	style?: React.CSSProperties;
}> = ({children, frame, at, out, color = COLORS.cyan, size = 22, style}) => {
	const inset = useInset();
	const p = prog(frame, at, at + 14, EASE.out);
	const o = out === undefined ? 0 : prog(frame, out, out + 10, EASE.in);
	if (p <= 0 || o >= 1) return null;
	return (
		<div
			style={{
				position: 'absolute',
				display: 'flex',
				alignItems: 'center',
				gap: size * 0.55,
				padding: `${size * 0.45}px ${size * 0.9}px`,
				borderRadius: 999,
				background: 'rgba(3,11,31,0.62)',
				border: `1.5px solid ${color}55`,
				boxShadow: `0 0 30px ${color}22, inset 0 0 20px ${color}11`,
				fontFamily: FONT_DISPLAY,
				fontWeight: 600,
				fontSize: size,
				letterSpacing: `${size * 0.012}em`,
				textTransform: 'uppercase',
				color: '#fff',
				opacity: p * (1 - o),
				transform: `translateY(${(1 - p) * 16}px)`,
				whiteSpace: 'nowrap',
				...style,
				...(typeof style?.left === 'number' ? {left: style.left + inset} : {}),
				...(typeof style?.right === 'number' ? {right: style.right + inset} : {}),
			}}
		>
			<span style={{width: size * 0.45, height: size * 0.45, borderRadius: '50%', background: color, boxShadow: `0 0 12px ${color}`}} />
			{children}
		</div>
	);
};

/** Section kicker, e.g. "01 · THE MYSTERY", with an animated rule. */
export const Kicker: React.FC<{index: string; title: string; frame: number; at: number; out?: number; style?: React.CSSProperties}> = ({
	index,
	title,
	frame,
	at,
	out,
	style,
}) => {
	const inset = useInset();
	const p = prog(frame, at, at + 20, EASE.out);
	const o = out === undefined ? 0 : prog(frame, out, out + 12, EASE.in);
	return (
		<div
			style={{
				position: 'absolute',
				left: 96 + inset,
				top: 84,
				display: 'flex',
				alignItems: 'center',
				gap: 18,
				fontFamily: FONT_BODY,
				fontWeight: 600,
				fontSize: 20,
				letterSpacing: '0.28em',
				color: '#fff',
				opacity: p * (1 - o),
				...style,
			}}
		>
			<span style={{color: COLORS.orange}}>{index}</span>
			<span style={{width: 60 * p, height: 2, background: COLORS.cyan, display: 'inline-block'}} />
			<span style={{transform: `translateX(${(1 - p) * -10}px)`}}>{title}</span>
		</div>
	);
};
