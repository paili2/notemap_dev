/** 🔍 키워드가 너무 광범위(울산, 포항, 서울 강서구 발산동 등)한지 판별 */
const BROAD_REGIONS = new Set([
  // 광역시
  "서울",
  "서울특별시",
  "부산",
  "부산광역시",
  "대구",
  "대구광역시",
  "인천",
  "인천광역시",
  "광주",
  "광주광역시",
  "대전",
  "대전광역시",
  "울산",
  "울산광역시",
  "세종",
  "세종특별자치시",

  // 도
  "경기",
  "경기도",
  "강원",
  "강원도",
  "충북",
  "충청북도",
  "충남",
  "충청남도",
  "전북",
  "전라북도",
  "전남",
  "전라남도",
  "경북",
  "경상북도",
  "경남",
  "경상남도",
  "제주",
  "제주특별자치도",

  // 국가 단위
  "대한민국",
  "한국",
  "코리아",
]);

// "정확한 주소"가 아닌 경우에도 허용할 시설/기관/교통 키워드
const FACILITY_TOKEN_REGEX =
  /(역|병원|의원|약국|마트|백화점|타워|센터|아파트|빌라|오피스텔|대학|대학교|고등학교|중학교|초등학교|시청|구청|군청|청사|카페|편의점|호텔|모텔)/;

// "동 주소" 패턴: 시/구/군 + 동/읍/면/리로 끝나는 주소(숫자/시설토큰 없이)
function looksLikeDongLevelAddress(keyword: string): boolean {
  const hasCityGuGun = /시|구|군/.test(keyword);
  // '발산동 ' / '발산동' / '발산리 ' / '발산리' 등
  const hasDongEnding = /(동|읍|면|리)(\s|$)/.test(keyword);
  return hasCityGuGun && hasDongEnding;
}

export function isTooBroadKeyword(raw: string): boolean {
  const keyword = raw.trim();
  if (!keyword) return true;

  // 공백 제거 (예: '울산 광역시' → '울산광역시')
  const normalized = keyword.replace(/\s+/g, "");

  // 1) 시/도/국가 단위 이름과 완전 일치 → 무조건 광역
  if (BROAD_REGIONS.has(normalized)) return true;

  // 2) '울산시', '서울시' 처럼 뒤에 '시'만 붙은 케이스도 광역 처리
  const stripped = normalized.replace(/시$/, "");
  if (BROAD_REGIONS.has(stripped)) return true;

  // 3) 한 글자/두 글자 짧은 검색어는 대부분 모호하니 컷
  //    예: "울산", "포항", "강남", "당진" 등
  //    (단, 2글자 아파트 브랜드명 같은 건 어쩔 수 없이 같이 막히는데,
  //     보통은 '목동자이', '래미안강남힐즈'처럼 더 길게 쓰는 케이스가 많다고 보고 감수)
  if (keyword.length <= 2) return true;

  // 4) 숫자(번지/건물 번호)가 있으면 "정확한 주소 후보"로 보고 허용
  //    예: "서울 강서구 발산동 123-45", "목동 123"
  const hasNumber = /\d/.test(keyword);
  if (hasNumber) return false;

  // 5) 시설/기관/교통 키워드가 있으면 키워드 검색 허용
  //    예: "울산시청", "강남병원", "강남역", "목동자이아파트"
  const hasFacilityToken = FACILITY_TOKEN_REGEX.test(keyword);
  if (hasFacilityToken) return false;

  // 6) 시/구/군 + 동/읍/면/리까지만 있는 "동 주소"면 광역으로 간주하고 막기
  //    예: "서울 강서구 발산동", "서울 강서구 목동", "수원 장안구 율전동"
  if (looksLikeDongLevelAddress(keyword)) return true;

  // 7) 그 외는 키워드(단지명/건물이름 등)로 보고 허용
  //    예: "래미안강남힐즈", "목동자이", "해운대두산위브더제니스"
  return false;
}
