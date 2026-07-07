// 작업 완료 보고서의 진단 결과(diagnosisResult) → 실적 목록 화면 표시용 라벨/배지 타입 매핑
// Engineersettlementpage.jsx와 EngineerPerformanceAllModal.jsx가 공유
export const DIAGNOSIS_MAP = {
  NORMAL:        { label: "정상 완료", type: "done"    },
  REPAIRED:      { label: "정상 완료", type: "done"    },
  PART_REPLACED: { label: "부분 해결", type: "partial" },
  UNREPAIRABLE:  { label: "제방문",   type: "revisit" },
};
