import {Context} from './Context';
import {EuropeanStrategy, JapaneseStrategy} from './Strategy';

const context: Context = new Context(100);

context.setStrategy(new JapaneseStrategy());
context.execute();

context.setStrategy(new EuropeanStrategy());
context.execute();
