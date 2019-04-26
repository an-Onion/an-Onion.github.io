export interface Vegetable {
  fry(): void;
}

export class Onion implements Vegetable {
  public fry(): void {
      console.log('Onion');
  }
}

export class Garlic implements Vegetable {
  public fry(): void {
      console.log('Garlic');
  }
}
