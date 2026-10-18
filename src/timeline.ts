/**
 * Master timeline. The recorded voiceover is the clock: every scene boundary
 * and visual cue is derived from word timestamps in data/alignment.json
 * (Vosk/Kaldi forced alignment of voiceover.mp3 against script.txt).
 *
 * To retime a visual, change which word it is anchored to — not raw numbers.
 */
import alignment from '../data/alignment.json';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const AUDIO_DURATION = alignment.durationSec; // 117.08 s
/** Short silent outro after the narration so the final title can breathe and fade. */
export const OUTRO_SEC = 2.0;
export const TOTAL_FRAMES = Math.ceil((AUDIO_DURATION + OUTRO_SEC) * FPS);

type Word = (typeof alignment.words)[number];
const WORDS: Word[] = alignment.words;
const clean = (s: string) => s.toLowerCase().replace(/[^a-z']/g, '');

/**
 * Start time (s) of a spoken word. `sentence` is the 0-based line of script.txt;
 * `nth` picks repeated occurrences of the same word within that sentence.
 */
export const at = (sentence: number, word: string, nth = 0): number => {
	const hits = WORDS.filter((w) => w.sentence === sentence && clean(w.text) === clean(word));
	const w = hits[nth];
	if (!w || w.start === null) {
		throw new Error(`Word "${word}" (#${nth}) not found in sentence ${sentence}`);
	}
	return w.start;
};
export const endOf = (sentence: number, word: string, nth = 0): number => {
	const hits = WORDS.filter((w) => w.sentence === sentence && clean(w.text) === clean(word));
	return hits[nth].end as number;
};
export const sentence = (i: number) => alignment.sentences[i];

/** Seconds → frames on the master timeline. */
export const f = (sec: number) => Math.round(sec * FPS);

/** Crossfade overlap between consecutive scenes. */
export const XFADE = 18;

/**
 * Scene boundaries (seconds). Each scene begins just before the first
 * sentence it illustrates (gap between sentences) and overlaps the next
 * by XFADE frames for a cinematic dissolve.
 */
const gapBefore = (s: number) => (sentence(s - 1).end + sentence(s).start) / 2;

export const SCENES = {
	mystery: {start: 0, end: gapBefore(4)},
	answer: {start: gapBefore(4), end: gapBefore(5)},
	hand: {start: gapBefore(5), end: gapBefore(8)},
	lift: {start: gapBefore(8), end: gapBefore(12)},
	newton: {start: gapBefore(12), end: gapBefore(16)},
	speed: {start: gapBefore(16), end: gapBefore(19)},
	forces: {start: gapBefore(19), end: gapBefore(21)},
	glide: {start: gapBefore(21), end: gapBefore(27)},
	finale: {start: gapBefore(27), end: AUDIO_DURATION + OUTRO_SEC},
} as const;

export type SceneId = keyof typeof SCENES;

/** Frame range of a scene on the master timeline (includes the crossfade tail). */
export const sceneFrames = (id: SceneId) => {
	const s = SCENES[id];
	const from = f(s.start);
	const isLast = id === 'finale';
	const to = isLast ? TOTAL_FRAMES : f(s.end) + XFADE;
	return {from, durationInFrames: to - from};
};

/**
 * Visual cues, in seconds on the master timeline, anchored to spoken words.
 * Scene components convert these to local frames with `local(id, sec)`.
 */
export const CUES = {
	// 1 — Mystery
	title: at(0, 'why'),
	titleOut: endOf(0, 'sky?'),
	thousands: at(1, 'thousands'),
	people: at(1, 'people'),
	giantMetal: at(1, 'giant'),
	weigh: at(2, 'weigh'),
	hundredsOfTons: at(2, 'hundreds'),
	tons: at(2, 'tons.'),
	whyDont: at(3, 'why'),
	fall: at(3, 'fall?'),
	// 2 — Surprising answer
	surprising: at(4, 'surprising'),
	notEngines: at(4, 'not'),
	engines: at(4, 'engines'),
	holdThemUp: at(4, 'hold'),
	// 3 — Hand experiment
	understand: at(5, 'understand'),
	hand: at(5, 'hand'),
	carWindow: at(5, 'car'),
	tilt: at(6, 'tilt'),
	feelAir: at(6, 'air'),
	upward: at(6, 'upward.'),
	airplaneWing: at(7, 'wing'),
	similar: at(7, 'similar'),
	much: at(7, 'much'),
	biggerScale: at(7, 'bigger'),
	// 4 — Lift
	movesForward: at(8, 'forward,'),
	airFlows: at(8, 'flows'),
	shape: at(9, 'shape'),
	angle: at(9, 'angle'),
	airMoves: at(9, 'moves,'),
	differenceInPressure: at(9, 'difference'),
	pressure: at(9, 'pressure.'),
	above: at(10, 'above'),
	lower: at(10, 'lower'),
	below: at(10, 'below'),
	upwardForce: at(11, 'upward'),
	lift: at(11, 'lift.'),
	// 5 — Newton
	anotherWay: at(12, 'another'),
	wingPushes: at(13, 'pushes'),
	hugeAmount: at(13, 'huge'),
	downward: at(13, 'downward.'),
	newton: at(14, "newton's"),
	thirdLaw: at(14, 'third'),
	pushesAirDown: at(14, 'pushes', 0),
	airPushesWingUp: at(14, 'pushes', 1),
	up: at(14, 'up.'),
	twoWays: at(15, 'two'),
	same: at(15, 'same'),
	physicalProcess: at(15, 'physical'),
	// 6 — Speed
	catch: at(16, 'catch.'),
	enoughLift: at(17, 'enough'),
	flowPast: at(17, 'flow'),
	sufficientSpeed: at(17, 'sufficient'),
	speedEnd: endOf(17, 'speed.'),
	thatsWhy: at(18, "that's"),
	accelerate: at(18, 'accelerate'),
	runway: at(18, 'runway'),
	takingOff: at(18, 'taking'),
	off: at(18, 'off.'),
	// 7 — Forces
	whatEngines: at(19, 'engines'),
	doing: at(19, 'doing?'),
	thrust: at(20, 'thrust,'),
	overcome: at(20, 'overcome'),
	airResistance: at(20, 'resistance'),
	maintainSpeed: at(20, 'maintain'),
	// 8 — Engine failure & glide
	mostSurprising: at(21, 'surprising'),
	bothEngines: at(22, 'both'),
	suddenly: at(22, 'suddenly'),
	stop: at(22, 'stop?'),
	doesItFall: at(23, 'fall?'),
	notImmediately: at(24, 'not'),
	gliding: at(25, 'gliding,'),
	altitude: at(25, 'altitude'),
	forwardSpeed: at(25, 'forward'),
	wingsContinue: at(25, 'continue'),
	glideLift: at(25, 'lift.'),
	thatsRight: at(26, "that's"),
	passengerJet: at(26, 'passenger'),
	temporarily: at(26, 'temporarily'),
	withoutPower: at(26, 'without'),
	// 9 — Finale
	nextTime: at(27, 'next'),
	overhead: at(27, 'overhead,'),
	remember: at(27, 'remember:'),
	notMagic: at(28, 'magic'),
	holdingTons: at(28, 'hundreds'),
	invisible: at(29, 'invisible'),
	invisibleAir: at(29, 'air,'),
	laws: at(29, 'laws'),
	physics: at(29, 'physics.'),
	narrationEnd: alignment.sentences[29].end,
} as const;

/** Convert a master-timeline time (s) to a frame local to the given scene. */
export const local = (id: SceneId, sec: number) => f(sec) - f(SCENES[id].start);
