/**
 * Physically based 2D airflow around a cambered airfoil.
 *
 * Potential flow past a cylinder with circulation, conformally mapped to a
 * Joukowski airfoil (z = ζ + 1/ζ). Circulation is fixed by the Kutta
 * condition (flow leaves the sharp trailing edge smoothly). This gives the
 * real features of lift: faster flow and lower pressure over the top,
 * upwash ahead of the wing, downwash behind it, and no "equal transit time".
 *
 * All computation is deterministic and done once at module load.
 */

type C = {re: number; im: number};
const c = (re: number, im = 0): C => ({re, im});
const add = (a: C, b: C): C => c(a.re + b.re, a.im + b.im);
const sub = (a: C, b: C): C => c(a.re - b.re, a.im - b.im);
const mul = (a: C, b: C): C => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const div = (a: C, b: C): C => {
	const d = b.re * b.re + b.im * b.im;
	return c((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};
const abs = (a: C) => Math.hypot(a.re, a.im);
const expi = (t: number): C => c(Math.cos(t), Math.sin(t));
const csqrt = (a: C): C => {
	const r = abs(a);
	const re = Math.sqrt((r + a.re) / 2);
	const im = Math.sign(a.im || 1) * Math.sqrt(Math.max(0, (r - a.re) / 2));
	return c(re, im);
};

export type FlowModel = {
	alphaDeg: number;
	/** Airfoil outline in flow coordinates (freestream along +x, y up). */
	outline: [number, number][];
	/** Velocity (u, v) at a point in flow coordinates. null if inside the airfoil. */
	velocity: (x: number, y: number) => [number, number] | null;
	/** Pressure coefficient Cp = 1 - (|V|/V∞)². null inside the airfoil. */
	cp: (x: number, y: number) => number | null;
	/** Streamlines traced by time integration: uniform time samples. */
	streamlines: Streamline[];
	dt: number;
	liftCoefficient: number;
};

export type Streamline = {
	seedY: number;
	/** Positions at uniform time steps (flow coordinates). */
	pts: [number, number][];
};

const MU = c(-0.085, 0.075); // circle centre → thickness (re) and camber (im)
const R = abs(sub(c(1), MU));

const buildModel = (alphaDeg: number, seedYs: number[]): FlowModel => {
	const alpha = (alphaDeg * Math.PI) / 180;
	const V = 1;
	const eMinus = expi(-alpha);
	const ePlus = expi(alpha);
	const R2 = c(R * R);
	// Kutta condition: W(ζ=1) = 0  →  Γ = 2π i d · V(e^{-iα} − R² e^{iα}/d²)
	const d = sub(c(1), MU);
	const A = sub(eMinus, div(mul(R2, ePlus), mul(d, d)));
	const gamma = mul(mul(c(0, 2 * Math.PI), d), A).re;

	const Wzeta = (z: C): C => {
		const s = sub(z, MU);
		return add(sub(eMinus, div(mul(R2, ePlus), mul(s, s))), div(c(0, gamma / (2 * Math.PI)), s));
	};
	const Jp = (z: C): C => sub(c(1), div(c(1), mul(z, z)));
	const J = (z: C): C => add(z, div(c(1), z));
	// The flow is computed with the freestream at angle α to the chord.
	// We rotate everything by −α so the freestream is horizontal on screen.
	const rot = expi(-alpha);
	const rotInv = expi(alpha);

	const toZeta = (zPlane: C): C | null => {
		const disc = csqrt(sub(mul(zPlane, zPlane), c(4)));
		const r1 = div(add(zPlane, disc), c(2));
		const r2 = div(sub(zPlane, disc), c(2));
		const o1 = abs(sub(r1, MU)) >= R;
		const o2 = abs(sub(r2, MU)) >= R;
		if (o1 && o2) return abs(r1) > abs(r2) ? r1 : r2;
		if (o1) return r1;
		if (o2) return r2;
		return null;
	};

	const velocity = (x: number, y: number): [number, number] | null => {
		const zPlane = mul(c(x, y), rotInv);
		const zeta = toZeta(zPlane);
		if (!zeta) return null;
		const w = div(Wzeta(zeta), Jp(zeta)); // u − iv in airfoil frame
		const vel = mul(c(w.re, -w.im), rot); // rotate to screen frame
		return [vel.re, vel.im];
	};

	const cp = (x: number, y: number) => {
		const v = velocity(x, y);
		if (!v) return null;
		return 1 - (v[0] * v[0] + v[1] * v[1]) / (V * V);
	};

	const outline: [number, number][] = [];
	for (let i = 0; i <= 180; i++) {
		const t = (i / 180) * Math.PI * 2;
		const zeta = add(MU, c(R * Math.cos(t), R * Math.sin(t)));
		const p = mul(J(zeta), rot);
		outline.push([p.re, p.im]);
	}

	// Integrate particle paths in the ζ-plane: dζ/dt = conj(w_z) / J'(ζ).
	const dt = 0.02;
	const fZeta = (zeta: C): C => {
		const jp = Jp(zeta);
		const w = div(Wzeta(zeta), jp);
		return div(c(w.re, -w.im), jp);
	};
	const streamlines: Streamline[] = seedYs.map((seedY) => {
		const start = mul(c(-7.5, seedY), rotInv);
		let zeta = toZeta(start) as C;
		const pts: [number, number][] = [];
		for (let i = 0; i < 1400; i++) {
			const p = mul(J(zeta), rot);
			pts.push([p.re, p.im]);
			if (p.re > 7.5) break;
			const k1 = fZeta(zeta);
			const k2 = fZeta(add(zeta, mul(k1, c(dt / 2))));
			const k3 = fZeta(add(zeta, mul(k2, c(dt / 2))));
			const k4 = fZeta(add(zeta, mul(k3, c(dt))));
			zeta = add(zeta, mul(add(add(k1, mul(k2, c(2))), add(mul(k3, c(2)), k4)), c(dt / 6)));
		}
		return {seedY, pts};
	});

	// Kutta–Joukowski: L' = ρ V Γ ; chord ≈ 4 → C_L = 2|Γ| / (V·chord)
	const liftCoefficient = (2 * Math.abs(gamma)) / 4;
	return {alphaDeg, outline, velocity, cp, streamlines, dt, liftCoefficient};
};

const seeds = (() => {
	const ys: number[] = [];
	for (let i = -13; i <= 13; i++) {
		const t = i / 13;
		ys.push(Math.sign(t) * Math.pow(Math.abs(t), 1.35) * 3.4 + 0.18);
	}
	return ys;
})();

export const FLOW = buildModel(7, seeds);

/** Position along a streamline at time τ (in flow time units), linearly interpolated. */
export const pointAt = (s: Streamline, tau: number, dt = FLOW.dt): [number, number] => {
	const f = tau / dt;
	const i = Math.max(0, Math.min(s.pts.length - 2, Math.floor(f)));
	const k = Math.min(1, Math.max(0, f - i));
	const a = s.pts[i];
	const b = s.pts[i + 1];
	return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
};

export const pathDuration = (s: Streamline, dt = FLOW.dt) => (s.pts.length - 1) * dt;
