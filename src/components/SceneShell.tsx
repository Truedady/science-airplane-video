import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {EASE, prog} from '../lib/anim';
import {XFADE} from '../timeline';

/**
 * Every scene sits in a shell that dissolves it in over the previous scene
 * (scale + defocus + fade), so cuts feel like a continuous camera move.
 */
export const SceneShell: React.FC<{children: React.ReactNode; enter?: boolean; zoomIn?: boolean}> = ({children, enter = true, zoomIn = true}) => {
	const frame = useCurrentFrame();
	const p = enter ? prog(frame, 0, XFADE, EASE.soft) : 1;
	return (
		<AbsoluteFill
			style={{
				opacity: p,
				transform: p < 1 ? `scale(${zoomIn ? 1.06 - 0.06 * p : 0.96 + 0.04 * p})` : undefined,
				filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined,
				overflow: 'hidden',
			}}
		>
			{children}
		</AbsoluteFill>
	);
};
