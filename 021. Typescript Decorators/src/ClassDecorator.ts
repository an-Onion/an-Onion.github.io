
type ConstructorTpye = new(name: string) => Onion;

function overrideName(constructor: ConstructorTpye) {
  return class extends constructor {
    public name: string = 'override';
  };
}

function colorDecorator(color: string) {
  return (constructor: ConstructorTpye ) =>
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
