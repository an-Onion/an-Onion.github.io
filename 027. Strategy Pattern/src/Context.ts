import {Strategy} from './Strategy';

export class Context {
  private strategy: Strategy;
  private value: number;

  constructor(value: number) {
    this.value = value;
  }

  public setStrategy(strategy: Strategy) {
    this.strategy =  strategy;
  }

  public execute() {
    this.strategy.tax(this.value);
  }
}
