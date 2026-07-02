/* 지역 데이터 — regions 테이블 기준 (depth=1 시·도, depth=2 구·군·시) */
export const REGIONS = {
  서울특별시: [
    { id: 101, name: "강남구" }, { id: 102, name: "강동구" }, { id: 103, name: "강북구" },
    { id: 104, name: "강서구" }, { id: 105, name: "관악구" }, { id: 106, name: "광진구" },
    { id: 107, name: "구로구" }, { id: 108, name: "금천구" }, { id: 109, name: "노원구" },
    { id: 110, name: "도봉구" }, { id: 111, name: "동대문구" }, { id: 112, name: "동작구" },
    { id: 113, name: "마포구" }, { id: 114, name: "서대문구" }, { id: 115, name: "서초구" },
    { id: 116, name: "성동구" }, { id: 117, name: "성북구" }, { id: 118, name: "송파구" },
    { id: 119, name: "양천구" }, { id: 120, name: "영등포구" }, { id: 121, name: "용산구" },
    { id: 122, name: "은평구" }, { id: 123, name: "종로구" }, { id: 124, name: "중구" },
    { id: 125, name: "중랑구" },
  ],
  부산광역시: [
    { id: 201, name: "강서구" }, { id: 202, name: "금정구" }, { id: 203, name: "기장군" },
    { id: 204, name: "남구" },   { id: 205, name: "동구" },   { id: 206, name: "동래구" },
    { id: 207, name: "부산진구" },{ id: 208, name: "북구" },  { id: 209, name: "사상구" },
    { id: 210, name: "사하구" }, { id: 211, name: "서구" },   { id: 212, name: "수영구" },
    { id: 213, name: "연제구" }, { id: 214, name: "영도구" }, { id: 215, name: "중구" },
    { id: 216, name: "해운대구" },
  ],
  대구광역시: [
    { id: 301, name: "남구" },   { id: 302, name: "달서구" }, { id: 303, name: "달성군" },
    { id: 304, name: "동구" },   { id: 305, name: "북구" },   { id: 306, name: "서구" },
    { id: 307, name: "수성구" }, { id: 308, name: "중구" },
  ],
  인천광역시: [
    { id: 401, name: "강화군" }, { id: 402, name: "계양구" }, { id: 403, name: "남동구" },
    { id: 404, name: "동구" },   { id: 405, name: "미추홀구" },{ id: 406, name: "부평구" },
    { id: 407, name: "서구" },   { id: 408, name: "연수구" }, { id: 409, name: "중구" },
  ],
  광주광역시: [
    { id: 501, name: "광산구" }, { id: 502, name: "남구" },   { id: 503, name: "동구" },
    { id: 504, name: "북구" },   { id: 505, name: "서구" },
  ],
  대전광역시: [
    { id: 601, name: "대덕구" }, { id: 602, name: "동구" },   { id: 603, name: "서구" },
    { id: 604, name: "유성구" }, { id: 605, name: "중구" },
  ],
  울산광역시: [
    { id: 701, name: "남구" },   { id: 702, name: "동구" },   { id: 703, name: "북구" },
    { id: 704, name: "울주군" }, { id: 705, name: "중구" },
  ],
  세종특별자치시: [
    { id: 801, name: "세종시" },
  ],
  경기도: [
    { id: 901, name: "고양시" },  { id: 902, name: "과천시" },  { id: 903, name: "광명시" },
    { id: 904, name: "광주시" },  { id: 905, name: "구리시" },  { id: 906, name: "군포시" },
    { id: 907, name: "김포시" },  { id: 908, name: "남양주시" },{ id: 909, name: "동두천시" },
    { id: 910, name: "부천시" },  { id: 911, name: "성남시" },  { id: 912, name: "수원시" },
    { id: 913, name: "시흥시" },  { id: 914, name: "안산시" },  { id: 915, name: "안성시" },
    { id: 916, name: "안양시" },  { id: 917, name: "양주시" },  { id: 918, name: "여주시" },
    { id: 919, name: "오산시" },  { id: 920, name: "용인시" },  { id: 921, name: "의왕시" },
    { id: 922, name: "의정부시" },{ id: 923, name: "이천시" },  { id: 924, name: "파주시" },
    { id: 925, name: "평택시" },  { id: 926, name: "포천시" },  { id: 927, name: "하남시" },
    { id: 928, name: "화성시" },
  ],
  강원특별자치도: [
    { id: 1001, name: "강릉시" }, { id: 1002, name: "동해시" }, { id: 1003, name: "삼척시" },
    { id: 1004, name: "속초시" }, { id: 1005, name: "원주시" }, { id: 1006, name: "춘천시" },
  ],
  충청북도: [
    { id: 1101, name: "청주시" }, { id: 1102, name: "충주시" }, { id: 1103, name: "제천시" },
  ],
  충청남도: [
    { id: 1201, name: "천안시" }, { id: 1202, name: "공주시" }, { id: 1203, name: "보령시" },
    { id: 1204, name: "아산시" }, { id: 1205, name: "서산시" },
  ],
  전라북도: [
    { id: 1301, name: "전주시" }, { id: 1302, name: "군산시" }, { id: 1303, name: "익산시" },
  ],
  전라남도: [
    { id: 1401, name: "목포시" }, { id: 1402, name: "여수시" }, { id: 1403, name: "순천시" },
  ],
  경상북도: [
    { id: 1501, name: "포항시" }, { id: 1502, name: "경주시" }, { id: 1503, name: "구미시" },
    { id: 1504, name: "안동시" },
  ],
  경상남도: [
    { id: 1601, name: "창원시" }, { id: 1602, name: "진주시" }, { id: 1603, name: "통영시" },
    { id: 1604, name: "거제시" },
  ],
  제주특별자치도: [
    { id: 1701, name: "제주시" }, { id: 1702, name: "서귀포시" },
  ],
};

/* 전체 구·군·시 배열 (id로 빠르게 찾기용) */
const ALL_SUBS = Object.values(REGIONS).flat();

/** regionId로 { parent, sub } 반환 */
export function findRegionById(regionId) {
  for (const [parent, subs] of Object.entries(REGIONS)) {
    const sub = subs.find((r) => r.id === regionId);
    if (sub) return { parent, sub };
  }
  return null;
}

/** regionId로 sub 항목만 반환 */
export function findSubById(regionId) {
  return ALL_SUBS.find((r) => r.id === regionId) ?? null;
}
