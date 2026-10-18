import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Airliner, PLANE} from '../components/Airliner';
import {Camera} from '../components/Camera';
import {CloudLayer, CloudSea} from '../components/Clouds';
import {SceneShell} from '../components/SceneShell';
import {Sky, Vignette} from '../components/Sky';
import {Headline} from '../components/Typography';
import {EASE, prog, wobble} from '../lib/anim';
import {COLORS, FONT_DISPLAY} from '../theme';
import {CUES, local} from '../timeline';

const L = (sec: number) => local('answer', sec);

export const S2Answer: React.FC = () => {
	const frame = useCurrentFrame();
	const px = 460 + frame * 1.2;
	const py = 380 + wobble(frame + 420, 1.2) * 5;

	const engineHi = prog(frame, L(CUES.surprising), L(CUES.surprising) + 14) * (1 - prog(frame, L(CUES.holdThemUp), L(CUES.holdThemUp) + 12));
	const strike = prog(frame, L(CUES.notEngines), L(CUES.engines) + 10, EASE.inOut);
	const wing = prog(frame, L(CUES.holdThemUp) - 2, L(CUES.holdThemUp) + 16);
	const toWing = prog(frame, L(CUES.holdThemUp), L(CUES.holdThemUp) + 40, EASE.inOut);

	const focusEngine = prog(frame, L(CUES.surprising), L(CUES.engines), EASE.inOut);
	const zoom = 0.95 + focusEngine * 0.35 + toWing * 0.75;
	const camX = px + PLANE.cg[0] + focusEngine * 40 + toWing * (PLANE.wingCentre[0] - PLANE.cg[0] - 40 + 10);
	const camY = py + PLANE.cg[1] + 60 + focusEngine * 20 + toWing * (PLANE.wingCentre[1] - PLANE.cg[1] - 70);

	const e = {x: px + PLANE.engine[0], y: py + PLANE.engine[1]};
	const fe = {x: px + PLANE.farEngine[0], y: py + PLANE.farEngine[1]};
	const scroll = (frame + 430) * 6;

	return (
		<SceneShell>
			<Sky mood="dawn" sunX={1560} sunY={700} sunGlow={0.9} stars={0.4} frame={frame} />
			<CloudLayer seed={5} count={6} y={[560, 700]} size={[300, 520]} scroll={scroll * 0.4} opacity={0.7} blur={3} light="#eef5ff" shade="#7d9fd0" rim="#ffd0a0" />
			<CloudSea top={830} scroll={scroll * 0.9} />
			<AbsoluteFill style={{background: COLORS.navy900, opacity: 0.25 * engineHi}} />
			<Camera x={camX} y={camY} zoom={zoom}>
				<svg width={4000} height={2000} style={{position: 'absolute', overflow: 'visible'}}>
					<Airliner x={px} y={py} width={1000} frame={frame} engineGlow={0.6 * (1 - strike * 0.5)} engineHighlight={engineHi} wingGlow={wing} />
					{/* strike through both engines */}
					{[e, fe].map((p, i) => (
						<g key={i} stroke={COLORS.orange} strokeWidth={7 - i * 2} strokeLinecap="round" opacity={(1 - toWing) * (i ? 0.75 : 1)}>
							<line x1={p.x - 46} y1={p.y - 30} x2={p.x - 46 + 92 * strike} y2={p.y - 30 + 60 * strike} />
							<line x1={p.x + 46} y1={p.y - 30} x2={p.x + 46 - 92 * Math.max(0, strike * 1.3 - 0.3)} y2={p.y - 30 + 60 * Math.max(0, strike * 1.3 - 0.3)} />
						</g>
					))}
					<text
						x={e.x + 20}
						y={e.y + 84}
						textAnchor="middle"
						fontFamily={FONT_DISPLAY}
						fontWeight={700}
						fontSize={30}
						letterSpacing={5}
						fill="#fff"
						opacity={engineHi}
						style={{paintOrder: 'stroke', stroke: 'rgba(3,11,31,0.6)', strokeWidth: 6}}
					>
						ENGINES
					</text>
					<line x1={e.x - 70} x2={e.x - 70 + 180 * strike} y1={e.y + 74} y2={e.y + 74} stroke={COLORS.orange} strokeWidth={4} opacity={engineHi} />
					{/* wing sweep highlight */}
					{wing > 0 ? (
						<text
							x={px + 300}
							y={py + 300}
							textAnchor="middle"
							fontFamily={FONT_DISPLAY}
							fontWeight={700}
							fontSize={26}
							letterSpacing={6}
							fill={COLORS.cyan}
							opacity={wing}
							style={{paintOrder: 'stroke', stroke: 'rgba(3,11,31,0.6)', strokeWidth: 6}}
						>
							THE WINGS
						</text>
					) : null}
				</svg>
			</Camera>
			<Vignette strength={0.5} />
			<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 100}}>
				<Headline text="It's not the engines" accent={['not']} frame={frame} at={L(CUES.notEngines) - 3} out={L(CUES.holdThemUp) - 4} size={78} stagger={3} />
			</AbsoluteFill>
			<AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center', paddingTop: 100}}>
				<Headline text="that hold them up" accent={['up']} accentColor={COLORS.cyan} frame={frame} at={L(CUES.holdThemUp) + 12} size={78} stagger={3} />
			</AbsoluteFill>
		</SceneShell>
	);
};
