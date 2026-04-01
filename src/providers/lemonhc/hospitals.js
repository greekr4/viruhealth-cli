// 알려진 병원 목록 (lemonhc/mcare 플랫폼)
// 출처: group 페이지 서버사이드 렌더링 데이터 리버싱
const HOSPITALS = [
  // paik 그룹 (인제대학교 백병원)
  {
    hospitalCd: '21100063',
    hospitalNm: '인제대학교 부산백병원',
    groupCd: 'paik',
    prefix: 'paik_bus',
    address: '부산광역시 부산진구 복지로 75',
    telno: '051-890-6114',
    apiUrl: 'https://qab.paik.ac.kr/qapi-busan',
  },
  {
    hospitalCd: '11100818',
    hospitalNm: '인제대학교 상계백병원',
    groupCd: 'paik',
    prefix: 'paik_san',
    address: '서울시 노원구 동일로 1342',
    telno: '1661-3100',
    apiUrl: 'https://qab.paik.ac.kr/qapi-sanggye',
  },
  {
    hospitalCd: '31100651',
    hospitalNm: '인제대학교 일산백병원',
    groupCd: 'paik',
    prefix: 'paik_ils',
    address: '경기도 고양시 일산서구 주화로 170',
    telno: '031-910-7114',
    apiUrl: 'https://qab.paik.ac.kr/qapi-ilsan',
  },
  {
    hospitalCd: '21100608',
    hospitalNm: '인제대학교 해운대백병원',
    groupCd: 'paik',
    prefix: 'paik_hae',
    address: '부산광역시 해운대구 해운대로 875',
    telno: '051-797-0100',
    apiUrl: 'https://qab.paik.ac.kr/qapi-haeundae',
  },
];

function findHospital(hospitalCd) {
  return HOSPITALS.find((h) => h.hospitalCd === hospitalCd) || null;
}

function listHospitals(groupCd) {
  if (groupCd) return HOSPITALS.filter((h) => h.groupCd === groupCd);
  return HOSPITALS;
}

module.exports = { HOSPITALS, findHospital, listHospitals };
