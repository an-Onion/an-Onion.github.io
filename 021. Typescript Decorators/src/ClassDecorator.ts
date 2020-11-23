
type ConstructorType = new(name: string) => Onion;

function overrideName(constructor: ConstructorType) {
  return class extends constructor {
    public name = 'override';
  };
}

function colorDecorator(color: string) {
  return (constructor: ConstructorType ) =>
    (class extends constructor {
      public color: string = color;
    });
}

@overrideName
@colorDecorator('red')
class Onion {
  public name: string;
  constructor(name: string) {
    this.name = name;
  }
}

const greeter: Onion = new Onion('Onion');

console.log(greeter.name);
console.log(greeter);
