type demo = {
  Onion: string;
  Garlic: number;
};

type partial<T> = {
  [P in keyof T]?: T[P];
};

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
  ? true
  : false

type pd = Partial<demo>;

type K = keyof any;

type C = NonNullable<undefined>;
type D = string extends undefined  ? true : false;
type E = (undefined | null) & {};

type F = NonNullable<any>

type T1 = Parameters<(s: string, n: number) => void>;
type a = Equal<T1, [string, number]>; // true 

type ParametersAndReturnType<T extends (...args: any) => any> = T extends (...args: infer P) => infer R ? {parameters: P, return: R} : any;

type T2 = ParametersAndReturnType<(a: string) => number>



abstract class Example  {
  constructor(public x: number, public y: string) {

  }
}

type TC = typeof Example

type T3 = TC extends abstract new (...args: infer P) => any ? P : never // Result: [number, string]

type T4 = (new (...args: any) => any) extends (abstract new (...args: any) => any) ? true : false 

type T5 = (abstract new (...args: any) => any) extends (new (...args: any) => any) ? true : false 

// Extracting parameters
type Params = ConstructorParameters<TC>; // Result: [number, string]

function foo(this: string, bar: number) {
  return this + bar;
}

type Foo = typeof foo; // Result: number

function numberToString(n: Foo) {
  return foo.apply(n, 5);
}

type T7 = ThisParameterType<typeof foo>; // Result: number
type th = (this: any, ...args: any) => any 
type fn = (...args: any) => any

type T8 = th extends fn  ? true : false

type MyOmitThisParameter<T> = T extends (...args: infer A) => any ? A : T;

type T9 = MyOmitThisParameter<Foo>; // Result: number

type omitThis = OmitThisParameter<(this: number, n: number) => void>