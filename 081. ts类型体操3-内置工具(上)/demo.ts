type demo = {
  Onion: string;
  Garlic: number;
};

type partial<T> = {
  [P in keyof T]?: T[P];
};

type pd = Partial<demo>;

type K = keyof any;

type C = Exclude<'a' | 'b',  'a' | 'c'> // 'b'
