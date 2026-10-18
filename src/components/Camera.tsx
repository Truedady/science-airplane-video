import React from 'react';
import {AbsoluteFill} from 'remotion';
import {HEIGHT, WIDTH} from '../timeline';

/**
 * A virtual camera. `x`/`y` is the world point shown at the centre of the
 * frame, `zoom` scales the world, `rotate` rolls the camera (degrees).
 * World coordinates match a 1920×1080 canvas at zoom 1.
 */
export const Camera: React.FC<{
	x?: number;
	y?: number;
	zoom?: number;
	rotate?: number;
	children: React.ReactNode;
	style?: React.CSSProperties;
}> = ({x = WIDTH / 2, y = HEIGHT / 2, zoom = 1, rotate = 0, children, style}) => {
	return (
		<AbsoluteFill style={{overflow: 'hidden', ...style}}>
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					width: WIDTH,
					height: HEIGHT,
					transformOrigin: '0 0',
					transform: `translate(${WIDTH / 2}px, ${HEIGHT / 2}px) rotate(${rotate}deg) scale(${zoom}) translate(${-x}px, ${-y}px)`,
				}}
			>
				{children}
			</div>
		</AbsoluteFill>
	);
};

/** A parallax plane: moves a fraction `depth` of the camera offset (0 = fixed to screen, 1 = world). */
export const Parallax: React.FC<{
	camX: number;
	camY: number;
	depth: number;
	zoom?: number;
	children: React.ReactNode;
}> = ({camX, camY, depth, zoom = 1, children}) => {
	const z = 1 + (zoom - 1) * depth;
	return (
		<AbsoluteFill
			style={{
				transformOrigin: '50% 50%',
				transform: `scale(${z}) translate(${-(camX - WIDTH / 2) * depth}px, ${-(camY - HEIGHT / 2) * depth}px)`,
			}}
		>
			{children}
		</AbsoluteFill>
	);
};
