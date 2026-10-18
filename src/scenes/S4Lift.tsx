import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Camera} from '../components/Camera';
import {Airfoil, Particles, PressureField, SmokePulse, Streamlines, SurfacePressure, toScreen, type View} from '../components/Flow';
import {Callout, ForceArrow} from '../components/Infographics';
import {SceneShell} from '../components/SceneShell';
import {LabBackdrop, Vignette} from '../components/Sky';
import {Headline, Kicker, Tag} from '../components/Typography';
import {EASE, fade, kf, prog} from '../lib/anim';
import {COLORS, FONT_DISPLAY} from '../theme';
import {CUES, FPS, local} from '../timeline';

const L = (sec: number) => local('lift', sec);
export const LIFT_VIEW: View = {cx: 960, cy: 560, s: 200};
const V = LIFT_VIEW;
export const FLOW_RATE = 1.25; // flow-time units per second

const PressureLabel: React.FC<{x: number; y: number; title: string; sign: string; color: string; p: number}> = ({x, y, title, sign, color, p}) => (
	<g opacity={p} transform={`translate(${x} ${y + (1 - p) * 16})`}>
		<circle cx={0} cy={0} r={30} fill="rgba(3,11,31,0.7)" stroke={color} strokeWidth={3} />
		<text x={0} y={2} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT_DISPLAY} fontWeight={800} fontSize={40} fill={color}>
			{sign}
		</text>
		<text x={48} y={2} dominantBaseline="middle" fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={30} letterSpacing={4} fill="#fff" style={{paintOrder: 'stroke', stroke: 'rgba(3,11,31,0.6)', strokeWidth: 6}}>
			{title}
		</text>
	</g>
);

export const S4Lift: React.FC = () => {
	const frame = useCurrentFrame();
	const tau = (frame / FPS) * FLOW_RATE + 3;

	const flowIn = prog(frame, L(CUES.movesForward) - 6, L(CUES.airFlows) + 30, EASE.inOut);
	const shapeHi = fade(frame, L(CUES.shape) - 4, 10, L(CUES.angle) + 30, 14);
	const angleP = prog(frame, L(CUES.angle) - 2, L(CUES.angle) + 18);
	const angleOut = prog(frame, L(CUES.airMoves) - 14, L(CUES.airMoves));
	const speedMode = prog(frame, L(CUES.airMoves) - 6, L(CUES.airMoves) + 10);
	const pulseRelease = L(CUES.airMoves) - 14;
	const pulseAge = Math.max(0, ((frame - pulseRelease) / FPS) * FLOW_RATE);
	const pulseOpacity = fade(frame, pulseRelease, 8, L(CUES.above) - 6, 14);
	const pressure = prog(frame, L(CUES.differenceInPressure), L(CUES.pressure) + 20, EASE.inOut);
	const surface = prog(frame, L(CUES.pressure) + 6, L(CUES.lower) + 10, EASE.inOut);
	const above = prog(frame, L(CUES.above) - 2, L(CUES.above) + 14);
	const below = prog(frame, L(CUES.below) - 2, L(CUES.below) + 14);
	const lift = prog(frame, L(CUES.upwardForce), L(CUES.lift) + 10, EASE.out);

	const zoom = kf(frame, [0, 26, L(CUES.angle), L(CUES.pressure), L(CUES.upwardForce), L(CUES.lift) + 40], [0.62, 1.0, 1.06, 1.0, 1.0, 0.92], EASE.inOut);
	const camX = 960 + kf(frame, [0, L(CUES.angle), L(CUES.pressure), L(CUES.lift)], [0, 30, 0, 0]);
	const camY = 540 + kf(frame, [0, L(CUES.pressure), L(CUES.lift) + 20], [10, 20, -50]);

	const le = toScreen(V, -2.01, 0.25);
	const top = toScreen(V, -0.6, 0.5);
	const aRad = (7 * Math.PI) / 180;

	return (
		<SceneShell zoomIn={false}>
			<LabBackdrop offsetX={frame * 2} />
			<Camera x={camX} y={camY} zoom={zoom}>
				<PressureField view={V} opacity={pressure * 0.95} />
				<svg width={1920} height={1080} style={{position: 'absolute', overflow: 'visible'}}>
					<Streamlines view={V} progress={flowIn} opacity={0.2 + 0.1 * (1 - pressure)} />
					<Particles view={V} tau={tau} opacity={flowIn * (1 - speedMode) * (1 - pressure * 0.35)} perLine={9} />
					<Particles view={V} tau={tau} opacity={flowIn * speedMode * (1 - pressure * 0.35)} perLine={9} mode="speed" />
					<SmokePulse view={V} age={pulseAge} opacity={pulseOpacity} releaseX={-3.0} />
					<Airfoil view={V} glow={shapeHi} showChord={angleP * (1 - angleOut)} />
					<SurfacePressure view={V} progress={surface} opacity={1 - lift * 0.45} />
					{/* angle of attack: drawn ahead of the leading edge, between the chord line and the oncoming air */}
					<g opacity={angleP * (1 - angleOut)} fill="none">
						<line x1={le[0] - 30} y1={le[1]} x2={le[0] + 400} y2={le[1]} stroke={COLORS.orangeSoft} strokeWidth={2.5} strokeDasharray="12 10" />
						<line x1={le[0]} y1={le[1]} x2={le[0] + 400 * Math.cos(aRad * angleP)} y2={le[1] - 400 * Math.sin(aRad * angleP)} stroke="#fff" strokeWidth={2.5} strokeDasharray="10 8" />
						<path d={`M ${le[0] + 300} ${le[1]} A 300 300 0 0 0 ${le[0] + 300 * Math.cos(aRad * angleP)} ${le[1] - 300 * Math.sin(aRad * angleP)}`} stroke={COLORS.orange} strokeWidth={5} />
						<text x={le[0] + 150} y={le[1] - 70} fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={26} letterSpacing={4} fill={COLORS.orangeSoft} stroke="none">
							ANGLE OF ATTACK
						</text>
						<text x={le[0] + 150} y={le[1] + 44} fontFamily={FONT_DISPLAY} fontWeight={400} fontSize={20} letterSpacing={2} fill={COLORS.sky300} stroke="none">
							oncoming air
						</text>
					</g>
					<Callout from={top} to={[top[0] + 180, top[1] - 170]} progress={shapeHi} title="CURVED SHAPE" subtitle="cambered airfoil" color={COLORS.cyan} />
					<PressureLabel x={420} y={300} title="LOWER PRESSURE" sign="−" color={COLORS.lowPressure} p={above} />
					<PressureLabel x={420} y={820} title="HIGHER PRESSURE" sign="+" color={COLORS.highPressure} p={below} />
					<ForceArrow x={V.cx + 20} y={V.cy - 40} angle={0} length={420} progress={lift} color={COLORS.cyan} width={34} label="LIFT" labelSize={48} glow={0.8} />
				</svg>
			</Camera>
			<Vignette strength={0.45} />
			<Kicker index="02" title="HOW A WING MAKES LIFT" frame={frame} at={20} />
			<Tag frame={frame} at={L(CUES.airFlows)} out={L(CUES.airMoves) - 6} color={COLORS.sky300} style={{right: 110, top: 74}}>
				← Relative airflow
			</Tag>
			<Tag frame={frame} at={L(CUES.airMoves)} out={L(CUES.differenceInPressure) + 10} color={COLORS.cyan} style={{right: 110, top: 74}}>
				Air over the top speeds up
			</Tag>
			<Tag frame={frame} at={L(CUES.airMoves) + 30} out={L(CUES.above) - 6} color={COLORS.orange} style={{right: 110, top: 140}}>
				It does not “meet” the air below
			</Tag>
			<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 70}}>
				<Headline text="An upward force called lift" accent={['lift']} accentColor={COLORS.cyan} frame={frame} at={L(CUES.upwardForce) - 4} size={56} stagger={2} weight={700} />
			</AbsoluteFill>
		</SceneShell>
	);
};
