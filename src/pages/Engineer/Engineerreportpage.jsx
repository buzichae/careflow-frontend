import { useState, useEffect, useMemo } from "react";
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
  const [pageSize, setPageSize]       = useState(20);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [reportList, setReportList]   = useState([]);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalCount, setTotalCount]   = useState(0);
  const navigate = useNavigate();

  // [버그 수정] 아래 필터들은 원래 state가 아예 없는 장식용 UI였음
  // (onChange 없음, fetch 호출에도 값이 전달되지 않음)
  const [statusFilter, setStatusFilter] = useState("전체 상태");
  const [search, setSearch] = useState("");
  // [수정] 기본값을 "올해"로 제한하면, 작년에 완료된 보고서 등 다른 연도
  // 데이터가 기본 화면에서 안 보이게 되는 문제가 있었음.
  // → 기본값은 빈 값(필터링 없음, 전체 기간)으로 두고, 사용자가 직접 날짜를
  //   선택했을 때만 그 범위로 필터링되도록 변경.
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  useEffect(() => {
    let mounted = true;
    /* eslint-disable react-hooks/set-state-in-effect -- 비동기 조회 직전 로딩/에러 상태 초기화(의도된 동작) */
    setLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    // 참고: getWorkReports가 현재 (page, size)만 받도록 되어 있어, 필터를
    // 서버로 넘길 방법이 없습니다. 백엔드/API 함수가 필터 파라미터를 지원하도록
    // 확장되면 이 호출에 statusFilter/search/dateStart/dateEnd를 함께 전달하고
    // 아래 클라이언트 필터링은 제거하는 것이 정확합니다 (지금은 현재 페이지
    // 20~50건 안에서만 필터링되어, 여러 페이지에 걸친 결과는 놓칠 수 있음).
    getWorkReports(currentPage, pageSize)
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
  }, [currentPage, pageSize]);

  // [버그 수정] 상태/검색어/기간 필터를 실제로 목록에 적용
  const filteredList = useMemo(() => {
    return reportList.filter((item) => {
      if (statusFilter !== "전체 상태" && item.status !== statusFilter) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = [item.customerName, item.productName, item.requestCode, item.requestId]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (item.workDate) {
        // [버그 수정] workDate는 "2026.07.07 (화)" 형식(점 구분자 + 요일)인데
        // dateStart/dateEnd는 "2026-07-07" 형식(하이픈)이라 문자열 비교가 항상
        // 어긋나서 전부 필터링되어 사라지던 문제. "YYYY.MM.DD" 부분만 뽑아
        // 하이픈 형식으로 변환한 뒤 비교.
        const workDateOnly = item.workDate.split(" ")[0].replace(/\./g, "-");
        if (dateStart && workDateOnly < dateStart) return false;
        if (dateEnd && workDateOnly > dateEnd) return false;
      }

      return true;
    });
  }, [reportList, statusFilter, search, dateStart, dateEnd]);

  // 엑셀(CSV) 다운로드 — 현재 화면에 보이는 필터된 목록(filteredList)을 그대로 내보냄.
  // (페이징 특성상 현재 페이지 기준. 서버 전체 export가 필요하면 백엔드 다운로드 엔드포인트로 확장)
  const escapeCsv = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const handleExcelDownload = () => {
    if (filteredList.length === 0) {
      alert("다운로드할 데이터가 없습니다.");
      return;
    }
    const header = ["접수번호", "고객명", "제품명", "모델명", "작업일", "작업시간", "상태", "작업금액(원)", "보고서제출일", "고객승인일"];
    const rows = filteredList.map((item) => [
      item.requestCode ?? item.requestId,
      item.customerName,
      item.productName,
      item.modelNo,
      item.workDate,
      `${item.workTimeStart ?? ""}~${item.workTimeEnd ?? ""}`,
      STATUS_MAP[item.status]?.label ?? item.status,
      item.finalAmount ?? "",
      item.submittedAt ?? "",
      item.approvedAt ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `작업보고서_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    { label: "전체",    value: totalCount,                                                  icon: FileText,    color: "purple" },
    { label: "작성 대기", value: filteredList.filter(r => r.status === "DRAFT").length,      icon: Clock,       color: "orange" },
    { label: "제출 완료", value: filteredList.filter(r => r.status === "SUBMITTED").length,  icon: CheckCircle, color: "blue"   },
    { label: "승인 완료", value: filteredList.filter(r => r.status === "APPROVED").length,   icon: CheckCircle, color: "green"  },
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
        <div className="erp-filter-date" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            style={{ border: "none", background: "none", font: "inherit", color: "inherit" }}
          />
          <span>~</span>
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            style={{ border: "none", background: "none", font: "inherit", color: "inherit" }}
          />
        </div>

        <select
          className="erp-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ border: "none", background: "none", font: "inherit", color: "inherit", cursor: "pointer" }}
        >
          <option value="전체 상태">전체 상태</option>
          <option value="DRAFT">작성 대기</option>
          <option value="SUBMITTED">제출 완료</option>
          <option value="APPROVED">승인 완료</option>
        </select>

        {/* [주의] 브랜드 필터는 응답에 brand 필드 자체가 없어(productName/modelNo만 있음)
            정확한 필터링이 불가능한 상태입니다. 백엔드에 brand 필드 추가가 필요합니다. */}
        <div className="erp-filter-select" title="백엔드 응답에 brand 필드가 없어 아직 동작하지 않습니다">
          <span>전체 브랜드</span><ChevronDown size={13} />
        </div>

        <div className="erp-search">
          <Search size={13} color="#aaa" />
          <input
            type="text"
            placeholder="고객명, 모델명, 접수번호 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="erp-excel-btn" onClick={handleExcelDownload}><Download size={13} /> 엑셀 다운로드</button>
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
            <span className="erp-list-count">
              총 {totalCount}건 {filteredList.length !== reportList.length && `(현재 페이지 중 ${filteredList.length}건 표시)`}
            </span>
            <div className="erp-list-controls">
              <div className="erp-sort-select">최신순 <ChevronDown size={13} /></div>
              <select
                className="erp-size-select"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                style={{ border: "none", background: "none", font: "inherit", color: "inherit", cursor: "pointer" }}
              >
                <option value={20}>20개씩</option>
                <option value={50}>50개씩</option>
              </select>
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

            {filteredList.map((item) => {
              const status = STATUS_MAP[item.status];
              return (
                <div key={item.reportId ?? item.requestId} className="erp-table__row">
                  <span className="erp-table__request-id">{item.requestCode ?? item.requestId}</span>
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
                    {item.status === "DRAFT" ? (
                        <button
                            className="erp-write-btn"
                            // 🌟 신규: 작업 상태가 IN_PROGRESS가 아니면 시각적으로 비활성화(반투명) 처리
                            style={{
                              opacity: item.requestStatus !== "IN_PROGRESS" ? 0.5 : 1,
                              cursor: item.requestStatus !== "IN_PROGRESS" ? "not-allowed" : "pointer"
                            }}
                            title={item.requestStatus !== "IN_PROGRESS" ? "작업 상태를 '수리 중'으로 변경해야 작성할 수 있습니다." : ""}
                            onClick={() => {
                              // 🌟 신규: 클릭 시 방어 로직 (알림창 띄우기)
                              if (item.requestStatus !== "IN_PROGRESS") {
                                alert("작업 상태를 '수리 중'으로 변경한 후 보고서를 작성할 수 있습니다.");
                                return;
                              }
                              navigate("/engineer/report/submit", { state: { requestId: item.requestId } });
                            }}
                        >
                          보고서 작성
                        </button>
                    ) : (
                        <button
                            className="erp-detail-btn"
                            onClick={() => navigate(`/engineer/reports/${item.reportId}`)}
                        >
                          상세보기
                        </button>
                    )}
                    <button className="erp-more-btn"><MoreVertical size={14} /></button>
                  </span>
                </div>
              );
            })}

            {filteredList.length === 0 && (
              <p style={{ padding: 24, textAlign: "center", color: "#aaa" }}>
                조건에 맞는 보고서가 없습니다.
              </p>
            )}
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
          </div>
        </>
      )}
    </div>
  );
}