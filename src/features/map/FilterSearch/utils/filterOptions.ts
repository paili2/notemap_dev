export const FILTER_OPTIONS = {
  rooms: ["1룸", "1.5룸", "2룸", "3룸", "4룸", "복층", "테라스"],
  area: ["17평 이하", "17평 이상"],
  buildingType: ["주택", "APT", "OP", "도/생", "근/생"],
  elevator: ["있음", "없음"],
} as const;

export const initialFilterState = {
  rooms: [],
  deposit: "",
  area: "",
  buildingType: [],
  elevator: "",
  priceMin: "",
  priceMax: "",
};
