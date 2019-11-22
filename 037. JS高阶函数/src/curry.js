function curry(fn) {
  const arity = fn.length;

  return function $curry(...args) {
    if( args.length < arity ) {
      return $curry.bind(null, ...args);
    }
    return fn.apply(null, args);
  }
}

function add(a, b) {
  return a+b;
}

const curryingAdd = curry(add);
const addTen = curryingAdd(10)
console.log(addTen(1));
