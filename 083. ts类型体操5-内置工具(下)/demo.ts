const pro = Promise.resolve(1);

type MyAwaited<T> = T extends PromiseLike<infer V> // `await` only unwraps object types with a callable `then`. Non-object types are not unwrapped
        ? MyAwaited<V> // recursively unwrap the value
        : T; // non-object or non-thenable


type T0 = MyAwaited<Promise<string>>; // string
type T1 = MyAwaited<Promise<Promise<number>>>; // number
type T2 = MyAwaited<boolean | Promise<number>>; // number | boolean

type A = [number, string]
type B = [number, string]
type C = A extends B ? A : B
type D = NoInfer<C>