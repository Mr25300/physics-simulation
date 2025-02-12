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

        b /= a;
        c /= a;
        d /= a;
        e /= a;

        const p: number = c - (3 * b * b) / 8;
        const q: number = e - (b * c) / 2 + (b * b * b) / 8;
        const r: number = e - (b * d) / 4 + (b * b * c) / 16 - (3 * b ** 4) / 256;

        const cubicRoots: number[] = this.solveCubic(1, -p / 2, -r, (p * r - q * q / 4) / 2);
        if (cubicRoots.length === 0) return [];

        const y: number = cubicRoots.find(root => root >= 0) ?? cubicRoots[0];
        const w: number = Math.sqrt(y);

        const quad1: number[] = this.solveQuadratic(1, w, y - q / (2 * w));
        const quad2: number[] = this.solveQuadratic(1, -w, y + q / (2 * w));

        return [...quad1, ...quad2].map(t => t - b / 4);
    }
}