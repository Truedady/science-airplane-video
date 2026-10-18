import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Airliner, PLANE} from '../components/Airliner';
import {Camera} from '../components/Camera';
import {CloudLayer, CloudSea} from '../components/Clouds';
import {Airfoil, Particles, Streamlines, type View} from '../components/Flow';
import {ForceArrow, Gauge} from '../components/Infographics';
import {SceneShell} from '../components/SceneShell';
import {Sky, Vignette} from '../components/Sky';
import {Headline, Kicker, Tag} from '../components/Typography';
import {EASE, fade, kf, prog, wobble} from '../lib/anim';
import {COLORS, FONT_BODY, FONT_DISPLAY} from '../theme';
import {CUES, FPS, local} from '../timeline';
import {Exhaust, FORCE_COLORS} from './S7Forces';
import {FLOW_RATE} from './S4Lift';
import {useInset} from '../lib/layout';

const L = (sec: number) => local('glide', sec);
/** Visualised glide-path angle (degrees). Real airliner glides are shallow. */
const GAMMA = 5;
const INSET: View = {cx: 260, cy: 175, s: 52};

export const S8Glide: React.FC = () => {
	const frame = useCurrentFrame();
	const safe = useInset();
	const g0 = L(CUES.gliding) - 10;
	const glideP = prog(frame, g0, g0 + 50, EASE.inOut);

	// Flight path: level, then a steady shallow descent.
	const speed = 8; // world px / frame
	let x = 0;
	let y = 0;
	for (let i = 0; i < frame; i++) {
		const gp = prog(i, g0, g0 + 50, EASE.inOut);
		x += speed;
		y += speed * Math.tan((GAMMA * Math.PI) / 180) * gp;
	}
	const px = 200 + x;
	const py = 380 + y + wobble(frame, 1) * 3 * (1 - glideP);
	const pitch = GAMMA * 0.55 * glideP; // nose slightly down (still positive angle of attack)
	const cg = {x: px + PLANE.cg[0], y: py + PLANE.cg[1]};
	const ex = {x: px + PLANE.engineExhaust[0], y: py + PLANE.engineExhaust[1]};
	const eng = {x: px + PLANE.engine[0], y: py + PLANE.engine[1]};

	const engineOff = prog(frame, L(CUES.suddenly), L(CUES.stop) + 20, EASE.inOut);
	const thrust = 1 - engineOff;
	const dread = prog(frame, L(CUES.doesItFall) - 6, L(CUES.doesItFall) + 10) * (1 - prog(frame, L(CUES.notImmediately), L(CUES.notImmediately) + 20));
	const pathP = prog(frame, L(CUES.gliding), L(CUES.gliding) + 40, EASE.inOut);
	const glideForces = prog(frame, L(CUES.wingsContinue) - 10, L(CUES.wingsContinue) + 14);
	const levelForces = 1 - prog(frame, g0, g0 + 30);
	const inset = prog(frame, L(CUES.wingsContinue) - 6, L(CUES.wingsContinue) + 16);
	const liftPulse = 0.6 + 0.4 * Math.sin((frame - L(CUES.glideLift)) * 0.28) * prog(frame, L(CUES.glideLift) - 4, L(CUES.glideLift) + 6);

	const zoom = kf(frame, [0, L(CUES.mostSurprising), L(CUES.bothEngines), g0, g0 + 70, L(CUES.wingsContinue), L(CUES.thatsRight) + 40], [0.8, 0.86, 1.0, 1.0, 0.5, 0.62, 0.55], EASE.inOut);
	const camX = cg.x + kf(frame, [0, L(CUES.bothEngines), g0, g0 + 70], [0, 60, 40, 120], EASE.inOut);
	const camY = cg.y + kf(frame, [0, g0, g0 + 70, L(CUES.wingsContinue)], [-70, -40, -30, -60], EASE.inOut) + dread * 8 * Math.sin(frame * 1.7);
	const scroll = x;
	const descent = y;

	// Glide path line (world): from where the glide began, extended ahead
	const gx0 = 200 + speed * g0 + PLANE.cg[0];
	const gy0 = 380 + PLANE.cg[1];
	const tanG = Math.tan((GAMMA * Math.PI) / 180);
	const aheadX = cg.x + 2600;
	const behindX = gx0 - 900;

	const dusk = prog(frame, 0, 600, EASE.inOut);

	return (
		<SceneShell>
			<Sky mood="day" sunX={1600} sunY={330} sunGlow={0.6} />
			<AbsoluteFill style={{opacity: dusk}}>
				<Sky mood="dusk" sunX={1650} sunY={640} sunGlow={0.9} />
			</AbsoluteFill>
			<CloudLayer seed={41} count={6} y={[260 - descent * 0.05, 560 - descent * 0.05]} size={[280, 460]} scroll={scroll * 0.25} opacity={0.7} blur={2.5} rim="#ffd0a0" />
			<CloudSea top={880 - descent * 0.12} scroll={scroll * 0.7} glow="#ffd8b0" />
			<AbsoluteFill style={{background: COLORS.navy900, opacity: dread * 0.25}} />

			<Camera x={camX} y={camY} zoom={zoom}>
				<svg width={8000} height={4000} style={{position: 'absolute', overflow: 'visible'}}>
					{/* descending flight path */}
					<g opacity={pathP}>
						<line x1={behindX} y1={gy0} x2={gx0} y2={gy0} stroke="#fff" strokeOpacity={0.35} strokeWidth={4} strokeDasharray="18 16" />
						<line x1={gx0} y1={gy0} x2={gx0 + (aheadX - gx0) * pathP} y2={gy0 + (aheadX - gx0) * pathP * tanG} stroke={COLORS.cyan} strokeWidth={5} strokeDasharray="22 16" />
						<text x={cg.x + 380} y={cg.y + 380 * tanG + 70} fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={36} letterSpacing={5} fill={COLORS.cyanSoft} transform={`rotate(${GAMMA} ${cg.x + 380} ${cg.y + 380 * tanG + 70})`}>
							CONTROLLED GLIDE
						</text>
					</g>
					<Exhaust x={ex.x} y={ex.y} frame={frame} strength={thrust} />
					<g transform={`rotate(${pitch} ${cg.x} ${cg.y})`}>
						<Airliner x={px} y={py} width={1000} frame={frame} engineGlow={0.9 * thrust} engineHighlight={prog(frame, L(CUES.bothEngines) - 4, L(CUES.bothEngines) + 8) * (1 - prog(frame, L(CUES.stop) + 20, L(CUES.stop) + 40))} />
					</g>
					{/* cruise forces → engine stops → thrust disappears */}
					<g opacity={levelForces}>
						<ForceArrow x={cg.x} y={cg.y - 50} angle={0} length={260} progress={prog(frame, 6, 24)} color={FORCE_COLORS.lift} width={26} label="LIFT" labelSize={34} />
						<ForceArrow x={cg.x} y={cg.y + 50} angle={180} length={260} progress={prog(frame, 6, 24)} color={FORCE_COLORS.weight} width={26} label="WEIGHT" labelSize={34} />
						<ForceArrow x={eng.x + 70} y={eng.y} angle={90} length={260} progress={prog(frame, 6, 24) * thrust} color={FORCE_COLORS.thrust} width={24} label="THRUST" labelSize={32} />
						<ForceArrow x={px + 40} y={cg.y - 20} angle={270} length={260} progress={prog(frame, 6, 24)} color={FORCE_COLORS.drag} width={24} label="DRAG" labelSize={32} />
					</g>
					{/* glide forces: lift ⟂ path, drag ∥ path, weight down — they balance without thrust */}
					<g opacity={glideForces}>
						<ForceArrow x={cg.x} y={cg.y - 40} angle={GAMMA} length={440} progress={glideForces} color={FORCE_COLORS.lift} width={44} label="LIFT" labelSize={64} glow={0.5 + 0.4 * liftPulse} />
						<ForceArrow x={cg.x} y={cg.y + 50} angle={180} length={440} progress={glideForces} color={FORCE_COLORS.weight} width={44} label="WEIGHT" labelSize={56} />
						<ForceArrow x={px + 20} y={cg.y - 30} angle={270 + GAMMA} length={260} progress={glideForces} color={FORCE_COLORS.drag} width={34} label="DRAG" labelSize={48} />
					</g>
				</svg>
			</Camera>

			{/* Instruments */}
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<Gauge cx={1720 - safe} cy={190} r={92} value={0.78 * thrust} label="THRUST" color={thrust > 0.05 ? FORCE_COLORS.thrust : '#ff6b6b'} status={engineOff > 0.9 ? 'ENGINES OFF' : undefined} opacity={prog(frame, L(CUES.bothEngines) - 12, L(CUES.bothEngines))} />
				<Gauge cx={1720 - safe} cy={470} r={92} value={0.7 + wobble(frame, 0.5) * 0.01} label="AIRSPEED" color={COLORS.cyan} status={L(CUES.forwardSpeed) < frame ? 'MAINTAINED' : undefined} opacity={prog(frame, L(CUES.gliding), L(CUES.gliding) + 16)} />
				{/* altitude tape */}
				<g opacity={prog(frame, L(CUES.altitude) - 6, L(CUES.altitude) + 10)} transform={`translate(${safe} 0)`}>
					<rect x={90} y={250} width={90} height={460} rx={16} fill="rgba(3,11,31,0.72)" stroke="rgba(140,201,255,0.3)" strokeWidth={2} />
					{new Array(12).fill(0).map((_, i) => {
						const yy = 270 + ((i * 40 + descent * 0.9) % 440);
						return <line key={i} x1={110} x2={i % 2 ? 140 : 160} y1={yy} y2={yy} stroke="rgba(196,228,255,0.6)" strokeWidth={2} />;
					})}
					<path d="M 172 480 L 200 466 L 200 494 Z" fill={COLORS.orange} />
					<text x={135} y={750} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={20} letterSpacing={2} fill="#fff">
						ALTITUDE
					</text>
					<text x={135} y={778} textAnchor="middle" fontFamily={FONT_BODY} fontWeight={600} fontSize={18} fill={COLORS.orangeSoft}>
						slowly ↓
					</text>
				</g>
			</svg>

			{/* Inset: the airflow over the wing continues → lift */}
			<div
				style={{
					position: 'absolute',
					right: 70 + safe,
					bottom: 70,
					width: 520,
					height: 330,
					borderRadius: 22,
					overflow: 'hidden',
					background: 'rgba(3,11,31,0.82)',
					border: `1.5px solid ${COLORS.cyan}55`,
					boxShadow: `0 20px 60px rgba(0,0,0,0.45), 0 0 40px ${COLORS.cyan}22`,
					opacity: inset,
					transform: `translateY(${(1 - inset) * 30}px) scale(${0.96 + 0.04 * inset})`,
				}}
			>
				<svg width={520} height={330}>
					<Streamlines view={INSET} opacity={0.2} width={1.2} />
					<Particles view={INSET} tau={(frame / FPS) * FLOW_RATE} perLine={8} width={2} trail={0.2} mode="speed" />
					<Airfoil view={INSET} />
					<ForceArrow x={INSET.cx} y={INSET.cy - 10} angle={0} length={120} progress={inset} color={COLORS.cyan} width={14} glow={0.5 * liftPulse} />
				</svg>
				<div style={{position: 'absolute', left: 22, bottom: 16, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, letterSpacing: '0.12em', color: '#fff'}}>
					AIRFLOW CONTINUES <span style={{color: COLORS.cyan}}>→ LIFT</span>
				</div>
			</div>

			<Vignette strength={0.4 + dread * 0.3} />
			<Kicker index="06" title="IF BOTH ENGINES STOP" frame={frame} at={L(CUES.bothEngines) - 10} out={L(CUES.gliding) - 10} />
			<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 96}}>
				<Headline text="The most surprising question" accent={['surprising']} frame={frame} at={L(CUES.mostSurprising) - 10} out={L(CUES.bothEngines) - 8} size={62} />
			</AbsoluteFill>
			<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 96}}>
				<Headline text="Does it fall?" accent={['fall']} frame={frame} at={L(CUES.doesItFall) - 8} out={L(CUES.notImmediately) - 6} size={72} />
			</AbsoluteFill>
			<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 96}}>
				<Headline text="Not immediately." accent={['immediately']} accentColor={COLORS.cyan} frame={frame} at={L(CUES.notImmediately) + 2} out={L(CUES.gliding) + 20} size={72} />
			</AbsoluteFill>
			<Tag frame={frame} at={L(CUES.altitude)} out={L(CUES.wingsContinue) - 6} color={COLORS.orange} style={{left: 240, top: 96}}>
				Trading altitude for forward speed
			</Tag>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 90,
					textAlign: 'center',
					opacity: fade(frame, L(CUES.thatsRight), 14),
					transform: `translateY(${(1 - fade(frame, L(CUES.thatsRight), 14)) * 20}px)`,
				}}
			>
				<div style={{fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 46, color: '#fff', letterSpacing: '0.02em', textShadow: '0 6px 30px rgba(3,11,31,0.6)'}}>
					No engine thrust. <span style={{color: COLORS.cyan}}>Still flying.</span>
				</div>
				<div style={{fontFamily: FONT_BODY, fontWeight: 500, fontSize: 26, color: COLORS.sky200, marginTop: 8, opacity: fade(frame, L(CUES.temporarily), 14)}}>
					A passenger jet can glide for a while — descending gradually, fully controlled.
				</div>
			</div>
		</SceneShell>
	);
};
