function User(name) {
  this.name = name;
  return {
    id: 1,
  };
}

let user = new User('Onion');

console.log(user);

class Hello {
  constructor(name){
    this.name = name;
  }
}


const hello = new Hello('Onion');

console.log(hello);

function anOnion(name) {
  console.log(new.target);
  this.name = name;
  this.sayHi = function() {
    return `My name is ${this.name}`;
  };
}

anOnion.prototype.say = function() {
  return `My name is ${this.name}`;
};

const onion = new anOnion('Onion');
console.log( onion.say() );
const garlic = new anOnion('Garlic');

console.log(onion.say === garlic.say);
console.log(onion.sayHi === garlic.sayHi);
