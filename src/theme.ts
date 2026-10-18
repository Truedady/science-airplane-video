import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export const COLORS = {
	navy900: '#030b1f',
	navy800: '#06143a',
	navy700: '#0a2257',
	navy600: '#123478',
	sky500: '#2f7fd6',
	sky400: '#4aa3ef',
	sky300: '#8cc9ff',
	sky200: '#c4e4ff',
	cyan: '#3ff0ff',
	cyanSoft: '#7af6ff',
	white: '#ffffff',
	orange: '#ff9d3c',
	orangeDeep: '#ff6a1a',
	orangeSoft: '#ffc58a',
	lowPressure: '#38d7ff',
	highPressure: '#ff8a3d',
};

export const FONT_DISPLAY = 'Sora';
export const FONT_BODY = 'Inter';

const fonts: [string, string, string][] = [
	[FONT_DISPLAY, 'sora-latin-300-normal.woff2', '300'],
	[FONT_DISPLAY, 'sora-latin-400-normal.woff2', '400'],
	[FONT_DISPLAY, 'sora-latin-600-normal.woff2', '600'],
	[FONT_DISPLAY, 'sora-latin-700-normal.woff2', '700'],
	[FONT_DISPLAY, 'sora-latin-800-normal.woff2', '800'],
	[FONT_BODY, 'inter-latin-400-normal.woff2', '400'],
	[FONT_BODY, 'inter-latin-500-normal.woff2', '500'],
	[FONT_BODY, 'inter-latin-600-normal.woff2', '600'],
	[FONT_BODY, 'inter-latin-700-normal.woff2', '700'],
];

for (const [family, file, weight] of fonts) {
	loadFont({family, url: staticFile(`fonts/${file}`), weight, format: 'woff2'});
}
