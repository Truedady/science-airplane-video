import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Camera} from '../components/Camera';
import {Airfoil, Particles, PressureField, Streamlines, toScreen, VelocityGrid} from '../components/Flow';
import {ForceArrow} from '../components/Infographics';
import {SceneShell} from '../components/SceneShell';
import {LabBackdrop, Vignette} from '../components/Sky';
import {Kicker, Tag} from '../components/Typography';
import {EASE, kf, prog} from '../lib/anim';
import {COLORS, FONT_BODY, FONT_DISPLAY} from '../theme';
import {CUES, FPS, local} from '../timeline';
import {FLOW_RATE, LIFT_VIEW} from './S4Lift';

const L = (sec: number) => local('newton', sec);
const V = LIFT_VIEW;

export const S5Newton: React.FC = () => {
	const frame = useCurrentFrame();
	const tau = ((frame + 527) / FPS) * FLOW_RATE + 3;

	const another = prog(frame, L(CUES.anotherWay) - 6, L(CUES.anotherWay) + 30, EASE.inOut);
	const pressureBack = prog(frame, L(CUES.twoWays) - 4, L(CUES.twoWays) + 20, EASE.inOut);
	const pressure = (1 - another) * 0.95 + pressureBack * 0.55;
	const liftCarry = 1 - prog(frame, 0, L(CUES.anotherWay) + 10);
	const downMode = prog(frame, L(CUES.wingPushes) - 4, L(CUES.wingPushes) + 14);
	const grid = prog(frame, L(CUES.wingPushes), L(CUES.downward) + 16, EASE.inOut);
	const sweep = prog(frame, L(CUES.hugeAmount), L(CUES.downward) + 20, EASE.inOut);
	const newton = prog(frame, L(CUES.newton) - 4, L(CUES.newton) + 16);
	const onAir = prog(frame, L(CUES.pushesAirDown) - 2, L(CUES.pushesAirDown) + 18, EASE.out);
	const onWing = prog(frame, L(CUES.airPushesWingUp) - 2, L(CUES.airPushesWingUp) + 18, EASE.out);
	const same = prog(frame, L(CUES.same) - 6, L(CUES.same) + 18, EASE.inOut);
	const pulse = 0.5 + 0.5 * Math.sin((frame - L(CUES.up)) * 0.3);

	const zoom = kf(frame, [0, L(CUES.anotherWay), L(CUES.anotherWay) + 40, L(CUES.newton), L(CUES.twoWays), L(CUES.same) + 30], [0.92, 0.92, 0.8, 0.84, 0.86, 0.9], EASE.inOut);
	const camX = 960 + kf(frame, [L(CUES.anotherWay), L(CUES.anotherWay) + 40, L(CUES.newton), L(CUES.twoWays) + 20], [0, -240, -150, -40], EASE.inOut);
	const camY = 540 + kf(frame, [0, L(CUES.anotherWay) + 40, L(CUES.newton), L(CUES.twoWays) + 20], [-50, 20, -70, -90], EASE.inOut);

	const te = toScreen(V, 2.0, -0.25);
	const centre = toScreen(V, 0, 0.12);
	// Large translucent "momentum" swoosh: air leaving the wing, turned downward.
	const swoosh = `M ${te[0] + 40} ${te[1] - 10} C ${te[0] - 200} ${te[1] + 10}, ${te[0] - 420} ${te[1] + 90}, ${te[0] - 640} ${te[1] + 230}`;

	return (
		<SceneShell zoomIn={false}>
			<LabBackdrop offsetX={(frame + 527) * 2} />
			<Camera x={camX} y={camY} zoom={zoom}>
				<PressureField view={V} opacity={pressure} />
				<svg width={1920} height={1080} style={{position: 'absolute', overflow: 'visible'}}>
					<defs>
						<linearGradient id="s5sw" x1="1" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor={COLORS.orange} stopOpacity="0" />
							<stop offset="35%" stopColor={COLORS.orange} stopOpacity="0.55" />
							<stop offset="100%" stopColor={COLORS.orangeDeep} stopOpacity="0.9" />
						</linearGradient>
						<marker id="s5head" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto">
							<path d="M0,0 L10,5 L0,10 z" fill={COLORS.orangeDeep} />
						</marker>
					</defs>
					<Streamlines view={V} opacity={0.18} />
					<VelocityGrid view={V} progress={grid} opacity={grid * (1 - same * 0.6)} />
					<Particles view={V} tau={tau} opacity={(1 - downMode) * (1 - pressure * 0.3)} perLine={9} mode="speed" />
					<Particles view={V} tau={tau} opacity={downMode} perLine={11} mode="downwash" width={3.4} />
					<path d={swoosh} fill="none" stroke="url(#s5sw)" strokeWidth={70} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" style={{strokeDashoffset: 1 - sweep}} opacity={0.55 * (1 - same * 0.5)} />
					<path d={swoosh} fill="none" stroke={COLORS.orangeSoft} strokeWidth={4} pathLength={1} strokeDasharray="1 1" style={{strokeDashoffset: 1 - sweep}} markerEnd={sweep > 0.95 ? 'url(#s5head)' : undefined} opacity={1 - same * 0.5} />
					<text x={te[0] - 560} y={te[1] + 300} textAnchor="middle" fontFamily={FONT_DISPLAY} fontWeight={700} fontSize={30} letterSpacing={4} fill={COLORS.orangeSoft} opacity={prog(frame, L(CUES.downward) - 4, L(CUES.downward) + 14) * (1 - onAir)}>
						AIR DEFLECTED DOWNWARD
					</text>
					<Airfoil view={V} glow={0.5 * onWing * pulse * (1 - same)} />
					{/* Lift carried over from the previous scene */}
					<ForceArrow x={V.cx + 20} y={V.cy - 40} angle={0} length={420} progress={liftCarry} color={COLORS.cyan} width={34} label="LIFT" labelSize={48} opacity={liftCarry} />
					{/* Newton pair: equal and opposite, acting on DIFFERENT bodies */}
					<ForceArrow
						x={te[0] - 260}
						y={te[1] + 80}
						angle={180}
						length={280}
						progress={onAir}
						color={COLORS.orange}
						width={28}
						label={same > 0.5 ? 'FORCE ON THE AIR' : 'WING PUSHES AIR DOWN'}
						labelSize={28}
						opacity={1 - same * 0.45}
					/>
					<ForceArrow
						x={centre[0]}
						y={centre[1] - 30}
						angle={0}
						length={280 + same * 140}
						progress={onWing}
						color={COLORS.cyan}
						width={28 + same * 6}
						label={same > 0.5 ? 'LIFT' : 'AIR PUSHES WING UP'}
						labelSize={28 + same * 20}
						glow={0.6 + 0.3 * pulse}
					/>
				</svg>
			</Camera>
			<Vignette strength={0.45} />
			<Kicker index="03" title="ANOTHER WAY TO SEE IT" frame={frame} at={L(CUES.anotherWay)} out={L(CUES.newton) - 10} />

			{/* Newton's third law card */}
			<div
				style={{
					position: 'absolute',
					left: '50%',
					top: 70,
					transform: `translate(-50%, ${(1 - newton) * -20}px)`,
					opacity: newton * (1 - prog(frame, L(CUES.twoWays) - 10, L(CUES.twoWays) + 4)),
					padding: '22px 44px',
					borderRadius: 20,
					background: 'rgba(3,11,31,0.7)',
					border: `1.5px solid ${COLORS.sky300}44`,
					textAlign: 'center',
					color: '#fff',
				}}
			>
				<div style={{fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 44, letterSpacing: '0.08em'}}>
					NEWTON’S <span style={{color: COLORS.orange}}>THIRD</span> LAW
				</div>
				<div style={{fontFamily: FONT_BODY, fontWeight: 500, fontSize: 24, color: COLORS.sky200, marginTop: 6}}>Every action has an equal and opposite reaction</div>
			</div>

			{/* Two descriptions, one force */}
			<div style={{position: 'absolute', left: 0, right: 0, bottom: 150, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28, opacity: prog(frame, L(CUES.twoWays), L(CUES.twoWays) + 16)}}>
				<Tag frame={frame} at={L(CUES.twoWays)} color={COLORS.lowPressure} style={{position: 'relative'}}>
					Pressure difference
				</Tag>
				<div style={{fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 46, color: '#fff', opacity: same}}>=</div>
				<Tag frame={frame} at={L(CUES.twoWays) + 8} color={COLORS.orange} style={{position: 'relative'}}>
					Air pushed downward
				</Tag>
			</div>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					bottom: 90,
					textAlign: 'center',
					fontFamily: FONT_DISPLAY,
					fontWeight: 600,
					fontSize: 30,
					letterSpacing: '0.12em',
					color: COLORS.cyanSoft,
					opacity: same,
					transform: `translateY(${(1 - same) * 14}px)`,
				}}
			>
				ONE FORCE · TWO DESCRIPTIONS
			</div>
			<Tag frame={frame} at={L(CUES.downward)} out={L(CUES.newton)} color={COLORS.orange} style={{left: 110, bottom: 110}}>
				Upwash ahead · downwash behind
			</Tag>
		</SceneShell>
	);
};
