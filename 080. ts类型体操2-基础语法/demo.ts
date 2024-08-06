type Add<A extends unknown[], B extends unknown[]> = [...A, ...B]['length']

type Test = Add<[1, 2, 3], [4, 5, 6]> // 6

type Tuple = [1,2]


type PT = Tuple[0]

type addOne<T extends number, R extends unknown[] = []> = R['length'] extends T 
    ? [...R, unknown]['length']
    : addOne<T, [...R, unknown]>

type Test2 = addOne<5> // 6


type Last<T extends any[]> = T extends [...infer R, infer L] ? L : never

type Test3 = Last<[1, 2, 3]> // 3