type Function = (x: number) => number;

export class Util {
    public static solveQuadratic(a: number, b: number, c: number): number[] {
        const discriminant: number = b * b - 4 * a * c;
        if (discriminant < 0) return [];

        const sqrtDisc: number = Math.sqrt(discriminant);
        const doubleA: number = 2 * a;

        return [
            (-b + sqrtDisc) / doubleA,
            (-b - sqrtDisc) / doubleA
        ];
    }

    public static solveCubic(a: number, b: number, c: number, d: number): number[] {
        if (a === 0) return this.solveQuadratic(b, c, d);

        b /= a;
        c /= a;
        d /= a;

        const p: number = (3 * c - b * b) / 3;
        const q: number = (2 * b * b * b - 9 * b * c + 27 * d) / 27;
        const discriminant: number = (q * q / 4) + (p * p * p / 27);

        if (discriminant > 0) {
            const sqrtDisc: number = Math.sqrt(discriminant);
            const u: number = Math.cbrt(-q / 2 + sqrtDisc);
            const v: number = Math.cbrt(-q / 2 - sqrtDisc);

            return [u + v - b / 3];

        } else if (discriminant === 0) {
            const u: number = Math.cbrt(-q / 2);

            return [2 * u - b / 3, -u - b / 3];

        } else {
            const r: number = Math.sqrt(-p * p * p / 27);
            const theta: number = Math.acos(-q / (2 * r));
            const m: number = 2 * Math.cbrt(r);

            return [
                m * Math.cos(theta / 3) - b / 3,
                m * Math.cos((theta + 2 * Math.PI) / 3) - b / 3,
                m * Math.cos((theta + 4 * Math.PI) / 3) - b / 3
            ];
        }
    }

    private static brentsMethod(f: Function, df: Function, a: number, b: number): number | undefined {
        let fa: number = f(a);
        let fb: number = f(b);

        if (fa * fb > 0) return undefined;

        let c = a;
        let fc = fa;
        let d = b - a;
        let e = d;

        for (let i = 0; i < 20; i++) {
            if (Math.abs(fc) < Math.abs(fb)) {
                [a, b] = [b, a];
                [fa, fb] = [fb, fa];
            }

            const tol: number = 2 * 1e-8 * Math.abs(b) + 1e-8;
            const m: number = 0.5 * (a - b);

            if (Math.abs(m) <= tol || fb === 0) return b;

            if (Math.abs(e) >= tol && Math.abs(fa) > Math.abs(fb)) {
                const s: number = fb / fa;
                let p: number;
                let q: number;

                if (a === c) {
                    p = 2 * m * s;
                    q = 1 - s;

                } else {
                    q = fa / fc;

                    const r: number = fb / fc;
                    p = s * (2 * m * q * (q - r) - (b - c) * (r - 1));
                    q = (q - 1) * (r - 1) * (s - 1);
                }

                if (p > 0) q = -q;
                p = Math.abs(p);

                if (2 * p < Math.min(3 * m * q - Math.abs(tol * q), Math.abs(e * q))) {
                    e = d;
                    d = p / q;

                } else {
                    d = m;
                    e = d;
                }

            } else {
                d = m;
                e = d;
            }

            c = b;
            fc = fb;

            if (Math.abs(d) > tol) b += d;
            else b += Math.sign(m) * tol;

            fb = f(b);
        }
    }

    private static newtonRaphson(f: Function, df: Function, x: number): number | undefined {
        for (let i = 0; i < 100; i++) {
            const y: number = f(x);
            if (Math.abs(y) < 1e-4) return x;

            const dy: number = df(x);
            if (Math.abs(dy) < 1e-8) break;

            x -= y / dy;
        }
    }

    public static solveQuartic(a: number, b: number, c: number, d: number, e: number): number[] {
        if (a === 0) return this.solveCubic(b, c, d, e);
        if (c === 0) return [0, ...this.solveCubic(a, b, c, d)]; // Factor out t making one of the solutions to t zero

        if (b === 0 && d === 0) { // Takes the form of a quadratic ax^2 + bx + c where x = t^2
            const roots: number[] = [];

            for (const root of this.solveQuadratic(a, c, e)) {
                const sqrt: number = Math.sqrt(root);
                if (!isNaN(sqrt)) roots.push(sqrt, -sqrt);
            }

            return roots;
        }

        const roots: number[] = [];

        const dA: number = 4 * a;
        const dB: number = 3 * b;
        const dC: number = 2 * c;
        const dD: number = d;

        const f: Function = (x: number) => {
            return a * x ** 4 + b * x ** 3 + c * x ** 2 + d * x + e;
        }

        const df: Function = (x: number) => {
            return dA * x ** 3 + dB * x ** 2 + 2 * dC * x + dD;
        }

        for (let x: number = -100; x <= 100; x += 0.01) {
            const nextX: number = x + 0.01;

            if (f(x) * f(nextX) < 0) {
                const root: number | undefined = this.newtonRaphson(f, df, x);

                if (root !== undefined) roots.push(root);
            }
        }

        const turningPoints: number[] = this.solveCubic(dA, dB, dC, dD);
        const turningZeros: number[] = turningPoints.filter(x => Math.abs(f(x)) < 1e-8);

        return [...roots, ...turningZeros];

        // b /= a;
        // c /= a;
        // d /= a;
        // e /= a;

        // // x = y - b / 4a
        // const b4a: number = b / (4 * a);
        // const p: number = (12 * a * b4a ** 2 + 6 * b * b4a + 2 * c) / 2; // f''(b / 4a) / 2
        // const q: number = 4 * a * b4a ** 3 + 3 * b * b4a ** 2 + 2 * c * b4a + d; // f'(b / 4a)
        // const r: number = a * b4a ** 4 + b * b4a ** 3 + c * b4a ** 2 + d * b4a + e; // f(b / 4a)

        // const lambaCubicRoots: number[] = this.solveCubic(
        //     -8,
        //     -20 * p,
        //     8 * r - 16 * p ** 2,
        //     4 * p * r + q ** 2 - 4 * p ** 3
        // );

        // const L: number = lambaCubicRoots[0]; // lambda solution

        // // (y^2 + p + L)^2 = (root(p + 2L)y - q / 2root(p + 2L))^2
        // // y^2 + p + L = +-(root(p + 2L)y - q / 2root(p + 2L))
        // // ONE: y^2 + p + L = root(p + 2L)y - q / 2root(p + 2L)
        // // TWO: y^2 + p + L = -root(p + 2L)y + q / 2root(p + 2L)
        // // Final: y^2 -+ root(p + 2L)y + (p + L +- q / 2root(p + 2L))
        // // y^2 -+ Ay + (pL +- B) = 0
        // // const sqrtP2L: number = Math.sqrt(p + 2 * L);
        // const A: number = Math.sqrt(p + 2 * L);
        // const B: number = Math.sqrt(q / (2 * Math.sqrt(p + 2 * L)));
        // const pL: number = p + L;

        // console.log(A, B, pL);

        // const solutions: number[] = [
        //     ...this.solveQuadratic(1, -A, pL + B),
        //     ...this.solveQuadratic(1, A, pL - B)
        // ];

        // console.log(this.solveQuadratic(1, -A, pL + B));

        // solutions.map(root => root - b4a);

        // return solutions;
    }
}