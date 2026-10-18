import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Airliner, PLANE} from '../components/Airliner';
import {Camera} from '../components/Camera';
import {CloudLayer, CloudSea} from '../components/Clouds';
import {ForceArrow} from '../components/Infographics';
import {SceneShell} from '../components/SceneShell';
import {Sky, Vignette} from '../components/Sky';
import {Kicker, Tag} from '../components/Typography';
import {EASE, kf, prog, wobble} from '../lib/anim';
import {COLORS, FONT_BODY, FONT_DISPLAY} from '../theme';
import {CUES, local} from '../timeline';

const L = (sec: number) => local('forces', sec);

export const FORCE_COLORS = {
	lift: COLORS.cyan,
	weight: COLORS.orange,
	thrust: '#ffe08a',
	drag: COLORS.sky300,
};

/**
 * Engine exhaust: the engine throws air backwards (left); by Newton's third
 * law the air pushes the engine forwards = thrust. Deterministic streaks.
 */
export const Exhaust: React.FC<{x: number; y: number; frame: number; strength: number; scale?: number}> = ({x, y, frame, strength, scale = 1}) => {
	if (strength <= 0.01) return null;
	const n = 26;
	return (
		<g opacity={strength}>
			{new Array(n).fill(0).map((_, i) => {
				const life = ((frame * 0.045 + i / n) % 1 + 1) % 1;
				const spread = (((i * 37) % 11) / 10 - 0.5) * 34 * life * scale;
				const px = x - life * 520 * scale;
				const py = y + spread;
				const len = (40 + 60 * life) * scale;
				return (
					<line
						key={i}
						x1={px}
						y1={py}
						x2={px + len}
						y2={py}
						stroke={life < 0.25 ? '#fff3d6' : COLORS.sky200}
						strokeWidth={(5 - life * 3) * scale}
						strokeLinecap="round"
						opacity={(1 - life) * 0.75}
					/>
				);
			})}
		</g>
	);
};

export const BalanceBadge: React.FC<{p: number; style?: React.CSSProperties}> = ({p, style}) => (
	<div
		style={{
			position: 'absolute',
			display: 'flex',
			gap: 34,
			padding: '20px 34px',
			borderRadius: 20,
			background: 'rgba(3,11,31,0.72)',
			border: '1.5px solid rgba(140,201,255,0.3)',
			opacity: p,
			transform: `translateY(${(1 - p) * 20}px)`,
			fontFamily: FONT_DISPLAY,
			fontWeight: 700,
			fontSize: 28,
			letterSpacing: '0.08em',
			color: '#fff',
			...style,
		}}
	>
		<span>
			<span style={{color: FORCE_COLORS.lift}}>LIFT</span> ≈ <span style={{color: FORCE_COLORS.weight}}>WEIGHT</span>
		</span>
		<span style={{width: 2, background: 'rgba(140,201,255,0.3)'}} />
		<span>
			<span style={{color: FORCE_COLORS.thrust}}>THRUST</span> ≈ <span style={{color: FORCE_COLORS.drag}}>DRAG</span>
		</span>
	</div>
);

export const S7Forces: React.FC = () => {
	const frame = useCurrentFrame();
	const px = 460;
	const py = 380 + wobble(frame, 1) * 4;
	const cg = {x: px + PLANE.cg[0], y: py + PLANE.cg[1]};
	const eng = {x: px + PLANE.engine[0], y: py + PLANE.engine[1]};
	const ex = {x: px + PLANE.engineExhaust[0], y: py + PLANE.engineExhaust[1]};

	const liftP = prog(frame, 12, 34, EASE.out);
	const weightP = prog(frame, 20, 42, EASE.out);
	const engHi = prog(frame, L(CUES.whatEngines) - 4, L(CUES.whatEngines) + 10) * (1 - prog(frame, L(CUES.thrust) + 10, L(CUES.thrust) + 30));
	const thrustP = prog(frame, L(CUES.thrust) - 4, L(CUES.thrust) + 18, EASE.out);
	const dragP = prog(frame, L(CUES.airResistance) - 6, L(CUES.airResistance) + 16, EASE.out);
	const balance = prog(frame, L(CUES.maintainSpeed), L(CUES.maintainSpeed) + 18);

	const zoom = kf(frame, [0, L(CUES.whatEngines), L(CUES.thrust), L(CUES.airResistance), L(CUES.maintainSpeed) + 30], [0.82, 0.86, 0.92, 0.86, 0.8], EASE.inOut);
	const camX = cg.x + kf(frame, [0, L(CUES.thrust), L(CUES.airResistance), L(CUES.maintainSpeed)], [0, 40, -60, 0]);
	const camY = cg.y + 10;
	const scroll = frame * 7;

	return (
		<SceneShell>
			<Sky mood="day" sunX={1700} sunY={260} sunGlow={0.55} />
			<CloudLayer seed={41} count={6} y={[240, 520]} size={[280, 460]} scroll={scroll * 0.3} opacity={0.75} blur={2.5} />
			<CloudSea top={860} scroll={scroll} glow="#ffffff" />
			<svg width={1920} height={1080} style={{position: 'absolute', opacity: 0.35}}>
				<defs>
					<pattern id="s7grid" width="60" height="60" patternUnits="userSpaceOnUse">
						<path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
					</pattern>
				</defs>
				<rect width="1920" height="1080" fill="url(#s7grid)" />
			</svg>
			<Camera x={camX} y={camY} zoom={zoom}>
				<svg width={4000} height={2000} style={{position: 'absolute', overflow: 'visible'}}>
					<Exhaust x={ex.x} y={ex.y} frame={frame} strength={thrustP} />
					<Airliner x={px} y={py} width={1000} frame={frame} engineGlow={0.5 + thrustP * 0.4} engineHighlight={engHi} />
					<ForceArrow x={cg.x} y={cg.y - 50} angle={0} length={330} progress={liftP} color={FORCE_COLORS.lift} width={30} label="LIFT" labelSize={40} />
					<ForceArrow x={cg.x} y={cg.y + 50} angle={180} length={330} progress={weightP} color={FORCE_COLORS.weight} width={30} label="WEIGHT" labelSize={40} />
					<ForceArrow x={eng.x + 70} y={eng.y} angle={90} length={330} progress={thrustP} color={FORCE_COLORS.thrust} width={26} label="THRUST" labelSize={36} />
					<ForceArrow x={px + 40} y={cg.y - 20} angle={270} length={330} progress={dragP} color={FORCE_COLORS.drag} width={26} label="DRAG" sublabel="air resistance" labelSize={36} />
				</svg>
			</Camera>
			<Vignette strength={0.4} />
			<Kicker index="05" title="WHAT ENGINES REALLY DO" frame={frame} at={L(CUES.whatEngines) - 10} />
			<Tag frame={frame} at={L(CUES.thrust) + 10} out={L(CUES.maintainSpeed) - 4} color={FORCE_COLORS.thrust} style={{left: 110, bottom: 110}}>
				Engines push air backward → thrust forward
			</Tag>
			<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 90}}>
				<BalanceBadge p={balance} style={{position: 'relative'}} />
				<div style={{marginTop: 14, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 22, letterSpacing: '0.3em', color: '#fff', opacity: balance}}>STEADY, LEVEL FLIGHT</div>
			</AbsoluteFill>
		</SceneShell>
	);
};
