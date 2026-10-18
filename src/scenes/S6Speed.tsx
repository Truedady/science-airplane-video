import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Airliner, PLANE} from '../components/Airliner';
import {Camera} from '../components/Camera';
import {CloudLayer} from '../components/Clouds';
import {Airfoil, Particles, Streamlines, type View} from '../components/Flow';
import {ForceArrow, Gauge, Meter} from '../components/Infographics';
import {SceneShell} from '../components/SceneShell';
import {LabBackdrop, Vignette} from '../components/Sky';
import {Headline, Kicker, Tag} from '../components/Typography';
import {EASE, kf, prog, rng} from '../lib/anim';
import {COLORS} from '../theme';
import {CUES, FPS, local} from '../timeline';
import {FLOW_RATE} from './S4Lift';
import {useInset} from '../lib/layout';

const L = (sec: number) => local('speed', sec);
const VIEW: View = {cx: 820, cy: 560, s: 165};
/** Lift ∝ airspeed². Meter units: weight line at 0.6. */
const WEIGHT_LINE = 0.6;
const liftOf = (v: number) => 0.74 * v * v;

const Runway: React.FC<{scroll: number; groundY: number}> = ({scroll, groundY}) => {
	const r = rng(21);
	const bldg = new Array(16).fill(0).map((_, i) => ({x: i * 150 + r() * 40, w: 60 + r() * 90, h: 40 + r() * 140}));
	const wrap = (x: number, span: number) => ((x % span) + span) % span;
	return (
		<svg width={6000} height={3000} style={{position: 'absolute', left: -2000, top: -1000, overflow: 'visible'}}>
			<g transform="translate(2000 1000)">
				{/* skyline / terminal (far, slow) */}
				<g transform={`translate(${-wrap(scroll * 0.06, 2400)} 0)`} fill="#1b4592" opacity={0.75}>
					{[0, 2400, 4800].map((o) =>
						bldg.map((b, i) => <rect key={`${o}-${i}`} x={o + b.x - 1200} y={groundY - 60 - b.h} width={b.w} height={b.h + 60} rx={4} />),
					)}
					<rect x={-2000} y={groundY - 62} width={8000} height={70} fill="#16397c" />
				</g>
				{/* control tower */}
				<g transform={`translate(${-wrap(scroll * 0.12, 3600) + 2600} 0)`} fill="#123478">
					<rect x={-14} y={groundY - 300} width={28} height={260} />
					<path d={`M -50 ${groundY - 300} L 50 ${groundY - 300} L 38 ${groundY - 350} L -38 ${groundY - 350} Z`} fill="#2a5cb8" />
				</g>
				{/* grass + runway */}
				<rect x={-2000} y={groundY - 8} width={8000} height={2000} fill="#0b2150" />
				<rect x={-2000} y={groundY + 10} width={8000} height={90} fill="#0a1532" />
				<rect x={-2000} y={groundY + 10} width={8000} height={4} fill="#5d79ad" />
				{new Array(30).fill(0).map((_, i) => (
					<rect key={i} x={wrap(i * 260 - scroll, 7800) - 2400} y={groundY + 52} width={140} height={8} rx={4} fill="#fff" opacity={0.85} />
				))}
				{/* edge lights: streak with speed */}
				{new Array(40).fill(0).map((_, i) => (
					<rect key={`l${i}`} x={wrap(i * 190 - scroll * 1.15, 7600) - 2400} y={groundY + 112} width={14} height={6} rx={3} fill={COLORS.orangeSoft} />
				))}
				{/* foreground grass streaks */}
				{new Array(24).fill(0).map((_, i) => (
					<rect key={`g${i}`} x={wrap(i * 330 - scroll * 1.6, 7920) - 2400} y={groundY + 150 + (i % 3) * 30} width={200} height={3} rx={2} fill="#2a5cb8" opacity={0.5} />
				))}
			</g>
		</svg>
	);
};

export const S6Speed: React.FC = () => {
	const frame = useCurrentFrame();
	const inset = useInset();

	// --- Phase A: airspeed vs lift on the airfoil ---
	const speedA = kf(frame, [0, L(CUES.catch), L(CUES.catch) + 34, L(CUES.flowPast) - 6, L(CUES.speedEnd)], [1, 1, 0.3, 0.3, 1.1], EASE.inOut);
	let tauA = 0;
	for (let i = 0; i < frame; i++) {
		tauA += (kf(i, [0, L(CUES.catch), L(CUES.catch) + 34, L(CUES.flowPast) - 6, L(CUES.speedEnd)], [1, 1, 0.3, 0.3, 1.1], EASE.inOut) / FPS) * FLOW_RATE;
	}
	const toRunway = prog(frame, L(CUES.thatsWhy) - 10, L(CUES.thatsWhy) + 6, EASE.inOut);

	// --- Phase B: take-off roll ---
	const rollStart = L(CUES.thatsWhy) - 10;
	const vB = kf(frame, [rollStart, L(CUES.accelerate), L(CUES.takingOff), L(CUES.takingOff) + 40], [0.3, 0.45, 0.97, 1.05], EASE.inOut);
	let scroll = 0;
	for (let i = rollStart; i < frame; i++) {
		scroll += kf(i, [rollStart, L(CUES.accelerate), L(CUES.takingOff), L(CUES.takingOff) + 40], [0.3, 0.45, 0.97, 1.05], EASE.inOut) * 62;
	}
	const rotate = kf(frame, [L(CUES.takingOff) - 14, L(CUES.takingOff) + 8], [0, -8], EASE.inOut);
	const climb = Math.max(0, frame - (L(CUES.takingOff) + 6));
	const altitude = climb * climb * 0.35;

	const v = toRunway < 0.5 ? speedA : vB;
	const lift = liftOf(v);

	const groundY = 820;
	const planeW = 900;
	const k = planeW / PLANE.w;
	const wheelY = PLANE.belly[1] + 62; // artboard y of wheel bottoms with gear down
	const px = 560;
	const py = groundY - wheelY * k - altitude;
	const camY = 540 - altitude * 0.7;
	const cg = {x: px + PLANE.cg[0] * k, y: py + PLANE.cg[1] * k};

	return (
		<SceneShell>
			{/* Phase A */}
			<AbsoluteFill style={{opacity: 1 - toRunway}}>
				<LabBackdrop offsetX={tauA * 120} />
				<svg width={1920} height={1080} style={{position: 'absolute'}}>
					<Streamlines view={VIEW} opacity={0.16} />
					<Particles view={VIEW} tau={tauA + 6} perLine={9} trail={0.16} mode="speed" opacity={0.95} />
					<Airfoil view={VIEW} />
					<ForceArrow x={VIEW.cx + 10} y={VIEW.cy - 40} angle={0} length={460 * lift} progress={prog(frame, 0, 10)} color={COLORS.cyan} width={30} label="LIFT" labelSize={40} />
				</svg>
			</AbsoluteFill>

			{/* Phase B */}
			<AbsoluteFill style={{opacity: toRunway}}>
				<AbsoluteFill style={{background: `linear-gradient(180deg, #0b2d6e 0%, ${COLORS.sky500} 50%, ${COLORS.sky300} 78%, #ffd9b0 100%)`}} />
				<CloudLayer seed={31} count={5} y={[180, 420]} size={[260, 420]} scroll={scroll * 0.05} opacity={0.6} blur={3} />
				<Camera x={960} y={camY} zoom={1} rotate={kf(frame, [L(CUES.takingOff), L(CUES.takingOff) + 30], [0, -2])}>
					<Runway scroll={scroll} groundY={groundY} />
					<svg width={1920} height={1080} style={{position: 'absolute', overflow: 'visible'}}>
						<g transform={`rotate(${rotate} ${px + PLANE.wingCentre[0] * k + 40} ${groundY - altitude})`}>
							<Airliner x={px} y={py} width={planeW} frame={frame} gear={1} engineGlow={0.4 + vB * 0.5} />
						</g>
						<ForceArrow x={cg.x} y={cg.y - 20} angle={0} length={520 * lift} progress={prog(frame, rollStart + 10, rollStart + 26)} color={COLORS.cyan} width={28} label="LIFT" labelSize={34} labelPos="right" />
						<ForceArrow x={cg.x} y={cg.y + 30} angle={180} length={520 * WEIGHT_LINE} progress={prog(frame, rollStart + 14, rollStart + 30)} color={COLORS.orange} width={28} label="WEIGHT" labelSize={30} labelPos="right" opacity={0.9} />
					</svg>
				</Camera>
			</AbsoluteFill>

			{/* Instruments */}
			<svg width={1920} height={1080} style={{position: 'absolute', overflow: 'visible'}}>
				<g transform={`translate(${-inset / 2} 0)`}>
				<Gauge cx={1640} cy={300} r={120} value={v / 1.15} label="AIRSPEED" color={COLORS.cyan} opacity={prog(frame, L(CUES.catch) - 10, L(CUES.catch) + 6)} status={lift >= WEIGHT_LINE ? 'ENOUGH FOR FLIGHT' : 'TOO SLOW'} />
				<Meter x={1610} y={560} h={300} value={lift} marker={WEIGHT_LINE} label="LIFT" markerLabel="WEIGHT" color={lift >= WEIGHT_LINE ? COLORS.cyan : COLORS.orangeSoft} opacity={prog(frame, L(CUES.catch) - 4, L(CUES.catch) + 12)} />
				</g>
			</svg>
			<Vignette strength={0.4} />
			<Kicker index="04" title="WHY SPEED MATTERS" frame={frame} at={L(CUES.catch) - 6} out={L(CUES.thatsWhy) - 10} />
			<Tag frame={frame} at={L(CUES.enoughLift)} out={L(CUES.thatsWhy) - 10} color={COLORS.cyan} style={{left: 110, bottom: 110}}>
				Lift grows with the square of airspeed
			</Tag>
			<Tag frame={frame} at={L(CUES.accelerate)} out={L(CUES.takingOff) + 30} color={COLORS.orange} style={{left: 110, top: 90}}>
				Accelerating along the runway
			</Tag>
			<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 100}}>
				<Headline text="But there's a catch" accent={['catch']} frame={frame} at={L(CUES.catch) - 10} out={L(CUES.enoughLift)} size={64} />
			</AbsoluteFill>
		</SceneShell>
	);
};
