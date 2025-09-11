export type AdvFilters = {
  floors: string[]; // ["1층","1.5층","2층","3층","4층","복층","테라스"]
  deposit?: string; // 실입주금
  area17: "any" | "lte17" | "gte17";
  categories: string[]; // ["주택","APT","OP","도/생","근/생"]
  elevator: "any" | "yes" | "no";
  priceMin?: string;
  priceMax?: string;
};
