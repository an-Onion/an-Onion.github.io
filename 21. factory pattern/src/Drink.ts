export interface Drink {
  taste(): void;
}

export class Wine implements Drink {
  public taste(): void {
      console.log('Wine');
  }
}

export class Beer implements Drink {
  public taste(): void {
      console.log('Beer');
  }
}
