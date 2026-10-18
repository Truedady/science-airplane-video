import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {S1Mystery} from './scenes/S1Mystery';
import {S2Answer} from './scenes/S2Answer';
import {S3Hand} from './scenes/S3Hand';
import {S4Lift} from './scenes/S4Lift';
import {S5Newton} from './scenes/S5Newton';
import {S6Speed} from './scenes/S6Speed';
import {S7Forces} from './scenes/S7Forces';
import {S8Glide} from './scenes/S8Glide';
import {S9Finale} from './scenes/S9Finale';
import {Soundtrack} from './Soundtrack';
import {COLORS} from './theme';
import {sceneFrames} from './timeline';

/**
 * The full explainer. Scenes are placed on the master (voiceover) timeline
 * using frame ranges derived from word timestamps (see timeline.ts).
 * Each scene overlaps the next by XFADE frames and dissolves in on top.
 */
export const AirplaneExplainer: React.FC = () => {
	return (
		<AbsoluteFill style={{background: COLORS.navy900}}>
			<Sequence name="1 · The mystery" {...sceneFrames('mystery')}>
				<S1Mystery />
			</Sequence>
			<Sequence name="2 · The surprising answer" {...sceneFrames('answer')}>
				<S2Answer />
			</Sequence>
			<Sequence name="3 · The hand experiment" {...sceneFrames('hand')}>
				<S3Hand />
			</Sequence>
			<Sequence name="4 · How wings make lift" {...sceneFrames('lift')}>
				<S4Lift />
			</Sequence>
			<Sequence name="5 · Newton's third law" {...sceneFrames('newton')}>
				<S5Newton />
			</Sequence>
			<Sequence name="6 · Why speed matters" {...sceneFrames('speed')}>
				<S6Speed />
			</Sequence>
			<Sequence name="7 · What engines do" {...sceneFrames('forces')}>
				<S7Forces />
			</Sequence>
			<Sequence name="8 · Engine failure & glide" {...sceneFrames('glide')}>
				<S8Glide />
			</Sequence>
			<Sequence name="9 · It's physics" {...sceneFrames('finale')}>
				<S9Finale />
			</Sequence>
			<Soundtrack />
		</AbsoluteFill>
	);
};
