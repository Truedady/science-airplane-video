import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Airliner, PLANE} from '../components/Airliner';
import {Camera} from '../components/Camera';
import {CloudLayer, CloudSea} from '../components/Clouds';
import {Particles, Streamlines, type View} from '../components/Flow';
import {ForceArrow} from '../components/Infographics';
import {SceneShell} from '../components/SceneShell';
import {Sky, Vignette} from '../components/Sky';
import {Headline} from '../components/Typography';
import {EASE, fade, kf, prog, wobble} from '../lib/anim';
import {COLORS, FONT_BODY, FONT_DISPLAY} from '../theme';
import {CUES, FPS, local, TOTAL_FRAMES, SCENES, f} from '../timeline';
import {FORCE_COLORS} from './S7Forces';
import {FLOW_RATE} from './S4Lift';

const L = (sec: number) => local('finale', sec);

const PhysicsTitle: React.FC<{frame: number; at: number}> = ({frame, at}) => {
	const letters = "IT'S PHYSICS.".split('');
	return (
		<div style={{display: 'flex', fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 168, letterSpacing: '0.04em', lineHeight: 1}}>
			{letters.map((ch, i) => {
				const p = prog(frame, at + i * 1.6, at + i * 1.6 + 18, EASE.out);
				const isDot = ch === '.';
				return (
					<span
						key={i}
						style={{
							display: 'inline-block',
							whiteSpace: 'pre',
							opacity: p,
							transform: `translateY(${(1 - p) * 60}px) scale(${1.25 - 0.25 * p})`,
							filter: `blur(${(1 - p) * 14}px)`,
							color: isDot ? COLORS.orange : undefined,
							backgroundImage: isDot ? undefined : `linear-gradient(180deg, #ffffff 30%, ${COLORS.cyanSoft} 100%)`,
							WebkitBackgroundClip: isDot ? undefined : 'text',
							WebkitTextFillColor: isDot ? undefined : 'transparent',
							textShadow: isDot ? `0 0 40px ${COLORS.orange}` : undefined,
						}}
					>
						{ch}
					</span>
				);
			})}
		</div>
	);
};

export const S9Finale: React.FC = () => {
	const frame = useCurrentFrame();
	const sceneLen = TOTAL_FRAMES - f(SCENES.finale.start);
	const px = 640 + frame * 1.4;
	const py = 420 + wobble(frame, 0.8) * 5;
	const k = 0.62;
	const cg = {x: px + PLANE.cg[0] * k, y: py + PLANE.cg[1] * k};
	const wingC = {x: px + PLANE.wingCentre[0] * k, y: py + (PLANE.wingCentre[1] - 30) * k};
	const view: View = {cx: wingC.x, cy: wingC.y, s: 120};

	const air = prog(frame, L(CUES.invisible) - 6, L(CUES.invisibleAir) + 20, EASE.inOut);
	const ghostForces = fade(frame, L(CUES.holdingTons) - 4, 16, L(CUES.physics) - 10, 20);
	const title = L(CUES.physics) - 4;
	const pull = prog(frame, L(CUES.laws), sceneLen, EASE.inOut);
	const end = prog(frame, sceneLen - 26, sceneLen - 2, EASE.soft);

	const zoom = kf(frame, [0, L(CUES.overhead), L(CUES.holdingTons), L(CUES.invisible) + 30], [0.72, 0.8, 0.95, 1.05], EASE.inOut) * (1 - 0.3 * pull);
	const camX = cg.x + kf(frame, [0, L(CUES.invisible), L(CUES.physics)], [-120, 0, 0]);
	const camY = cg.y + kf(frame, [0, L(CUES.invisible), L(CUES.physics) + 20], [60, 30, -60]);
	const scroll = frame * 5;

	return (
		<SceneShell>
			<Sky mood="dusk" sunX={1500} sunY={kf(frame, [0, sceneLen], [640, 690])} sunGlow={1} stars={0.5} frame={frame} />
			<CloudLayer seed={61} count={5} y={[480, 640]} size={[340, 560]} scroll={scroll * 0.2} opacity={0.65} blur={3.5} light="#ffe9d2" shade="#6d86c0" rim="#ffb877" />
			<CloudSea top={kf(frame, [0, sceneLen], [800, 840])} scroll={scroll * 0.8} light="#fff3e6" shade="#8a9fd4" glow="#ffc58a" deep="#33508f" />
			<Camera x={camX} y={camY} zoom={zoom}>
				<svg width={6000} height={3000} style={{position: 'absolute', overflow: 'visible'}}>
					{/* the invisible air, made visible */}
					<g opacity={air * (1 - end)}>
						<Streamlines view={view} opacity={0.35} color={COLORS.cyanSoft} width={2} progress={air} />
						<Particles view={view} tau={(frame / FPS) * FLOW_RATE * 1.3} perLine={10} width={3.2} trail={0.22} mode="speed" xFade={[5, 7.2]} />
					</g>
					<Airliner x={px} y={py} width={1000 * k} frame={frame} engineGlow={0.6} />
					<g opacity={ghostForces}>
						<ForceArrow x={cg.x} y={cg.y - 40} angle={0} length={150} progress={ghostForces} color={FORCE_COLORS.lift} width={22} label="LIFT" labelSize={28} opacity={0.85} />
						<ForceArrow x={cg.x} y={cg.y + 40} angle={180} length={150} progress={ghostForces} color={FORCE_COLORS.weight} width={22} label="WEIGHT" labelSize={28} opacity={0.85} />
					</g>
				</svg>
			</Camera>
			<Vignette strength={0.5 + pull * 0.2} />
			<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 110}}>
				<Headline text="Not magic." accent={['magic']} frame={frame} at={L(CUES.notMagic) - 6} out={L(CUES.invisible) - 8} size={70} />
			</AbsoluteFill>
			<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 110}}>
				<Headline text="Invisible air" accent={['air']} accentColor={COLORS.cyan} frame={frame} at={L(CUES.invisible) - 2} out={title - 10} size={70} />
			</AbsoluteFill>
			<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: `rgba(3,11,31,${0.35 * prog(frame, title - 6, title + 20)})`}}>
				<PhysicsTitle frame={frame} at={title} />
				<div style={{marginTop: 26, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 24, letterSpacing: '0.42em', color: COLORS.sky200, opacity: prog(frame, title + 24, title + 44)}}>
					LIFT · WEIGHT · THRUST · DRAG
				</div>
			</AbsoluteFill>
			<AbsoluteFill style={{background: COLORS.navy900, opacity: end}} />
		</SceneShell>
	);
};
