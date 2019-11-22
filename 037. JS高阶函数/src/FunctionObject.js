function greeting(name) {
  return `Hello ${name}`;
}

console.log( greeting('Onion') );
console.log(greeting.length, greeting.name);


greeting.displayName = 'Garlic';
greeting.innerName = () => 'Ginger';
console.log(greeting.displayName)
console.log(greeting.innerName())
