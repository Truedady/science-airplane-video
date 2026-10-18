import React from 'react';
import {Audio} from '@remotion/media';
import {interpolate, Sequence, staticFile} from 'remotion';
import {CUES, f, SCENES, TOTAL_FRAMES} from './timeline';

/**
 * Audio mix. The narration is the master track — unaltered, volume 1,
 * starting at frame 0, never trimmed or re-timed. Everything else is
 * original procedurally-generated sound design (scripts/make_sfx.py),
 * mixed well below the voice.
 */
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const Sfx: React.FC<{at: number; src: string; volume: number; name: string; lead?: number}> = ({at, src, volume, name, lead = 0}) => (
	<Sequence name={name} from={Math.max(0, f(at) - lead)} layout="none">
		<Audio src={staticFile(`sfx/${src}`)} volume={volume} />
	</Sequence>
);

export const Soundtrack: React.FC = () => {
	const cruiseFrom = f(SCENES.forces.start);
	return (
		<>
			<Audio name="Narration (master)" src={staticFile('voiceover.mp3')} volume={1} />

			{/* beds */}
			<Audio name="Music pad" src={staticFile('sfx/music_pad.wav')} volume={0.085} />
			<Audio
				name="Wind bed"
				src={staticFile('sfx/wind_bed.wav')}
				volume={(fr) =>
					// a little more air in the sky scenes, less in the lab scenes
					interpolate(fr, [0, f(SCENES.hand.start), f(SCENES.lift.start), f(SCENES.speed.start) + 150, f(SCENES.forces.start), TOTAL_FRAMES], [0.07, 0.07, 0.035, 0.035, 0.07, 0.07], clamp)
				}
			/>
			<Sequence name="Engine hum (cruise → stops)" from={cruiseFrom} durationInFrames={f(CUES.stop) + 30 - cruiseFrom} layout="none">
				<Audio
					src={staticFile('sfx/engine_hum.wav')}
					volume={(fr) => interpolate(fr, [0, 20, f(CUES.suddenly) - cruiseFrom, f(CUES.stop) + 20 - cruiseFrom], [0, 0.07, 0.07, 0], clamp)}
				/>
			</Sequence>

			{/* transitions */}
			<Sfx name="Whoosh → answer" at={SCENES.answer.start} src="whoosh_soft.wav" volume={0.2} lead={12} />
			<Sfx name="Whoosh → hand" at={SCENES.hand.start} src="whoosh.wav" volume={0.22} lead={18} />
			<Sfx name="Whoosh → scale reveal" at={CUES.biggerScale} src="whoosh.wav" volume={0.2} lead={10} />
			<Sfx name="Whoosh → lift" at={SCENES.lift.start} src="whoosh_soft.wav" volume={0.2} lead={12} />
			<Sfx name="Whoosh → newton" at={CUES.anotherWay} src="whoosh_soft.wav" volume={0.18} lead={10} />
			<Sfx name="Whoosh → speed" at={SCENES.speed.start} src="whoosh_soft.wav" volume={0.18} lead={12} />
			<Sfx name="Whoosh → runway" at={CUES.thatsWhy} src="whoosh.wav" volume={0.2} lead={16} />
			<Sfx name="Whoosh → forces" at={SCENES.forces.start} src="whoosh_soft.wav" volume={0.18} lead={12} />
			<Sfx name="Whoosh → glide" at={CUES.gliding} src="whoosh_soft.wav" volume={0.2} lead={10} />
			<Sfx name="Whoosh → finale" at={SCENES.finale.start} src="whoosh.wav" volume={0.2} lead={18} />

			{/* scientific interface accents on key reveals */}
			<Sfx name="Blip · weight" at={CUES.weigh} src="ui_blip.wav" volume={0.3} />
			<Sfx name="Tick · gravity" at={CUES.fall} src="ui_tick.wav" volume={0.35} />
			<Sfx name="Tick · not engines" at={CUES.notEngines} src="ui_tick.wav" volume={0.3} />
			<Sfx name="Blip · wings" at={CUES.holdThemUp} src="ui_blip.wav" volume={0.28} />
			<Sfx name="Blip · upward push" at={CUES.upward} src="ui_blip.wav" volume={0.26} />
			<Sfx name="Tick · angle" at={CUES.angle} src="ui_tick.wav" volume={0.3} />
			<Sfx name="Blip · pressure" at={CUES.pressure} src="ui_blip.wav" volume={0.26} />
			<Sfx name="Blip · lift" at={CUES.lift} src="ui_blip.wav" volume={0.32} />
			<Sfx name="Tick · newton" at={CUES.newton} src="ui_tick.wav" volume={0.3} />
			<Sfx name="Blip · air pushes up" at={CUES.airPushesWingUp} src="ui_blip.wav" volume={0.28} />
			<Sfx name="Blip · same process" at={CUES.same} src="ui_blip.wav" volume={0.28} />
			<Sfx name="Tick · thrust" at={CUES.thrust} src="ui_tick.wav" volume={0.3} />
			<Sfx name="Tick · drag" at={CUES.airResistance} src="ui_tick.wav" volume={0.3} />
			<Sfx name="Blip · balance" at={CUES.maintainSpeed} src="ui_blip.wav" volume={0.26} />
			<Sfx name="Blip · glide lift" at={CUES.glideLift} src="ui_blip.wav" volume={0.28} />

			{/* events */}
			<Sfx name="Take-off roar" at={CUES.accelerate} src="takeoff_roar.wav" volume={0.22} lead={30} />
			<Sfx name="Engines spool down" at={CUES.suddenly} src="spool_down.wav" volume={0.3} />
			<Sfx name="Riser → title" at={CUES.physics} src="riser.wav" volume={0.22} lead={70} />
			<Sfx name="Impact · IT'S PHYSICS" at={CUES.physics} src="impact.wav" volume={0.45} />
		</>
	);
};
