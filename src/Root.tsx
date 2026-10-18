import React from 'react';
import {Composition, Folder} from 'remotion';
import {AssetPreview} from './dev/AssetPreview';
import {S1Mystery} from './scenes/S1Mystery';
import {S2Answer} from './scenes/S2Answer';
import {S3Hand} from './scenes/S3Hand';
import {S4Lift} from './scenes/S4Lift';
import {S5Newton} from './scenes/S5Newton';
import {S6Speed} from './scenes/S6Speed';
import {S7Forces} from './scenes/S7Forces';
import {S8Glide} from './scenes/S8Glide';
import {S9Finale} from './scenes/S9Finale';
import './theme';
import {FPS, HEIGHT, TOTAL_FRAMES, WIDTH, sceneFrames} from './timeline';
import {AirplaneExplainer} from './Video';

const common = {fps: FPS, width: WIDTH, height: HEIGHT};

export const RemotionRoot: React.FC = () => (
	<>
		<Composition id="AirplaneExplainer" component={AirplaneExplainer} durationInFrames={TOTAL_FRAMES} {...common} />
		{/* Each scene on its own (local frame 0 = scene start on the master timeline; no audio). */}
		<Folder name="Scenes">
			<Composition id="S1-Mystery" component={S1Mystery} durationInFrames={sceneFrames('mystery').durationInFrames} {...common} />
			<Composition id="S2-Answer" component={S2Answer} durationInFrames={sceneFrames('answer').durationInFrames} {...common} />
			<Composition id="S3-Hand" component={S3Hand} durationInFrames={sceneFrames('hand').durationInFrames} {...common} />
			<Composition id="S4-Lift" component={S4Lift} durationInFrames={sceneFrames('lift').durationInFrames} {...common} />
			<Composition id="S5-Newton" component={S5Newton} durationInFrames={sceneFrames('newton').durationInFrames} {...common} />
			<Composition id="S6-Speed" component={S6Speed} durationInFrames={sceneFrames('speed').durationInFrames} {...common} />
			<Composition id="S7-Forces" component={S7Forces} durationInFrames={sceneFrames('forces').durationInFrames} {...common} />
			<Composition id="S8-Glide" component={S8Glide} durationInFrames={sceneFrames('glide').durationInFrames} {...common} />
			<Composition id="S9-Finale" component={S9Finale} durationInFrames={sceneFrames('finale').durationInFrames} {...common} />
		</Folder>
		<Folder name="Dev">
			<Composition id="AssetPreview" component={AssetPreview} durationInFrames={60} {...common} />
		</Folder>
	</>
);
