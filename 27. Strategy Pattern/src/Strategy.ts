export interface Strategy {
  tax(value: number): void;
}

export class JapaneseStrategy implements Strategy {
  public tax(value: number): void {
    console.log('[Japanese tax]', value * .1, '\t//Easy Tax refund!');
  }
}

export class EuropeanStrategy implements Strategy {
  public tax(value: number): void {
    console.log('[European tax]', value * .3, '\t//Too high taxation!');
  }
}
