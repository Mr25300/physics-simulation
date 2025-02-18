export class Util {
    public static clamp(n: number, min: number, max: number): number {
        return Math.min(Math.max(n, min), max);
    }

    public static sign(n: number): number {
        if (n > 0) return 1;
        else if (n < 0) return -1;
        else return 0;
    }
}