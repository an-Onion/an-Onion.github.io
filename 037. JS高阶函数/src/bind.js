Function.prototype.myBind = function(context, ...args) {
  let func = this;
  return function() {
    return func.call(context, ...args, ...arguments);
  }
}

function greeting() {
  return `Hello ${this.name}`;
}

let helloOnoin = greeting.myBind({name: 'Onion'});

console.log(helloOnoin());
