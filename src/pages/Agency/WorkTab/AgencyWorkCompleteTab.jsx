import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle, CalendarDays, ClipboardList, Clock,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, RefreshCw, X, Phone,
} from "lucide-react";
import "../../../styles/Agency/WorkTab/AgencyWorkCompleteTab.css";
import api from "../../../apis/axiosInstance";

// 완료 배정 목록 조회: GET /api/agency/as-assignments/completed?page=0&size=10
// as_assignments WHERE status=COMPLETED + work_reports + reviews JOIN

const RESULT_MAP = {
  NORMAL:        { label: "정상 확인",   type: "normal"        },
  REPAIRED:      { label: "수리 완료",   type: "repaired"      },
  PART_REPLACED: { label: "부품 교체",   type: "part-replaced" },
  UNREPAIRABLE:  { label: "수리 불가",   type: "unrepairable"  },
};

function StarRating({ rating }) {
  if (rating == null) return <span style={{ color: "#aaa", fontSize: "12px" }}>-</span>;
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

// API 응답 → 화면 필드 매핑
function mapItem(r) {
  const date = r.submittedAt ? new Date(r.submittedAt) : null;
  const submittedAtDisplay = date
    ? `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,"0")}.${String(date.getDate()).padStart(2,"0")} ${String(date.getHours()).padStart(2,"0")}:${String(date.getMinutes()).padStart(2,"0")}`
    : "-";

  const reviewDate = r.reviewAt ? new Date(r.reviewAt) : null;
  const reviewAtDisplay = reviewDate
    ? `${reviewDate.getFullYear()}.${String(reviewDate.getMonth()+1).padStart(2,"0")}.${String(reviewDate.getDate()).padStart(2,"0")} ${String(reviewDate.getHours()).padStart(2,"0")}:${String(reviewDate.getMinutes()).padStart(2,"0")}`
    : "-";

  return {
    id:              r.assignmentId,
    requestId:       r.requestId,
    customer:        r.customerName ?? "-",
    phone:           r.customerPhone ?? "-",
    productName:     r.productName ?? "-",
    modelNo:         r.modelNo ?? "-",
    engineerName:    r.engineerName ?? "-",
    engineerImg:     r.engineerImg ?? null,
    engineerRating:  r.engineerRating ?? null,
    engineerPhone:   r.engineerPhone ?? "-",
    submittedAt:     submittedAtDisplay,
    workDurationMin: r.workDurationMin ?? null,
    diagnosisResult: r.diagnosisResult ?? "NORMAL",
    finalAmount:     r.finalAmount ?? 0,
    memo:            r.memo ?? "-",
    visitDate:       r.visitDate ? `${r.visitDate} ${r.visitTime ?? ""}` : "-",
    address:         r.visitAddress ?? "-",
    rating:          r.rating ?? null,
    reviewContent:   r.reviewContent ?? null,
    reviewAt:        reviewAtDisplay,
  };
}

function buildPageNumbers(current, total) {
  if (total <= 1) return [1];
  const half = 2;
  let start = Math.max(1, current - half);
  let end   = Math.min(total, start + 4);
  if (end - start < 4) start = Math.max(1, end - 4);
  const nums = [];
  for (let p = start; p <= end; p++) nums.push(p);
  return nums;
}

export default function AgencyWorkCompleteTab() {
  const [currentPage,  setCurrentPage]  = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [keyword,      setKeyword]      = useState("");

  // API 상태
  const [completeList, setCompleteList] = useState([]);
  const [totalPages,   setTotalPages]   = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading,      setLoading]      = useState(false);

  const fetchCompleted = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await api.get("/api/agency/as-assignments/completed", {
        params: { page: currentPage - 1, size: 10 },
      });
      const data = res.data;
      // Page<AssignmentCompletedResponse> 또는 배열 모두 처리
      if (Array.isArray(data)) {
        setCompleteList(data.map(mapItem));
        setTotalPages(1);
        setTotalElements(data.length);
      } else {
        setCompleteList((data.content ?? []).map(mapItem));
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalElements ?? 0);
      }
    } catch {
      // 오류 시 빈 목록 유지
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchCompleted();
  }, [fetchCompleted]);

  const selectedResult = selectedItem ? (RESULT_MAP[selectedItem.diagnosisResult] ?? RESULT_MAP["NORMAL"]) : null;

  // 키워드 클라이언트 필터 (접수번호·고객명·기사명)
  const filteredList = keyword.trim()
    ? completeList.filter(
        (it) =>
          String(it.requestId).includes(keyword) ||
          it.customer.includes(keyword) ||
          it.engineerName.includes(keyword)
      )
    : completeList;

  const pageNumbers = buildPageNumbers(currentPage, totalPages);

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

      {/* 통계 — API가 별도 통계 응답을 주지 않으므로 로드된 데이터 기반으로 표시 */}
      <div className="wct-stats">
        {[
          { label: "전체 완료",      value: totalElements, unit: "건", icon: ClipboardList, color: "orange" },
          { label: "평균 작업 시간", value: completeList.length > 0
              ? Math.round(completeList.reduce((s, r) => s + (r.workDurationMin ?? 0), 0) / completeList.length)
              : 0, unit: "분", icon: Clock, color: "gray" },
        ].map((s) => (
          <div key={s.label} className="wct-stat-card">
            <div className="wct-stat-card__text">
              <p className="wct-stat-card__value">{s.value.toLocaleString()}<span>{s.unit}</span></p>
              <p className="wct-stat-card__label">{s.label}</p>
            </div>
            <div className={`wct-stat-card__icon wct-stat-card__icon--${s.color}`}>
              <s.icon size={40} strokeWidth={1} />
            </div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div className="wct-filters">
        <div className="wct-filter-date">
          <CalendarDays size={13} color="#aaa" />
          <span>날짜 필터</span>
        </div>
        <div className="wct-search">
          <Search size={13} color="#aaa" />
          <input
            type="text"
            placeholder="접수번호, 고객명, 기사명 검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <button className="wct-reset-btn" onClick={() => { setKeyword(""); setCurrentPage(1); }}>
          <RefreshCw size={13} /> 초기화
        </button>
      </div>

      <div className="wct-body">
        <div className="wct-left">
          <div className="wct-table-meta">
            <span className="wct-total">완료 작업 목록 ({totalElements.toLocaleString()}건)</span>
          </div>

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

            {loading && (
              <div style={{ padding: "24px", textAlign: "center", color: "#aaa", fontSize: "13px" }}>
                불러오는 중...
              </div>
            )}
            {!loading && filteredList.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "#aaa", fontSize: "13px" }}>
                완료된 작업이 없습니다.
              </div>
            )}

            {!loading && filteredList.map((item) => {
              const result = RESULT_MAP[item.diagnosisResult] ?? { label: item.diagnosisResult, type: "normal" };
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`wct-table__row ${isSelected ? "wct-table__row--selected" : ""}`}
                >
                  <span className="wct-table__id">
                    {`AS-${String(item.requestId).padStart(6, "0")}`}
                  </span>
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
                  <span className="wct-table__work-min">
                    {item.workDurationMin != null ? `${item.workDurationMin}분` : "-"}
                  </span>
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
              {pageNumbers.map(p => (
                <button key={p} className={currentPage === p ? "wct-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              {totalPages > pageNumbers[pageNumbers.length - 1] && (
                <>
                  <span className="wct-pagination__ellipsis">...</span>
                  <button
                    className={currentPage === totalPages ? "wct-pagination__active" : ""}
                    onClick={() => setCurrentPage(totalPages)}
                  >{totalPages}</button>
                </>
              )}
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
              <p className="wct-detail__id">{`AS-${String(selectedItem.requestId).padStart(6, "0")}`}</p>

              <div className="wct-detail__section">
                <p className="wct-detail__section-label">고객 정보</p>
                <div className="wct-detail__row">
                  <span className="wct-detail__value">{selectedItem.customer} 고객</span>
                  <span className="wct-detail__phone"><Phone size={11} /> {selectedItem.phone}</span>
                </div>
              </div>

              <div className="wct-detail__section">
                <p className="wct-detail__section-label">제품 정보</p>
                <p className="wct-detail__value">{selectedItem.productName} ({selectedItem.modelNo})</p>
              </div>

              <div className="wct-detail__section">
                <p className="wct-detail__section-label">담당 기사</p>
                <div className="wct-detail__engineer-card">
                  <Avatar name={selectedItem.engineerName} size={36} />
                  <div>
                    <p className="wct-detail__engineer-name">
                      {selectedItem.engineerName}
                      {selectedItem.engineerRating != null && (
                        <span className="wct-detail__rating"> ⭐ {selectedItem.engineerRating}</span>
                      )}
                    </p>
                    <p className="wct-detail__engineer-phone">{selectedItem.engineerPhone}</p>
                  </div>
                </div>
              </div>

              <div className="wct-detail__section">
                <p className="wct-detail__section-label">예약 정보</p>
                <div className="wct-detail__info-row"><span className="wct-detail__info-label">예약 일시</span><span>{selectedItem.visitDate}</span></div>
                <div className="wct-detail__info-row"><span className="wct-detail__info-label">주소</span><span>{selectedItem.address}</span></div>
              </div>

              <div className="wct-detail__section">
                <p className="wct-detail__section-label">작업 정보</p>
                <div className="wct-detail__info-row"><span className="wct-detail__info-label">보고서 제출</span><span>{selectedItem.submittedAt}</span></div>
                <div className="wct-detail__info-row"><span className="wct-detail__info-label">작업 시간</span><span>{selectedItem.workDurationMin != null ? `${selectedItem.workDurationMin}분` : "-"}</span></div>
                <div className="wct-detail__info-row"><span className="wct-detail__info-label">최종 청구액</span><span className="wct-detail__amount">{selectedItem.finalAmount.toLocaleString()}원</span></div>
              </div>

              <div className="wct-detail__section">
                <p className="wct-detail__section-label">진단 결과</p>
                <span className={`wct-result-badge wct-result-badge--${selectedResult?.type}`}>{selectedResult?.label}</span>
                <p className="wct-detail__result-desc">{selectedItem.memo}</p>
              </div>

              <div className="wct-detail__section">
                <p className="wct-detail__section-label">고객 평가</p>
                {selectedItem.rating != null ? (
                  <div className="wct-detail__review-card">
                    <StarRating rating={selectedItem.rating} />
                    {selectedItem.reviewContent && (
                      <p className="wct-detail__review-text">"{selectedItem.reviewContent}"</p>
                    )}
                    <p className="wct-detail__review-at">작성일 {selectedItem.reviewAt}</p>
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "#aaa" }}>등록된 리뷰가 없습니다.</p>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
