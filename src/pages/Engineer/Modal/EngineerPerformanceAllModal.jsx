import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { getAllPerformance } from "../../../apis/engineers";
import { DIAGNOSIS_MAP } from "../../../utils/diagnosisMap.js";
import "../../../styles/Engineer/Modal/EngineerPerformanceAllModal.css";

const PAGE_SIZE = 15;

/* 전체 실적 목록 모달 — 필터 없이 완료된 실적 전체를 최신 작업일 순으로 15건씩 페이징 조회 */
export default function EngineerPerformanceAllModal({ onClose }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [content, setContent] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    /* eslint-disable react-hooks/set-state-in-effect -- 비동기 조회 직전 로딩/에러 상태 초기화(의도된 동작) */
    setLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    getAllPerformance(currentPage - 1, PAGE_SIZE)
      .then((res) => {
        if (!mounted) return;
        const d = res.data;
        setContent(d.content ?? []);
        setTotalPages(d.totalPages ?? 1);
      })
      .catch((err) => {
        console.error("전체 실적 조회 실패:", err);
        if (mounted) setError("실적 목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [currentPage]);

  return (
    <div className="epam-overlay" onClick={onClose}>
      <div className="epam-modal" onClick={(e) => e.stopPropagation()}>
        <div className="epam-modal__header">
          <div className="epam-modal__header-left">
            <ClipboardList size={17} color="#5B4FF5" />
            <h3 className="epam-modal__title">전체 실적 목록</h3>
          </div>
          <button className="epam-modal__close" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        <div className="epam-modal__body">
          {loading && <p className="epam-modal__notice">불러오는 중...</p>}
          {error && <p className="epam-modal__notice epam-modal__notice--error">{error}</p>}

          {!loading && !error && (
            <div className="estp-list-table">
              <div className="estp-list-table__header">
                <span>접수번호</span>
                <span>작업 일시</span>
                <span>고객명</span>
                <span>제품명</span>
                <span>브랜드</span>
                <span>작업 금액</span>
                <span>상태</span>
                <span>평점</span>
                <span></span>
              </div>
              {content.map((item, i) => {
                const diag = DIAGNOSIS_MAP[item.diagnosisResult] ?? { label: item.diagnosisResult, type: "done" };
                return (
                  <div key={i} className="estp-list-table__row">
                    <span className="estp-list-table__id">{item.requestId}</span>
                    <span className="estp-list-table__date">{item.workDate}</span>
                    <span>{item.customerName}</span>
                    <span className="estp-list-table__product">{item.productName}</span>
                    <span>{item.brand}</span>
                    <span className="estp-list-table__amount">{(item.grossAmount ?? 0).toLocaleString()}원</span>
                    <span>
                      <span className={`estp-diag-badge estp-diag-badge--${diag.type}`}>{diag.label}</span>
                    </span>
                    <span className="estp-list-table__rating">★ {item.rating != null ? item.rating.toFixed(1) : "-"}</span>
                    <span></span>
                  </div>
                );
              })}
              {content.length === 0 && (
                <p style={{ padding: 20, textAlign: "center", color: "#aaa", fontSize: 13 }}>
                  완료된 실적이 없습니다.
                </p>
              )}
            </div>
          )}

          {!loading && !error && totalPages > 1 && (
            <div className="estp-pagination">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={13} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={currentPage === p ? "estp-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight size={13} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
