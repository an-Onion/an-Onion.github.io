type demo = {
  Onion: string;
  Garlic: number;
};

type partial<T> = {
  [P in keyof T]?: T[P];
};

type pd = partial<demo>;

type K = keyof any;
