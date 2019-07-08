interface Context {
  value: number;
}

function  JapaneseStrategy(this: Context) {
  console.log('[Japanese tax]', this.value * .1, '\t//Easy Tax refund!');
}

function EuropeanStrategy(this: Context) {
  console.log('[European tax]', this.value * .3, '\t//Too high taxation!');
}

export const tax: {[s: string]: () => void} = {
  Japan: JapaneseStrategy,
  Europe: EuropeanStrategy,
};

const context: Context = {value: 100};
let strategy: string;

// If step into Japan
strategy = 'Japan';
tax[strategy].call(context);

// If step into Europe
strategy = 'Europe';
tax[strategy].call(context);
