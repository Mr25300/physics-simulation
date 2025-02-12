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
            const u = Math.cbrt(-q / 2 + sqrtDisc);
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

    public static solveQuartic(a: number, b: number, c: number, d: number, e: number): number[] {
        if (a === 0) return this.solveCubic(b, c, d, e);
        if (c === 0) return [0, ...this.solveCubic(a, b, c, d)]; // Factor out t making one of the solutions to t zero

        if (b === 0 && d === 0) { // Takes the form of a quadratic ax^2 + bx + c where x = t^2
            const roots: number[] = [];

            for (const root of this.solveQuadratic(a, c, e)) {
                const sqrt: number = Math.sqrt(root);

                roots.push(sqrt, -sqrt);
            }

            return roots;
        }

        b /= a;
        c /= a;
        d /= a;
        e /= a;

        const disc: number = 256*a**3*e**3 - 192*a**2*b*d*e**2 - 128*a**2*c**2*e**2 +
        144*a**2*c*d**2*e - 27*a**2*d**4 + 144*a*b**2*c*e**2 - 6*a*b**2*d**2*e - 80*a*b*c**2*d*e +
        18*a*b*c*d**3 + 16*a*c**4*e - 4*a*c**3*d**2 - 27*b**4*e**2 + 18*b**3*c*d*e - 4*b**3*d**3 -
        4*b**2*c**3*e + b**2*c**2*d**2;

        const disc0: number = c ** 2 - 3 * b * d + 12 * a * e;
        const disc1: number = 2 * c ** 3 - 9 * b * c * d + 27 * b ** 2 * e + 27 * a * d ** 2 - 72 * a * c * e;
        
        const p: number = (8 * a * c - 3 * b ** 2) / (8 * a ** 2);
        const q: number = (b ** 3 - 4 * a * b * c + 8 * a ** 2 * d) / (8 * a ** 3);

        const Q: number = Math.cbrt((disc1 + Math.sqrt(-27 * disc)) / 2);
        let S: number;

        if (disc > 0) {
            const disc21: number = disc1 ** 2;
            const disc30: number = (27 * disc + disc21) / 4;

            const P: number = Math.acos(disc1 / (2 * Math.sqrt(disc30)));

            S = Math.sqrt(-2 / 3 * p + 2 / (3 * a) * Math.sqrt(disc0) * Math.cos(P / 3));

        } else {
            S = Math.sqrt(-2 / 3 * p + 1 / (3 * a) * (Q + disc0 / Q));
        }

        const sqrtDisc: number = Math.sqrt(-4 * S ** 2 - 2 * p + q / S) / 2;

        console.log(disc, disc0, disc1, p, q, Q, S, sqrtDisc);

        const roots: number[] = [
            -b / (4 * a) - S + sqrtDisc,
            -b / (4 * a) - S - sqrtDisc,
            -b / (4 * a) + S + sqrtDisc,
            -b / (4 * a) + S - sqrtDisc,
        ];

        return roots;//.filter(root => !isNaN(root));
    }
}