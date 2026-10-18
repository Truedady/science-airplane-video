import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Airliner} from '../components/Airliner';
import {Camera} from '../components/Camera';
import {Particles, Streamlines, type View} from '../components/Flow';
import {CAR, Car, Hand} from '../components/HandAndCar';
import {ForceArrow} from '../components/Infographics';
import {SceneShell} from '../components/SceneShell';
import {LabBackdrop, Vignette} from '../components/Sky';
import {Headline, Kicker, Tag} from '../components/Typography';
import {EASE, kf, prog, rng} from '../lib/anim';
import {COLORS, FONT_DISPLAY} from '../theme';
import {CUES, FPS, local} from '../timeline';

const L = (sec: number) => local('hand', sec);
const VIEW: View = {cx: 960, cy: 540, s: 170};

/** Roadside scenery that streams past (car is moving right). */
const Roadside: React.FC<{scroll: number; opacity: number; push: number}> = ({scroll, opacity, push}) => {
	const r = rng(9);
	const trees = new Array(14).fill(0).map((_, i) => ({x: i * 260 + r() * 120, h: 140 + r() * 120}));
	const wrap = (x: number, span: number) => ((x % span) + span) % span;
	return (
		<AbsoluteFill style={{opacity}}>
			<AbsoluteFill style={{background: `linear-gradient(180deg, #0f3a86 0%, ${COLORS.sky500} 45%, ${COLORS.sky300} 70%, #ffd8ae 100%)`}} />
			<svg width={1920} height={1080} style={{position: 'absolute', transform: `scale(${1 + 0.25 * push})`, transformOrigin: '50% 60%'}}>
				{/* far hills */}
				<g transform={`translate(${-wrap(scroll * 0.08, 1920)} 0)`}>
					{[0, 1920].map((o) => (
						<path key={o} d={`M ${o},760 C ${o + 300},650 ${o + 600},700 ${o + 900},640 C ${o + 1200},590 ${o + 1500},700 ${o + 1920},680 L ${o + 1920},1080 L ${o},1080 Z`} fill="#2d5fae" opacity={0.7} />
					))}
				</g>
				<g transform={`translate(${-wrap(scroll * 0.25, 1920)} 0)`}>
					{[0, 1920].map((o) => (
						<path key={o} d={`M ${o},800 C ${o + 400},730 ${o + 700},790 ${o + 1100},740 C ${o + 1400},710 ${o + 1700},790 ${o + 1920},770 L ${o + 1920},1080 L ${o},1080 Z`} fill={COLORS.navy600} opacity={0.85} />
					))}
				</g>
				{/* trees */}
				{trees.map((t, i) => {
					const x = wrap(t.x - scroll * 0.6, 3640) - 200;
					return (
						<g key={i} transform={`translate(${x} 830)`}>
							<rect x={-6} y={-t.h * 0.35} width={12} height={t.h * 0.35} fill="#0a1f4d" />
							<ellipse cx={0} cy={-t.h * 0.6} rx={t.h * 0.28} ry={t.h * 0.42} fill="#0d2a66" />
						</g>
					);
				})}
				<rect x={0} y={826} width={1920} height={260} fill="#0b2150" />
			</svg>
		</AbsoluteFill>
	);
};

/** Wind streaks behind the car on the wide shot (screen space, deterministic). */
const SpeedLines: React.FC<{frame: number; opacity: number}> = ({frame, opacity}) => {
	if (opacity <= 0.01) return null;
	const r = rng(77);
	const lines = new Array(22).fill(0).map(() => ({y: 120 + r() * 640, len: 120 + r() * 220, v: 38 + r() * 30, o: r() * 2400}));
	return (
		<svg width={1920} height={1080} style={{position: 'absolute', opacity}}>
			{lines.map((l, i) => {
				const x = ((((l.o - frame * l.v) % 2400) + 2400) % 2400) - 240;
				return <rect key={i} x={x} y={l.y} width={l.len} height={2.5} rx={1.25} fill="#e6f4ff" opacity={0.45} />;
			})}
		</svg>
	);
};

// Car at real proportions: the hand (chord 4 units × VIEW.s = 680 px) is ≈ 5.5% of the car's length.
const CAR_K = 13; // world px per car-artboard unit → car ≈ 12 350 px long
const WRIST_ON_CAR: [number, number] = [712, 136]; // just outside the open front window
const CAR_X = 620 - WRIST_ON_CAR[0] * CAR_K; // hand wrist sits at world (620, 540)
const CAR_Y = 540 - WRIST_ON_CAR[1] * CAR_K;
const GROUND_Y = CAR_Y + CAR.ground * CAR_K;
const SHOULDER: [number, number] = [CAR_X + 615 * CAR_K, CAR_Y + 152 * CAR_K];
const WIDE = {x: CAR_X + 505 * CAR_K, zoom: 0.135, y: GROUND_Y - (900 - 540) / 0.135};

export const S3Hand: React.FC = () => {
	const frame = useCurrentFrame();

	const toLab = prog(frame, L(CUES.airplaneWing) - 10, L(CUES.airplaneWing) + 20, EASE.inOut);
	const tilt = kf(frame, [L(CUES.tilt), L(CUES.tilt) + 24], [0, 7], EASE.inOut);
	const flowBend = prog(frame, L(CUES.tilt), L(CUES.tilt) + 30, EASE.inOut);
	const morph = prog(frame, L(CUES.airplaneWing), L(CUES.airplaneWing) + 36, EASE.inOut);
	const up = prog(frame, L(CUES.feelAir), L(CUES.upward) + 8, EASE.out);

	// Camera: wide (car + hand) → close on the hand → huge pull-back to the airliner.
	const zoomIn = prog(frame, L(CUES.hand) - 6, L(CUES.carWindow) + 20, EASE.inOut);
	const reveal = prog(frame, L(CUES.much), L(CUES.biggerScale) + 22, EASE.inOut);
	// Zoom in on the hand: interpolate zoom logarithmically and keep the hand's screen position moving smoothly.
	const zPush = Math.exp(Math.log(WIDE.zoom) * (1 - zoomIn));
	const offX = (VIEW.cx - WIDE.x) * WIDE.zoom * (1 - zoomIn);
	const offY = (VIEW.cy - WIDE.y) * WIDE.zoom * (1 - zoomIn);
	const zoom = zPush * Math.exp(Math.log(0.16) * reveal);
	const camX = VIEW.cx - offX / zPush;
	const camY = VIEW.cy - offY / zPush - 40 * reveal;
	// Hand-scale airflow only once we're close enough to see it.
	const flowIn = prog(frame, L(CUES.understand), L(CUES.hand) + 10) * prog(zoomIn, 0.45, 0.95, EASE.inOut);

	// Car speed & flow time
	const tau = (frame / FPS) * 1.35;
	const scroll = frame * 34;
	const roadScroll = frame * 300; // world px / frame (car moving right)
	const wrap = (x: number, span: number) => ((x % span) + span) % span;

	// Giant airliner positioned so its mid-span wing section is exactly where the airfoil is.
	const k = 7.7;
	const sec: [number, number] = [444, 222];
	const acX = VIEW.cx - sec[0] * k;
	const acY = VIEW.cy - sec[1] * k;

	return (
		<SceneShell>
			<Roadside scroll={scroll} opacity={1 - toLab} push={zoomIn} />
			<SpeedLines frame={frame} opacity={(1 - zoomIn) * (1 - toLab)} />
			<AbsoluteFill style={{opacity: toLab}}>
				<LabBackdrop />
			</AbsoluteFill>
			<Camera x={camX} y={camY} zoom={zoom}>
				<svg width={1920} height={1080} style={{position: 'absolute', overflow: 'visible'}}>
					{/* road (world space, so it stays under the wheels during the camera move) */}
					<g opacity={1 - toLab}>
						<rect x={-40000} y={GROUND_Y - 70} width={80000} height={6000} fill="#0a1532" />
						<rect x={-40000} y={GROUND_Y - 70} width={80000} height={40} fill="#2b4a86" />
						{new Array(16).fill(0).map((_, i) => (
							<rect key={i} x={wrap(i * 3000 - roadScroll, 48000) - 26000} y={GROUND_Y + 420} width={1500} height={90} rx={45} fill="#ffd27a" opacity={0.8} />
						))}
					</g>
					{/* the car: real proportions, hand held out of its open front window; darkened (not see-through) in close-up */}
					<g opacity={1 - toLab}>
						<Car x={CAR_X} y={CAR_Y} width={1000 * CAR_K} wheelAngle={frame * 22} dim={0.5 * zoomIn} />
					</g>
					{/* giant blueprint airliner for the scale reveal */}
					<g opacity={reveal}>
						<Airliner x={acX} y={acY} width={1000 * k} frame={frame} silhouette={0.9} silhouetteColor="#2a63c4" navLights={false} />
						<line x1={acX + 380 * k} y1={acY + 223 * k} x2={acX + 510 * k} y2={acY + 223 * k} stroke={COLORS.cyan} strokeWidth={30} opacity={0.9} />
					</g>
					<g opacity={flowIn * (1 - reveal * 0.6)}>
						<Streamlines view={VIEW} progress={flowIn} opacity={0.22 + 0.1 * toLab} straighten={1 - flowBend} />
						<Particles view={VIEW} tau={tau} perLine={8} straighten={1 - flowBend} opacity={0.9} width={3} />
					</g>
					<Hand view={VIEW} tilt={tilt} morph={morph} armOpacity={1 - toLab} shoulder={SHOULDER} />
					<ForceArrow x={VIEW.cx - 10} y={VIEW.cy - 30} angle={0} length={300} progress={up * (1 - reveal)} color={COLORS.cyan} width={26} label="UPWARD PUSH" labelSize={30} />
					{/* tilt angle indicator */}
					<g opacity={prog(frame, L(CUES.tilt), L(CUES.tilt) + 12) * (1 - toLab)} stroke={COLORS.orangeSoft} fill="none" strokeWidth={3}>
						<line x1={VIEW.cx - 340} y1={VIEW.cy + 4} x2={VIEW.cx + 420} y2={VIEW.cy + 4} strokeDasharray="10 10" opacity={0.6} />
						<path d={`M ${VIEW.cx + 470} ${VIEW.cy + 4} A 470 470 0 0 0 ${VIEW.cx + 470 * Math.cos((tilt * Math.PI) / 180)} ${VIEW.cy + 4 - 470 * Math.sin((tilt * Math.PI) / 180)}`} />
						<text x={VIEW.cx + 500} y={VIEW.cy - 40} fill={COLORS.orangeSoft} stroke="none" fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={28} letterSpacing={3}>
							TILT
						</text>
					</g>
				</svg>
			</Camera>
			<Vignette strength={0.45} />
			<Kicker index="01" title="THE HAND EXPERIMENT" frame={frame} at={L(CUES.understand)} out={L(CUES.airplaneWing) - 10} />
			<Tag frame={frame} at={L(CUES.feelAir) - 6} out={L(CUES.airplaneWing) - 6} color={COLORS.sky300} style={{left: 110, bottom: 120}}>
				Air hits the tilted hand · deflects down
			</Tag>
			<Tag frame={frame} at={L(CUES.similar)} out={L(CUES.biggerScale) - 4} color={COLORS.cyan} style={{left: 110, bottom: 120}}>
				Same principle · wing cross-section
			</Tag>
			<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 96}}>
				<Headline text="…on a much bigger scale" accent={['bigger']} accentColor={COLORS.cyan} frame={frame} at={L(CUES.much)} size={64} stagger={3} />
			</AbsoluteFill>
		</SceneShell>
	);
};
