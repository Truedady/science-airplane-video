import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Airliner, PLANE} from '../components/Airliner';
import {Camera, Parallax} from '../components/Camera';
import {CloudLayer, CloudSea} from '../components/Clouds';
import {ForceArrow} from '../components/Infographics';
import {SceneShell} from '../components/SceneShell';
import {Sky, Vignette} from '../components/Sky';
import {Headline, Tag} from '../components/Typography';
import {EASE, fade, kf, prog, wobble} from '../lib/anim';
import {COLORS, FONT_BODY, FONT_DISPLAY} from '../theme';
import {CUES, local} from '../timeline';
import {useInset} from '../lib/layout';

const L = (sec: number) => local('mystery', sec);

/** Distant traffic: tiny jets with contrails, at several depths. */
const DistantJets: React.FC<{frame: number; opacity: number}> = ({frame, opacity}) => {
	const jets = [
		{y: 250, x0: -200, v: 2.2, s: 0.09, d: 0},
		{y: 180, x0: 600, v: 1.4, s: 0.06, d: 20},
		{y: 330, x0: 1300, v: 2.8, s: 0.11, d: 8},
		{y: 140, x0: 1500, v: 1.1, s: 0.05, d: 30},
		{y: 410, x0: 200, v: 3.2, s: 0.13, d: 14},
	];
	return (
		<svg width={1920} height={1080} style={{position: 'absolute', inset: 0, opacity}}>
			<defs>
				<linearGradient id="contrail" x1="1" y1="0" x2="0" y2="0">
					<stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
					<stop offset="100%" stopColor="#fff" stopOpacity="0" />
				</linearGradient>
			</defs>
			{jets.map((j, i) => {
				const appear = prog(frame, L(CUES.thousands) + j.d, L(CUES.thousands) + j.d + 20);
				const x = j.x0 + (frame - L(CUES.thousands)) * j.v;
				const w = 1000 * j.s;
				return (
					<g key={i} opacity={appear}>
						<rect x={x - 520 * j.s * 6} y={j.y + w * 0.1} width={520 * j.s * 6} height={Math.max(2, w * 0.03)} fill="url(#contrail)" />
						<Airliner x={x} y={j.y} width={w} navLights={false} silhouette={1} silhouetteColor="#cfe3ff" />
					</g>
				);
			})}
		</svg>
	);
};

export const S1Mystery: React.FC = () => {
	const frame = useCurrentFrame();
	const inset = useInset();

	// Camera: wide establishing shot → push toward the aircraft.
	const zoom = kf(frame, [0, L(CUES.titleOut) + 6, L(CUES.giantMetal) + 10, L(CUES.weigh), L(CUES.fall) + 30], [0.36, 0.42, 1.3, 0.84, 0.8], EASE.inOut);
	const planeWorldX = 460 + frame * 1.2;
	const planeWorldY = 380 + wobble(frame, 1.2) * 6;
	const camX = planeWorldX + kf(frame, [0, L(CUES.titleOut), L(CUES.giantMetal) + 10, L(CUES.weigh), L(CUES.fall)], [530, 530, 600, 800, 640]);
	const camY = planeWorldY + kf(frame, [0, L(CUES.titleOut), L(CUES.giantMetal) + 10, L(CUES.weigh), L(CUES.fall) + 10], [-150, -110, 158, 150, 330]);
	const roll = kf(frame, [0, L(CUES.giantMetal), L(CUES.fall) + 40], [-2.5, 0, 0.6]);

	// Cloud scroll: aircraft is moving, camera follows it.
	const scroll = frame * 6;

	// Weight + gravity cues
	const weightIn = prog(frame, L(CUES.weigh) - 4, L(CUES.weigh) + 16);
	const tonsFill = prog(frame, L(CUES.hundredsOfTons), L(CUES.tons) + 14, EASE.inOut);
	const gravity = prog(frame, L(CUES.whyDont), L(CUES.fall) + 8, EASE.inOut);
	const tension = prog(frame, L(CUES.fall) - 6, L(CUES.fall) + 30);
	const glint = prog(frame, L(CUES.giantMetal), L(CUES.giantMetal) + 40, EASE.inOut);

	const cg = {x: planeWorldX + PLANE.cg[0], y: planeWorldY + PLANE.cg[1]};

	return (
		<SceneShell enter={false}>
			<Sky mood="dawn" sunX={1560} sunY={kf(frame, [0, 420], [760, 700])} sunGlow={0.9} stars={0.6} frame={frame} />
			<Parallax camX={camX * 0.05} camY={camY * 0.05} depth={1}>
				<CloudLayer seed={11} count={5} y={[330, 520]} size={[380, 560]} scroll={scroll * 0.15} opacity={0.5} blur={4} light="#dbe9ff" shade="#6f8fc4" rim="#ffc996" />
			</Parallax>
			<DistantJets frame={frame} opacity={fade(frame, L(CUES.thousands), 15, L(CUES.weigh), 20)} />
			<CloudLayer seed={5} count={6} y={[560, 700]} size={[300, 520]} scroll={scroll * 0.4} opacity={0.75} blur={2.5} light="#eef5ff" shade="#7d9fd0" rim="#ffd0a0" />
			<CloudSea top={kf(frame, [0, 300], [780, 830])} scroll={scroll * 0.9} />

			<Camera x={camX} y={camY} zoom={zoom} rotate={roll}>
				<svg width={4000} height={2000} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<defs>
						<linearGradient id="s1glint" x1="0" y1="0" x2="1" y2="0">
							<stop offset="0%" stopColor="#fff" stopOpacity="0" />
							<stop offset="50%" stopColor="#fff" stopOpacity="0.85" />
							<stop offset="100%" stopColor="#fff" stopOpacity="0" />
						</linearGradient>
						<clipPath id="s1clip">
							<rect x={planeWorldX + 46} y={planeWorldY + 104} width={910} height={90} rx={45} />
						</clipPath>
					</defs>
					{/* engine heat shimmer trail */}
					<Airliner x={planeWorldX} y={planeWorldY} width={1000} frame={frame} engineGlow={0.55 + 0.1 * Math.sin(frame * 0.4)} />
					{glint > 0 && glint < 1 ? (
						<rect clipPath="url(#s1clip)" x={planeWorldX - 300 + glint * 1500} y={planeWorldY + 90} width={260} height={120} fill="url(#s1glint)" transform={`skewX(-20)`} opacity={0.8} />
					) : null}
					<ForceArrow
						x={cg.x}
						y={cg.y + 30}
						angle={180}
						length={420}
						progress={gravity}
						color={COLORS.orange}
						width={30}
						label="GRAVITY"
						labelSize={38}
						glow={0.7 + 0.2 * Math.sin(frame * 0.25) * tension}
					/>
				</svg>
			</Camera>

			{/* Weight indicator (no invented figures: the narration says "hundreds of tons") */}
			<div
				style={{
					position: 'absolute',
					right: 110 + inset,
					top: 170,
					width: 360,
					padding: '26px 30px',
					borderRadius: 22,
					background: 'rgba(3,11,31,0.66)',
					border: '1.5px solid rgba(140,201,255,0.3)',
					boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
					opacity: weightIn * (1 - prog(frame, L(CUES.fall) + 30, L(CUES.fall) + 46)),
					transform: `translateX(${(1 - weightIn) * 40}px)`,
					fontFamily: FONT_BODY,
					color: '#fff',
				}}
			>
				<div style={{fontSize: 18, letterSpacing: '0.24em', color: COLORS.sky300, fontWeight: 600}}>AIRCRAFT MASS</div>
				<div style={{display: 'flex', gap: 8, marginTop: 18, alignItems: 'flex-end', height: 90}}>
					{new Array(10).fill(0).map((_, i) => {
						const fill = Math.max(0, Math.min(1, tonsFill * 10 - i));
						return (
							<div key={i} style={{flex: 1, height: 30 + i * 6, borderRadius: 5, background: 'rgba(140,201,255,0.14)', position: 'relative', overflow: 'hidden'}}>
								<div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: `${fill * 100}%`, background: `linear-gradient(180deg, ${COLORS.orangeSoft}, ${COLORS.orange})`}} />
							</div>
						);
					})}
				</div>
				<div style={{fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 40, marginTop: 16, letterSpacing: '0.02em', opacity: prog(frame, L(CUES.hundredsOfTons), L(CUES.hundredsOfTons) + 12)}}>
					HUNDREDS
				</div>
				<div style={{fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: 26, color: COLORS.orangeSoft, opacity: prog(frame, L(CUES.tons), L(CUES.tons) + 10)}}>of tons</div>
			</div>

			<Tag frame={frame} at={L(CUES.thousands)} out={L(CUES.giantMetal)} color={COLORS.cyan} style={{left: 110, top: 150}}>
				Right now · thousands of people in the air
			</Tag>

			<Vignette strength={0.45 + tension * 0.25} />

			{/* Title */}
			<AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingBottom: 420}}>
				<div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: 22, letterSpacing: '0.4em', color: COLORS.sky300, opacity: fade(frame, 0, 18, L(CUES.titleOut) - 4, 14), marginBottom: 24}}>
					THE PHYSICS OF FLIGHT
				</div>
				<Headline text="Why don't airplanes fall out of the sky?" accent={['fall']} frame={frame} at={L(CUES.title) + 2} out={L(CUES.titleOut) + 4} size={92} stagger={2} style={{maxWidth: 1400}} />
			</AbsoluteFill>

			<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 96}}>
				<Headline text="Why doesn't it fall?" accent={['fall']} frame={frame} at={L(CUES.fall) - 2} size={76} stagger={3} />
			</AbsoluteFill>

			{/* fade up from black */}
			<AbsoluteFill style={{background: COLORS.navy900, opacity: 1 - prog(frame, 0, 20, EASE.soft)}} />
		</SceneShell>
	);
};
