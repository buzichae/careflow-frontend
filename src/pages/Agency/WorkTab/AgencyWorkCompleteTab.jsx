import { useState } from "react";
import {
  CheckCircle, CalendarDays, ClipboardList, Clock,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, RefreshCw, X, Phone,
} from "lucide-react";
import "../../../styles/Agency/WorkTab/AgencyWorkCompleteTab.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/agency/as-assignments/completed?page=0&size=10&sort=submitted_at,desc
// as_assignments WHERE status=COMPLETED
// + as_requests + appliances + users(고객) + engineer_profiles
// + work_reports (submitted_at, work_duration_min, diagnosis_result, final_amount, memo)
// + reviews (rating, content, created_at)
// ──────────────────────────────────────────

const statCards = [
  { label: "오늘 완료",     value: 18,   unit: "건", icon: CheckCircle,   color: "green"  },
  { label: "이번 주 완료",  value: 86,   unit: "건", icon: CalendarDays,  color: "blue"   },
  { label: "이번 달 완료",  value: 325,  unit: "건", icon: CalendarDays,  color: "purple" },
  { label: "전체 완료",     value: 2148, unit: "건", icon: ClipboardList, color: "orange" },
  { label: "평균 작업 시간",value: 95,   unit: "분", icon: Clock,         color: "gray"   },
];

// ──────────────────────────────────────────
// work_reports.diagnosis_result ENUM 기준으로 변경
// DB ENUM: NORMAL / REPAIRED / PART_REPLACED / UNREPAIRABLE
// ──────────────────────────────────────────
const RESULT_MAP = {
  NORMAL:        { label: "정상 확인",   type: "normal"       },
  REPAIRED:      { label: "수리 완료",   type: "repaired"     },
  PART_REPLACED: { label: "부품 교체",   type: "part-replaced"},
  UNREPAIRABLE:  { label: "수리 불가",   type: "unrepairable" },
};

function StarRating({ rating }) {
  return (
    <div className="wct-stars">
      {[1,2,3,4,5].map((s) => (
        <span key={s} className={`wct-star ${s <= Math.floor(rating) ? "wct-star--full" : s - 0.5 <= rating ? "wct-star--half" : ""}`}>★</span>
      ))}
      <span className="wct-rating-val">{rating}</span>
    </div>
  );
}

function Avatar({ name, profileImageUrl, size = 28 }) {
  return (
    <div className="wct-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {profileImageUrl ? <img src={profileImageUrl} alt={name} /> : <span>{name?.charAt(0) ?? "?"}</span>}
    </div>
  );
}

// ──────────────────────────────────────────
// TODO: API 연동 - 완료 목록
// 응답 필드:
//   requestId, customerId, customerName, customerPhone
//   productName, modelNo
//   engineerName, engineerPhone, engineerRating (engineer_profiles.avg_rating), engineerImg
//   submittedAt    ← work_reports.submitted_at  (수정 2: completedAt → submittedAt)
//   workDurationMin← work_reports.work_duration_min (수정 3)
//   diagnosisResult← work_reports.diagnosis_result (수정 1)
//   finalAmount    ← work_reports.final_amount (수정 7)
//   memo           ← work_reports.memo (수정 6: workSummary → memo)
//   rating         ← reviews.rating (1~5 TINYINT)
//   reviewContent  ← reviews.content (수정 4: reviewText → reviewContent)
//   reviewAt       ← reviews.created_at
// ──────────────────────────────────────────
const completeList = [
  // 수정 5: diagnosisResult 다양화
  { id: 1,  requestId: "AS-20240618-0105", customer: "김민지", phone: "010-1234-5678", productName: "LG 디오스 냉장고",   modelNo: "M874GBB231",    engineerName: "김철수 기사", engineerImg: null, submittedAt: "2024.06.18 15:30", workDurationMin: 82,  diagnosisResult: "PART_REPLACED", finalAmount: 120000, rating: 4.8, reviewContent: "친절하고 빠르게 처리해주셨어요!", reviewAt: "2024.06.18 15:45", engineerRating: 4.9, engineerPhone: "010-1111-2222", visitDate: "2024.06.18 (화) 10:00 ~ 12:00", address: "서울특별시 강남구 역삼동 123-45", memo: "냉각 불량 점검 및 냉각팬 교체 완료" },
  { id: 2,  requestId: "AS-20240618-0104", customer: "이영희", phone: "010-2345-6789", productName: "삼성 세탁기",        modelNo: "WF21T6500KP",   engineerName: "박민수 기사", engineerImg: null, submittedAt: "2024.06.18 14:20", workDurationMin: 68,  diagnosisResult: "REPAIRED",       finalAmount: 85000,  rating: 5.0, reviewContent: "정말 친절하셨어요!", reviewAt: "2024.06.18 14:35", engineerRating: 4.8, engineerPhone: "010-2222-3333", visitDate: "2024.06.18 (화) 12:00 ~ 14:00", address: "서울특별시 송파구 올림픽로 100", memo: "배수 필터 청소 및 배수 호스 교체" },
  { id: 3,  requestId: "AS-20240618-0103", customer: "박준호", phone: "010-3456-7890", productName: "LG 에어컨",          modelNo: "FQ18HDWHRN",   engineerName: "이영호 기사", engineerImg: null, submittedAt: "2024.06.18 13:50", workDurationMin: 75,  diagnosisResult: "PART_REPLACED", finalAmount: 95000,  rating: 4.6, reviewContent: "꼼꼼하게 점검해주셨어요.", reviewAt: "2024.06.18 14:00", engineerRating: 4.7, engineerPhone: "010-3333-4444", visitDate: "2024.06.18 (화) 11:00 ~ 13:00", address: "서울특별시 강동구 천호대로 200", memo: "냄새 원인 점검 및 필터 교체 완료" },
  { id: 4,  requestId: "AS-20240618-0102", customer: "최서연", phone: "010-4567-8901", productName: "삼성 QLED TV",       modelNo: "KQ55QC67AFXKR", engineerName: "최지현 기사", engineerImg: null, submittedAt: "2024.06.18 12:40", workDurationMin: 52,  diagnosisResult: "REPAIRED",       finalAmount: 150000, rating: 4.9, reviewContent: "빠르게 고쳐주셨어요!", reviewAt: "2024.06.18 13:00", engineerRating: 4.6, engineerPhone: "010-4444-5555", visitDate: "2024.06.18 (화) 10:00 ~ 12:00", address: "서울특별시 서초구 강남대로 300", memo: "메인보드 점검 및 교체 완료" },
  { id: 5,  requestId: "AS-20240618-0101", customer: "정유진", phone: "010-5678-9012", productName: "LG 식기세척기",      modelNo: "DFB22S",        engineerName: "정유진 기사", engineerImg: null, submittedAt: "2024.06.18 11:30", workDurationMin: 41,  diagnosisResult: "NORMAL",         finalAmount: 30000,  rating: 5.0, reviewContent: "완벽해요!", reviewAt: "2024.06.18 11:50", engineerRating: 4.5, engineerPhone: "010-5555-6666", visitDate: "2024.06.18 (화) 09:00 ~ 11:00", address: "서울특별시 강남구 테헤란로 50", memo: "누수 부위 점검 및 도어 패킹 교체 완료" },
  { id: 6,  requestId: "AS-20240618-0100", customer: "이태훈", phone: "010-6789-0123", productName: "위니아 김치냉장고",  modelNo: "WQ57DGK",       engineerName: "홍길동 기사", engineerImg: null, submittedAt: "2024.06.18 10:25", workDurationMin: 93,  diagnosisResult: "PART_REPLACED", finalAmount: 200000, rating: 4.7, reviewContent: "꼼꼼하고 좋았어요.", reviewAt: "2024.06.18 10:40", engineerRating: 4.4, engineerPhone: "010-6666-7777", visitDate: "2024.06.18 (화) 08:00 ~ 10:00", address: "서울특별시 강북구 미아로 10", memo: "냉각 시스템 점검 및 냉매 보충 완료" },
  { id: 7,  requestId: "AS-20240617-0099", customer: "김수현", phone: "010-8901-2345", productName: "삼성 에어드레서",    modelNo: "DF60A8500KG",   engineerName: "김수현 기사", engineerImg: null, submittedAt: "2024.06.17 18:10", workDurationMin: 61,  diagnosisResult: "NORMAL",         finalAmount: 50000,  rating: 4.8, reviewContent: "빠른 처리 감사해요.", reviewAt: "2024.06.17 18:25", engineerRating: 4.5, engineerPhone: "010-7777-8888", visitDate: "2024.06.17 (월) 16:00 ~ 18:00", address: "서울특별시 마포구 월드컵로 80", memo: "스팀 노즐 청소 및 필터 교체 완료" },
  { id: 8,  requestId: "AS-20240617-0098", customer: "유한나", phone: "010-9012-3456", productName: "LG 전기오븐",        modelNo: "ML32WW1",       engineerName: "이재훈 기사", engineerImg: null, submittedAt: "2024.06.17 16:45", workDurationMin: 57,  diagnosisResult: "UNREPAIRABLE",   finalAmount: 30000,  rating: 4.5, reviewContent: "친절했어요!", reviewAt: "2024.06.17 17:00", engineerRating: 4.3, engineerPhone: "010-8888-9999", visitDate: "2024.06.17 (월) 14:00 ~ 16:00", address: "서울특별시 강서구 화곡로 20", memo: "히터 손상 심각 — 수리 불가 판정" },
  { id: 9,  requestId: "AS-20240617-0097", customer: "장하린", phone: "010-0123-4567", productName: "LG 청소기",          modelNo: "A9S-ULTRA",     engineerName: "박상우 기사", engineerImg: null, submittedAt: "2024.06.17 15:30", workDurationMin: 39,  diagnosisResult: "REPAIRED",       finalAmount: 60000,  rating: 4.9, reviewContent: "완벽한 서비스!", reviewAt: "2024.06.17 15:45", engineerRating: 4.9, engineerPhone: "010-9999-0000", visitDate: "2024.06.17 (월) 14:00 ~ 15:30", address: "서울특별시 노원구 동일로 30", memo: "흡입력 저하 원인 점검 및 모터 청소 완료" },
  { id: 10, requestId: "AS-20240617-0096", customer: "조현우", phone: "010-1234-5678", productName: "삼성 건조기",        modelNo: "DV90T5740SE",   engineerName: "박민수 기사", engineerImg: null, submittedAt: "2024.06.17 14:20", workDurationMin: 72,  diagnosisResult: "PART_REPLACED", finalAmount: 110000, rating: 4.6, reviewContent: "꼼꼼해요.", reviewAt: "2024.06.17 14:35", engineerRating: 4.8, engineerPhone: "010-2222-3333", visitDate: "2024.06.17 (월) 12:00 ~ 14:00", address: "서울특별시 중구 을지로 50", memo: "열풍 시스템 점검 및 필터 교체 완료" },
];

export default function AgencyWorkCompleteTab() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] =  useState(null);
  const totalPages = 33;

  const selectedResult = selectedItem ? RESULT_MAP[selectedItem.diagnosisResult] : null;

  return (
    <div className="wct">
      {/* 자동 갱신 */}
      <div className="wct-refresh-bar">
        <div className="wct-refresh-bar__left">
          <span className="wct-refresh-label">자동 갱신</span>
          <div className="wct-toggle"><div className="wct-toggle__thumb" /></div>
        </div>
        <div className="wct-refresh-select">30초 <ChevronDown size={13} /></div>
      </div>

      {/* 통계 카드 */}
      <div className="wct-stats">
        {statCards.map((s) => (
          <div key={s.label} className="wct-stat-card">
            <div className={`wct-stat-card__icon wct-stat-card__icon--${s.color}`}><s.icon size={20} /></div>
            <div>
              <p className="wct-stat-card__label">{s.label}</p>
              <p className="wct-stat-card__value">{s.value.toLocaleString()}<span>{s.unit}</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div className="wct-filters">
        <div className="wct-filter-date">
          <CalendarDays size={13} color="#aaa" />
          <span>2024.06.01 ~ 2024.06.18</span>
          <CalendarDays size={13} color="#aaa" />
        </div>
        <div className="wct-filter-select"><span>전체 지역</span><ChevronDown size={13} /></div>
        <div className="wct-filter-select"><span>전체 제품</span><ChevronDown size={13} /></div>
        <div className="wct-filter-select"><span>전체 담당 기사</span><ChevronDown size={13} /></div>
        <div className="wct-filter-select"><span>진단 결과</span><ChevronDown size={13} /></div>
        <div className="wct-search">
          <Search size={13} color="#aaa" />
          <input type="text" placeholder="접수번호, 고객명, 기사명 검색" />
        </div>
        <button className="wct-reset-btn"><RefreshCw size={13} /> 필터 초기화</button>
      </div>

      <div className="wct-body">
        <div className="wct-left">
          <div className="wct-table-meta"><span className="wct-total">완료 작업 목록 (325건)</span></div>

          <div className="wct-table">
            <div className="wct-table__header">
              <span>접수번호</span>
              <span>고객</span>
              <span>제품 정보</span>
              <span>담당 기사</span>
              <span>보고서 제출</span>
              <span>작업 시간</span>
              <span>진단 결과</span>
              <span>고객 평가</span>
              <span></span>
            </div>

            {completeList.map((item) => {
              const result = RESULT_MAP[item.diagnosisResult] ?? { label: item.diagnosisResult, type: "normal" };
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`wct-table__row ${isSelected ? "wct-table__row--selected" : ""}`}
                >
                  <span className="wct-table__id">{item.requestId}</span>
                  <span className="wct-table__customer-col">
                    <span className="wct-table__customer">{item.customer} 고객</span>
                    <span className="wct-table__phone">{item.phone}</span>
                  </span>
                  <span className="wct-table__product-col">
                    <span className="wct-table__product-name">{item.productName}</span>
                    <span className="wct-table__model">{item.modelNo}</span>
                  </span>
                  <span className="wct-table__engineer-col">
                    <Avatar name={item.engineerName} profileImageUrl={item.engineerImg} size={26} />
                    <span>{item.engineerName}</span>
                  </span>
                  <span className="wct-table__completed-at">{item.submittedAt}</span>
                  <span className="wct-table__work-min">{item.workDurationMin}분</span>
                  <span>
                    <span className={`wct-result-badge wct-result-badge--${result.type}`}>{result.label}</span>
                  </span>
                  <span onClick={(e) => e.stopPropagation()}>
                    <StarRating rating={item.rating} />
                  </span>
                  <span>
                   <button
                    className={`wct-detail-btn ${selectedItem?.id === item.id ? "wct-detail-btn--active" : ""}`}
                    onClick={() => setSelectedItem(item)}
                   >
                    상세보기
                   </button>
                  </span>
                </div>
              );
            })}
          </div>

          {/* 페이지네이션 */}
          <div className="wct-pagination">
            <div className="wct-pagination__left">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={14} /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
              {[1,2,3,4,5].map(p => (
                <button key={p} className={currentPage === p ? "wct-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <span className="wct-pagination__ellipsis">...</span>
              <button className={currentPage === 33 ? "wct-pagination__active" : ""} onClick={() => setCurrentPage(33)}>33</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight size={14} /></button>
            </div>
            <div className="wct-page-size">10개씩 보기 <ChevronDown size={13} /></div>
          </div>
        </div>

        {/* 우측 상세 패널 */}
        {selectedItem && (
          <aside className="wct-detail">
            <div className="wct-detail__header">
              <span className="wct-detail__title">작업 상세 정보</span>
              <div className="wct-detail__header-right">
                <span className={`wct-result-badge wct-result-badge--${selectedResult?.type}`}>{selectedResult?.label}</span>
                <button className="wct-detail__close" onClick={() => setSelectedItem(null)}><X size={16} /></button>
              </div>
            </div>

            <div className="wct-detail__body">
              <p className="wct-detail__id">{selectedItem.requestId}</p>

              {/* 고객 정보 */}
              <div className="wct-detail__section">
                <p className="wct-detail__section-label">고객 정보</p>
                <div className="wct-detail__row">
                  <span className="wct-detail__value">{selectedItem.customer} 고객</span>
                  <span className="wct-detail__phone"><Phone size={11} /> {selectedItem.phone}</span>
                </div>
              </div>

              {/* 제품 정보 */}
              <div className="wct-detail__section">
                <p className="wct-detail__section-label">제품 정보</p>
                <p className="wct-detail__value">{selectedItem.productName} ({selectedItem.modelNo})</p>
              </div>

              {/* 담당 기사 */}
              <div className="wct-detail__section">
                <p className="wct-detail__section-label">담당 기사</p>
                <div className="wct-detail__engineer-card">
                  <Avatar name={selectedItem.engineerName} size={36} />
                  <div>
                    <p className="wct-detail__engineer-name">
                      {selectedItem.engineerName}
                      <span className="wct-detail__rating"> ⭐ {selectedItem.engineerRating}</span>
                    </p>
                    <p className="wct-detail__engineer-phone">{selectedItem.engineerPhone}</p>
                  </div>
                </div>
              </div>

              {/* 예약 정보 */}
              <div className="wct-detail__section">
                <p className="wct-detail__section-label">예약 정보</p>
                <div className="wct-detail__info-row"><span className="wct-detail__info-label">예약 일시</span><span>{selectedItem.visitDate}</span></div>
                <div className="wct-detail__info-row"><span className="wct-detail__info-label">주소</span><span>{selectedItem.address}</span></div>
              </div>

              <div className="wct-detail__section">
                <p className="wct-detail__section-label">작업 정보</p>
                <div className="wct-detail__info-row"><span className="wct-detail__info-label">보고서 제출</span><span>{selectedItem.submittedAt}</span></div>
                <div className="wct-detail__info-row"><span className="wct-detail__info-label">작업 시간</span><span>{selectedItem.workDurationMin}분</span></div>
                <div className="wct-detail__info-row"><span className="wct-detail__info-label">최종 청구액</span><span className="wct-detail__amount">{selectedItem.finalAmount.toLocaleString()}원</span></div>
              </div>

              <div className="wct-detail__section">
                <p className="wct-detail__section-label">진단 결과</p>
                <span className={`wct-result-badge wct-result-badge--${selectedResult?.type}`}>{selectedResult?.label}</span>
                <p className="wct-detail__result-desc">{selectedItem.memo}</p>
              </div>

              <div className="wct-detail__section">
                <p className="wct-detail__section-label">고객 평가</p>
                <div className="wct-detail__review-card">
                  <StarRating rating={selectedItem.rating} />
                  <p className="wct-detail__review-text">"{selectedItem.reviewContent}"</p>
                  <p className="wct-detail__review-at">작성일 {selectedItem.reviewAt}</p>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}