type demo = {
  Onion: string;
  Garlic: number;
};

type partial = Partial<demo>;

type k = keyof any;