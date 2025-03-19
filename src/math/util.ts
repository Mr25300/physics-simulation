export class Util {
  public static clamp(n: number, min: number, max: number): number {
    return Math.min(Math.max(n, min), max);
  }

  public static sign(n: number): number {
    if (n > 0) return 1;
    else if (n < 0) return -1;
    else return 0;
  }

  public static formatSigFigs(n: number, sigFigs: number): string {
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

  public static formatTime(t: number): string {
    let backwards: boolean = false;

    if (t < 0) {
      backwards = true;
      t = -t;
    }

    const timeUnits: string[] = [
      Math.floor(t / 3600).toFixed(0).padStart(2, "0"), // hours
      (Math.floor(t / 60) % 60).toFixed(0).padStart(2, "0"), // minutes
      Math.floor(t % 60).toFixed(0).padStart(2, "0"), // seconds
      Math.floor((t % 1) * 1000).toFixed(0).padStart(3, "0") // milliseconds
    ];

    let timeString: string = "";

    for (let i = 0; i < 4; i++) {
      if (i > 0) timeString += ":";
      timeString += timeUnits[i];
    }

    return (backwards ? "-" : "+") + timeString;
  }
}