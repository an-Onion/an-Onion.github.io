
import {Garlic, Onion, Vegetable} from './Vegetable';

export interface VegetablePicker {
  pick(): Vegetable;
}

export class OnionPicker implements VegetablePicker {
  public pick(): Vegetable {
    return new Onion();
  }
}

export class GarlicPicker implements VegetablePicker {
  public pick(): Vegetable {
    return new Garlic();
  }
}
