import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, MoreVertical, Download,
  FileText, Clock, CheckCircle,
} from "lucide-react";
import { getWorkReports } from "../../apis/engineers";
import "../../styles/Engineer/Engineerreportpage.css";

const STATUS_MAP = {
  DRAFT:     { label: "작성 대기", type: "draft"     },
  SUBMITTED: { label: "제출 완료", type: "submitted" },
  APPROVED:  { label: "승인 완료", type: "approved"  },
};

export default function EngineerReportPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [reportList, setReportList]   = useState([]);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getWorkReports(currentPage, 20)
      .then((res) => {
        if (!mounted) return;
        const d = res.data;
        setReportList(d.content);
        setTotalPages(d.totalPages ?? 1);
        setTotalCount(d.totalElements ?? d.content.length);
      })
      .catch((err) => {
        console.error("보고서 목록 조회 실패:", err);
        if (mounted) setError("보고서 목록을 불러오지 못했습니다.");
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [currentPage]);

  const statCards = [
    { label: "전체",    value: totalCount,                                              icon: FileText,    color: "purple" },
    { label: "작성 대기", value: reportList.filter(r => r.status === "DRAFT").length,     icon: Clock,       color: "orange" },
    { label: "제출 완료", value: reportList.filter(r => r.status === "SUBMITTED").length, icon: CheckCircle, color: "blue"   },
    { label: "승인 완료", value: reportList.filter(r => r.status === "APPROVED").length,  icon: CheckCircle, color: "green"  },
  ];

  return (
    <div className="erp">
      <div className="erp-header">
        <div>
          <h1 className="erp-header__title">작업 보고서 목록</h1>
          <p className="erp-header__sub">완료된 작업 보고서를 조회하고 관리할 수 있습니다.</p>
        </div>
      </div>

      <div className="erp-filters">
        <div className="erp-filter-date"><span>2024.06.01 ~ 2024.06.30</span></div>
        <div className="erp-filter-select"><span>전체 상태</span><ChevronDown size={13} /></div>
        <div className="erp-filter-select"><span>전체 브랜드</span><ChevronDown size={13} /></div>
        <div className="erp-search">
          <Search size={13} color="#aaa" />
          <input type="text" placeholder="고객명, 모델명, 접수번호 검색" />
        </div>
        <button className="erp-excel-btn"><Download size={13} /> 엑셀 다운로드</button>
      </div>

      {/* 통계 카드 */}
      <div className="erp-stats">
        {statCards.map((s) => (
          <div key={s.label} className="erp-stat-card">
            <div className="erp-stat-card__text">
              <p className="erp-stat-card__value">{s.value}<span>건</span></p>
              <p className="erp-stat-card__label">{s.label}</p>
            </div>
            <div className={`erp-stat-card__icon erp-stat-card__icon--${s.color}`}>
              <s.icon size={40} strokeWidth={1} />
            </div>
          </div>
        ))}
      </div>

      {loading && <p style={{ padding: "16px" }}>불러오는 중...</p>}
      {error   && <p style={{ padding: "16px", color: "red" }}>{error}</p>}

      {!loading && !error && (
        <>
          <div className="erp-list-meta">
            <span className="erp-list-count">총 {totalCount}건</span>
            <div className="erp-list-controls">
              <div className="erp-sort-select">최신순 <ChevronDown size={13} /></div>
              <div className="erp-size-select">20개씩 <ChevronDown size={13} /></div>
            </div>
          </div>

          <div className="erp-table">
            <div className="erp-table__header">
              <span>접수번호</span>
              <span>고객명</span>
              <span>제품명</span>
              <span>작업 일시</span>
              <span>상태</span>
              <span>작업 금액</span>
              <span>보고서 제출일</span>
              <span>고객 승인일</span>
              <span>관리</span>
            </div>

            {reportList.map((item) => {
              const status = STATUS_MAP[item.status];
              return (
                <div key={item.reportId ?? item.requestId} className="erp-table__row">
                  <span className="erp-table__request-id">{item.requestId}</span>
                  <span className="erp-table__customer">{item.customerName}</span>
                  <span className="erp-table__product-col">
                    <span className="erp-table__product">{item.productName}</span>
                    <span className="erp-table__model">{item.modelNo}</span>
                  </span>
                  <span className="erp-table__work-date">
                    <span>{item.workDate}</span>
                    <span className="erp-table__work-time">{item.workTimeStart} ~ {item.workTimeEnd}</span>
                  </span>
                  <span>
                    <span className={`erp-status-badge erp-status-badge--${status.type}`}>{status.label}</span>
                  </span>
                  <span className="erp-table__amount">
                    {item.finalAmount ? `${item.finalAmount.toLocaleString()}원` : "-"}
                  </span>
                  <span className="erp-table__date">{item.submittedAt ?? "-"}</span>
                  <span className="erp-table__date">{item.approvedAt ?? "-"}</span>
                  <span className="erp-table__actions">
                    {item.status === "DRAFT"
                      ? <button className="erp-write-btn">보고서 작성</button>
                      : <button className="erp-detail-btn" onClick={() => navigate(`/engineer/reports/${item.reportId}`)}>상세보기</button>
                    }
                    <button className="erp-more-btn"><MoreVertical size={14} /></button>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="erp-pagination">
            <div className="erp-pagination__left">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={14} /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={currentPage === p ? "erp-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight size={14} /></button>
            </div>
            <div className="erp-page-size">20개씩 <ChevronDown size={13} /></div>
          </div>
        </>
      )}
    </div>
  );
}