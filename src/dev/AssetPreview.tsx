import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Airliner} from '../components/Airliner';
import {CloudLayer, CloudSea} from '../components/Clouds';
import {Sky} from '../components/Sky';

/** Dev-only sheet for checking illustrations. */
export const AssetPreview: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Sky mood="dawn" />
			<CloudLayer seed={3} count={6} y={[300, 520]} size={[260, 420]} scroll={frame * 2} opacity={0.6} blur={3} />
			<CloudSea top={760} scroll={frame * 4} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<Airliner x={360} y={260} width={1200} frame={frame} engineGlow={0.7} gear={0} />
			</svg>
		</AbsoluteFill>
	);
};
