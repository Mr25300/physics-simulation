export class Util {
  public static clamp(n: number, min: number, max: number): number {
    return Math.min(Math.max(n, min), max);
  }

  public static sign(n: number): number {
    if (n > 0) return 1;
    else if (n < 0) return -1;
    else return 0;
  }

  public static numberSigFigs(n: number, sigFigs: number): string {
    let sign: string = "";

    if (n < 0) {
      sign = "-";
      n = -n;
    }

    const digChange: number = n === 0 ? 0 : Math.floor(Math.log10(n));
    const divisorExpo: number = digChange - sigFigs + 1;
    const divisor: number = Math.pow(10, divisorExpo);
    const rounded: number = Math.round(n / divisor) * divisor;

    if (digChange > sigFigs + 1 || digChange <= -2) {
      const digitsForm: number = rounded / Math.pow(10, digChange);

      return sign + digitsForm.toFixed(sigFigs - 1) + "e" + digChange;

    } else {
      const decimalPlaces: number = Math.max(sigFigs - digChange - 1, 0);

      return sign + rounded.toFixed(decimalPlaces);
    }
  }
}