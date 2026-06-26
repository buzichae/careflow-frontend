import { useState } from "react";
import {
  GraduationCap, CheckCircle, Clock, ChevronRight, X, BookOpen,
} from "lucide-react";
import "../../styles/Engineer/Engineerlmspage.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/engineer/lms
// lms_contents WHERE category_id = 로그인기사.category_id
//              AND required_level IN (로그인기사.skill_level, 'ALL')
//              AND is_active = 1
// + lms_confirmations WHERE user_id = 로그인기사 AND completion_year = 올해 LEFT JOIN
//
// POST /api/engineer/lms/{contentId}/confirm
// → lms_confirmations INSERT (user_id, content_id, completion_year, confirmed_version, confirmed_at)
// → 전체 이수 시 백엔드에서 engineer_profiles.is_lms_completed = 1 자동 갱신
//
// DB 필드:
//   lms_contents.content_id, title, body, required_level, content_type, version, is_active
//   lms_contents.category_id → appliance_categories.name
//   lms_confirmations.confirmed_at, confirmed_version, completion_year
//
// ⚠ 매년 1월 1일 Quartz 스케줄러로 is_lms_completed=0 초기화
//   → 프론트는 completion_year=올해 기준으로 이수 여부 판단
// ──────────────────────────────────────────

const COMPLETION_YEAR = 2024;

// 로그인 기사 정보 (더미)
const engineerInfo = {
  name: "김철수",
  skillLevel: "ADVANCED",      // engineer_profiles.skill_level
  categoryName: "냉장고",       // appliance_categories.name via category_id
  isLmsCompleted: false,        // engineer_profiles.is_lms_completed
};

// lms_contents 더미 - category_id + required_level 조합으로 필터링된 결과
// required_level: 기사의 skill_level 또는 'ALL'
const lmsContents = [
  {
    contentId: 1,
    title: "냉장고 냉각 시스템 원리 및 진단",
    body: `# 냉장고 냉각 시스템 원리 및 진단

## 1. 냉각 사이클 개요
냉장고는 압축기(Compressor), 응축기(Condenser), 팽창 밸브(Expansion Valve), 증발기(Evaporator)로 구성된 냉각 사이클을 통해 냉기를 생성합니다.

## 2. 주요 부품별 역할
- **압축기**: 냉매를 고압으로 압축하여 순환시킵니다.
- **응축기**: 고압 냉매를 냉각하여 액체로 변환합니다.
- **팽창 밸브**: 냉매 압력을 낮춰 급격한 온도 저하를 유발합니다.
- **증발기**: 저압 냉매가 기화하며 주변 열을 흡수합니다.

## 3. 고장 진단 포인트
- 냉각 불량 → 냉매 부족, 압축기 이상
- 소음 발생 → 팬 모터 불량, 이물질 끼임
- 성에 과다 → 도어 패킹 불량, 제상 히터 이상

## 4. 점검 순서
1. 외관 및 도어 패킹 상태 확인
2. 압축기 운전 소음 확인
3. 냉매 압력 측정
4. 증발기 결빙 상태 확인`,
    requiredLevel: "ADVANCED",  // lms_contents.required_level
    contentType: "TEXT",         // lms_contents.content_type
    version: "2.1",              // lms_contents.version
    isActive: true,
    confirmedAt: null,           // lms_confirmations.confirmed_at (null=미이수)
    confirmedVersion: null,
  },
  {
    contentId: 2,
    title: "냉장고 부품 교체 실무 (고급)",
    body: `# 냉장고 부품 교체 실무 (고급)

## 1. 압축기 교체 절차
1. 냉매 회수 (환경법 준수 필수)
2. 용접 해제 및 압축기 탈거
3. 신품 압축기 설치 및 용접
4. 진공 작업 (30분 이상)
5. 냉매 충전 및 누설 검사

## 2. 메인보드 교체
- 전원 차단 후 커넥터 사진 촬영
- 보드 탈거 → 신품 장착 → 커넥터 재연결
- 파라미터 초기화 및 테스트

## 3. 주의사항
- 냉매 취급 시 반드시 보호 장갑 착용
- 고압 전기 부품 접근 시 절연 공구 사용
- 작업 후 반드시 성능 테스트 실시`,
    requiredLevel: "ADVANCED",
    contentType: "TEXT",
    version: "1.3",
    isActive: true,
    confirmedAt: `${COMPLETION_YEAR}-03-10 14:22:00`, // 이수 완료
    confirmedVersion: "1.3",
  },
  {
    contentId: 3,
    title: "전기 안전 및 작업 안전 수칙 (공통)",
    body: `# 전기 안전 및 작업 안전 수칙

## 1. 기본 안전 수칙
- 작업 전 반드시 전원 차단 확인
- 절연 공구 및 절연 장갑 착용
- 습한 환경에서의 전기 작업 금지

## 2. 감전 예방
- 단선 및 피복 손상 전선 즉시 교체
- 접지 확인 후 작업 시작
- 2인 1조 작업 원칙

## 3. 화재 예방
- 작업 후 부품 결합 상태 재확인
- 이상 발열 부품 즉시 교체
- 작업장 내 소화기 위치 숙지

## 4. 고객 안전 안내
- 작업 중 고객 접근 통제
- 완료 후 정상 작동 확인 및 안내`,
    requiredLevel: "ALL",        // 모든 등급 필수
    contentType: "TEXT",
    version: "3.0",
    isActive: true,
    confirmedAt: `${COMPLETION_YEAR}-02-15 10:05:00`,
    confirmedVersion: "3.0",
  },
];

export default function EngineerLmsPage() {
  const [contents, setContents] = useState(lmsContents);
  const [selectedContent, setSelectedContent] = useState(null);
  const [isReading, setIsReading] = useState(false);

  const totalCount    = contents.length;
  const completedCount = contents.filter(c => c.confirmedAt).length;
  const allCompleted   = totalCount === completedCount;

  const handleConfirm = (contentId) => {
    // TODO: POST /api/engineer/lms/{contentId}/confirm
    // → lms_confirmations INSERT
    // → 전체 이수 시 engineer_profiles.is_lms_completed = 1
    setContents(prev => prev.map(c =>
      c.contentId === contentId
        ? { ...c, confirmedAt: new Date().toISOString(), confirmedVersion: c.version }
        : c
    ));
    setIsReading(false);
    setSelectedContent(null);
  };

  return (
    <div className="elp">
      {/* 헤더 */}
      <div className="elp-header">
        <div>
          <h1 className="elp-header__title">LMS 교육</h1>
          <p className="elp-header__sub">
            {engineerInfo.categoryName} 전문 · {engineerInfo.skillLevel} 등급 필수 교육 콘텐츠입니다.
          </p>
        </div>
        {/* engineer_profiles.is_lms_completed 기준 */}
        <div className={`elp-lms-status ${allCompleted ? "elp-lms-status--done" : "elp-lms-status--pending"}`}>
          {allCompleted
            ? <><CheckCircle size={14} /> {COMPLETION_YEAR}년 이수 완료 · 배차 가능</>
            : <><Clock size={14} /> {COMPLETION_YEAR}년 이수 중 · 미완료 시 배차 제한</>
          }
        </div>
      </div>

      {/* 진행률 카드 */}
      <div className="elp-progress-card">
        <div className="elp-progress-card__left">
          <GraduationCap size={28} color="#5B4FF5" />
          <div>
            <p className="elp-progress-card__label">{COMPLETION_YEAR}년 필수 교육 이수 현황</p>
            <p className="elp-progress-card__count">
              <span className="elp-progress-card__done">{completedCount}</span>
              <span> / {totalCount}개 완료</span>
            </p>
          </div>
        </div>
        <div className="elp-progress-card__right">
          <div className="elp-progress-bar-wrap">
            <div className="elp-progress-bar" style={{ width: `${(completedCount / totalCount) * 100}%` }} />
          </div>
          <span className="elp-progress-pct">{Math.round((completedCount / totalCount) * 100)}%</span>
        </div>
      </div>

      <div className="elp-body">
        {/* 콘텐츠 목록 */}
        <div className="elp-list">
          <p className="elp-list__title">필수 교육 목록</p>
          <p className="elp-list__desc">
            {/* lms_contents.category_id + required_level 필터링 기준 */}
            기사님의 전문 카테고리({engineerInfo.categoryName})와 기술 등급({engineerInfo.skillLevel})에 해당하는 콘텐츠입니다.
          </p>

          {contents.map((item) => {
            const isDone = !!item.confirmedAt;
            const isSelected = selectedContent?.contentId === item.contentId;
            return (
              <div
                key={item.contentId}
                className={`elp-content-card ${isDone ? "elp-content-card--done" : ""} ${isSelected ? "elp-content-card--selected" : ""}`}
                onClick={() => { setSelectedContent(item); setIsReading(false); }}
              >
                <div className={`elp-content-card__icon ${isDone ? "elp-content-card__icon--done" : ""}`}>
                  {isDone ? <CheckCircle size={20} color="#16a34a" /> : <BookOpen size={20} color="#5B4FF5" />}
                </div>
                <div className="elp-content-card__info">
                  <p className="elp-content-card__title">{item.title}</p>
                  <div className="elp-content-card__meta">
                    {/* lms_contents.required_level */}
                    <span className={`elp-level-badge elp-level-badge--${item.requiredLevel.toLowerCase()}`}>
                      {item.requiredLevel === "ALL" ? "전 등급" : item.requiredLevel}
                    </span>
                    {/* lms_contents.content_type */}
                    <span className="elp-type-badge">{item.contentType}</span>
                    {/* lms_contents.version */}
                    <span className="elp-version">v{item.version}</span>
                  </div>
                  {/* lms_confirmations.confirmed_at */}
                  {isDone && (
                    <p className="elp-content-card__confirmed">
                      ✓ 이수 완료 · {item.confirmedAt?.slice(0, 10)}
                    </p>
                  )}
                </div>
                <ChevronRight size={16} color="#aaa" />
              </div>
            );
          })}
        </div>

        {/* 상세 뷰어 */}
        {selectedContent && (
          <div className="elp-viewer">
            <div className="elp-viewer__header">
              <div>
                <p className="elp-viewer__title">{selectedContent.title}</p>
                <div className="elp-viewer__meta">
                  <span className={`elp-level-badge elp-level-badge--${selectedContent.requiredLevel.toLowerCase()}`}>
                    {selectedContent.requiredLevel === "ALL" ? "전 등급" : selectedContent.requiredLevel}
                  </span>
                  <span className="elp-type-badge">{selectedContent.contentType}</span>
                  <span className="elp-version">v{selectedContent.version}</span>
                </div>
              </div>
              <button className="elp-viewer__close" onClick={() => setSelectedContent(null)}>
                <X size={16} />
              </button>
            </div>

            {/* lms_contents.body - TEXT 콘텐츠 */}
            <div className="elp-viewer__body">
              {selectedContent.body.split("\n").map((line, i) => {
                if (line.startsWith("# "))   return <h2 key={i} className="elp-md-h1">{line.slice(2)}</h2>;
                if (line.startsWith("## "))  return <h3 key={i} className="elp-md-h2">{line.slice(3)}</h3>;
                if (line.startsWith("- "))   return <p  key={i} className="elp-md-li">• {line.slice(2).replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
                if (/^\d+\./.test(line))     return <p  key={i} className="elp-md-ol">{line}</p>;
                if (line.trim() === "")      return <div key={i} className="elp-md-br" />;
                return <p key={i} className="elp-md-p">{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
              })}
            </div>

            {/* 이수 버튼 */}
            <div className="elp-viewer__footer">
              {selectedContent.confirmedAt
                ? (
                  <div className="elp-viewer__done">
                    <CheckCircle size={16} color="#16a34a" />
                    이수 완료 · {selectedContent.confirmedAt?.slice(0, 10)}
                    {/* lms_confirmations.confirmed_version */}
                    &nbsp;(v{selectedContent.confirmedVersion})
                  </div>
                ) : (
                  <>
                    {!isReading && (
                      <p className="elp-viewer__hint">콘텐츠를 끝까지 읽은 후 이수 완료 처리하세요.</p>
                    )}
                    <button
                      className="elp-confirm-btn"
                      onClick={() => handleConfirm(selectedContent.contentId)}
                    >
                      <CheckCircle size={14} /> 이수 완료 처리
                    </button>
                  </>
                )
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}