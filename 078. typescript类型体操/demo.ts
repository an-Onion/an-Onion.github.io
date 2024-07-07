type HelloWorld = string

const a = 'hello';
const b: HelloWorld = a;
const c: string = b;

type Person = Record<'name' | 'age', string>

const personA: Person = { // 
  name: 'Tom',
  age: '18'
};

const personB: Person = { //
  name: 'Tom',
};