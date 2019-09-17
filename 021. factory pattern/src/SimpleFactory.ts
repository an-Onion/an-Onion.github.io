
import {Garlic, Onion, Vegetable} from './Vegetable';

export class VegetableFactory {
  public createOnion(): Vegetable {
    return new Onion();
  }

  public createGarlic(): Vegetable {
    return new Garlic();
  }
}
