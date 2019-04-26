import {Beer, Drink, Wine} from './Drink';
import {Garlic, Onion, Vegetable} from './Vegetable';

export interface RecipeFactory {
  create(): Vegetable;
  pick(): Drink;
}

export class OnionRecipeFacotry implements RecipeFactory {
  public create(): Vegetable {
    return new Onion();
  }

  public pick(): Drink {
    return new Wine();
  }
}

export class GarlicRecipeFacotry implements RecipeFactory {
  public create(): Vegetable {
    return new Garlic();
  }

  public pick(): Drink {
    return new Beer();
  }
}
