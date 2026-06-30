import { useState, useEffect } from "react";
import {
  Wallet, CheckCircle, Clock, Lock, FileText,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, RefreshCw, X, Download, Building2,
} from "lucide-react";
import "../../styles/Agency/Agencysettlementpage.css";

const BASE_URL = "http://localhost:8080";

async function apiFetch(path) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

// ──────────────────────────────────────────
// 18번: CSV 다운로드
// GET /api/agency/settlements/monthly-report/download?year=&month=
// ──────────────────────────────────────────
async function downloadCSV(year, month) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(
    `${BASE_URL}/api/agency/settlements/monthly-report/download?year=${year}&month=${month}`,
    { headers: { ...(token && { Authorization: `Bearer ${token}` }) } }
  );
  if (!res.ok) throw new Error(`${res.status}`);
  const blob = await res.blob();
  const url  = window.URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `settlement_report_${year}_${String(month).padStart(2, "0")}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

const SETTLEMENT_TABS = ["전체", "지급 대기", "지급 완료", "보류", "취소"];

// 16번 API 응답 필드 기준 status 매핑 (payments.status)
const STATUS_MAP = {
  SUCCESS:   { label: "지급 완료", type: "success" },
  READY:     { label: "지급 대기", type: "ready"   },
  FAILED:    { label: "보류",     type: "hold"    },
  CANCELLED: { label: "취소",     type: "cancel"  },
};

function formatSettlementId(engineerId, year, month) {
  return `ST-${year}${String(month).padStart(2, "0")}-${String(engineerId).padStart(4, "0")}`;
}

function Avatar({ name, size = 32 }) {
  return (
    <div className="asp-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      <span>{name?.charAt(0)}</span>
    </div>
  );
}

export default function AgencySettlementPage() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [activeTab,    setActiveTab]    = useState("전체");
  const [currentPage,  setCurrentPage]  = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [autoRefresh,  setAutoRefresh]  = useState(true);
  const totalPages = 25;

  // ── 17번: 정산 합산 내역 → 통계 카드 ────────────
  // 응답: { year, month, totalCount, totalGrossAmount, totalPlatformFee, totalAgencyFee, totalEngineerPayout }
  const [summary,        setSummary]        = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // ── 16번: 기사별 월별 실적 → 정산 목록 ──────────
  // 응답: { year, month, engineers: [{ engineerId, engineerName, completedCount, avgRating, totalEarning }] }
  const [perfList,    setPerfList]    = useState([]);
  const [perfLoading, setPerfLoading] = useState(true);

  useEffect(() => {
    // 17번: 정산 합산
    setSummaryLoading(true);
    apiFetch(`/api/agency/settlements/summary?year=${year}&month=${month}`)
      .then(setSummary)
      .catch(console.error)
      .finally(() => setSummaryLoading(false));

    // 16번: 기사별 실적
    setPerfLoading(true);
    apiFetch(`/api/agency/settlements/engineers/performance?year=${year}&month=${month}`)
      .then(data => setPerfList(data?.engineers ?? []))
      .catch(console.error)
      .finally(() => setPerfLoading(false));
  }, [year, month]);

  // 탭 필터 (16번 API에 status 필드 없으므로 클라이언트 필터 불가 → 전체만 표시)
  // TODO: 백엔드에서 status 필드 추가되면 필터링 가능

  // 17번 API → 통계 카드
  const statCards = [
    {
      label: "총 매출액 (이번 달)",
      value: summaryLoading ? "..." : `₩${(summary?.totalGrossAmount ?? 0).toLocaleString()}`,
      sub: `정산 ${summary?.totalCount ?? 0}건`,
      subType: "neutral", icon: Wallet, color: "purple",
    },
    {
      label: "기사 지급액 합계",
      value: summaryLoading ? "..." : `₩${(summary?.totalEngineerPayout ?? 0).toLocaleString()}`,
      sub: summary ? `${Math.round((summary.totalEngineerPayout / summary.totalGrossAmount) * 100) || 0}%` : "-",
      subType: "neutral", icon: CheckCircle, color: "green",
    },
    {
      label: "플랫폼 수수료",
      value: summaryLoading ? "..." : `₩${(summary?.totalPlatformFee ?? 0).toLocaleString()}`,
      sub: summary ? `${Math.round((summary.totalPlatformFee / summary.totalGrossAmount) * 100) || 0}%` : "-",
      subType: "neutral", icon: Clock, color: "orange",
    },
    {
      label: "대행사 수수료",
      value: summaryLoading ? "..." : `₩${(summary?.totalAgencyFee ?? 0).toLocaleString()}`,
      sub: summary ? `${Math.round((summary.totalAgencyFee / summary.totalGrossAmount) * 100) || 0}%` : "-",
      subType: "neutral", icon: Lock, color: "red",
    },
    {
      label: "정산 건수 (이번 달)",
      value: summaryLoading ? "..." : `${summary?.totalCount ?? 0}건`,
      sub: `${year}년 ${month}월 기준`,
      subType: "neutral", icon: FileText, color: "blue",
    },
  ];

  const handleDownload = async () => {
    try {
      await downloadCSV(year, month);
    } catch (e) {
      console.error("CSV 다운로드 실패:", e);
      alert("다운로드에 실패했습니다.");
    }
  };

  return (
    <div className="asp">
      {/* 헤더 */}
      <div className="asp-header">
        <div>
          <h1 className="asp-header__title">정산 관리</h1>
          <p className="asp-header__sub">기사별 정산 실적 및 월별 합산 내역을 확인할 수 있습니다.</p>
        </div>
        <div className="asp-refresh-bar">
          <span className="asp-refresh-label">자동 갱신</span>
          <div className={`asp-toggle ${autoRefresh ? "asp-toggle--on" : ""}`} onClick={() => setAutoRefresh(p => !p)}>
            <div className="asp-toggle__thumb" />
          </div>
          <div className="asp-refresh-select">30초 <ChevronDown size={13} /></div>
        </div>
      </div>

      {/* 통계 카드 - 17번 API */}
      <div className="asp-stats">
        {statCards.map((s) => (
          <div key={s.label} className="asp-stat-card">
            <div className={`asp-stat-card__icon asp-stat-card__icon--${s.color}`}><s.icon size={20} /></div>
            <div>
              <p className="asp-stat-card__label">{s.label}</p>
              <p className="asp-stat-card__value">{s.value}</p>
              <p className={`asp-stat-card__sub asp-stat-card__sub--${s.subType}`}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div className="asp-filters">
        {/* 연/월 선택 */}
        <div className="asp-filter-date">
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            style={{ border: "none", background: "none", outline: "none", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}
          >
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            style={{ border: "none", background: "none", outline: "none", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}월</option>)}
          </select>
        </div>
        <div className="asp-filter-select"><span>전체 상태</span><ChevronDown size={13} /></div>
        <div className="asp-search">
          <Search size={13} color="#aaa" />
          <input type="text" placeholder="기사명 검색" />
        </div>
        <button className="asp-reset-btn"><RefreshCw size={13} /> 필터 초기화</button>
        {/* 18번: CSV 다운로드 */}
        <button className="asp-excel-btn" onClick={handleDownload}>
          <Download size={13} /> CSV 다운로드
        </button>
      </div>

      <div className="asp-body">
        <div className="asp-left">
          {/* 탭 */}
          <div className="asp-tabs">
            {SETTLEMENT_TABS.map((tab) => (
              <button
                key={tab}
                className={`asp-tab ${activeTab === tab ? "asp-tab--active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* 테이블 - 16번 API */}
          {/* 응답 필드: engineerId, engineerName, completedCount, avgRating, totalEarning */}
          <div className="asp-table">
            <div className="asp-table__header">
              <span>정산 ID</span>
              <span>기사</span>
              <span>완료 건수</span>
              <span>평균 평점</span>
              <span>실 지급액</span>
              <span>관리</span>
            </div>

            {perfLoading ? (
              <p style={{ padding: "16px", color: "#aaa", fontSize: "13px" }}>로딩 중...</p>
            ) : perfList.length === 0 ? (
              <p style={{ padding: "16px", color: "#aaa", fontSize: "13px" }}>정산 데이터가 없습니다.</p>
            ) : (
              perfList.map((item) => {
                const isSelected = selectedItem?.engineerId === item.engineerId;
                return (
                  <div key={item.engineerId} className={`asp-table__row ${isSelected ? "asp-table__row--selected" : ""}`}>
                    <span className="asp-table__id">{formatSettlementId(item.engineerId, year, month)}</span>
                    <span className="asp-table__name-col">
                      <Avatar name={item.engineerName} size={28} />
                      <span className="asp-table__name">{item.engineerName} 기사</span>
                    </span>
                    <span className="asp-table__count">{item.completedCount}건</span>
                    <span className="asp-table__rating">
                      {item.avgRating != null ? `⭐ ${item.avgRating}` : "-"}
                    </span>
                    <span className="asp-table__net">
                      ₩{(item.totalEarning ?? 0).toLocaleString()}
                    </span>
                    <span>
                      <button
                        className={`asp-detail-btn ${isSelected ? "asp-detail-btn--active" : ""}`}
                        onClick={() => setSelectedItem(item)}
                      >
                        상세보기
                      </button>
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* 페이지네이션 */}
          <div className="asp-pagination">
            <div className="asp-pagination__left">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={14} /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
              {[1,2,3,4,5].map(p => (
                <button key={p} className={currentPage === p ? "asp-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <span className="asp-pagination__ellipsis">...</span>
              <button onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight size={14} /></button>
            </div>
            <div className="asp-page-size">10개씩 보기 <ChevronDown size={13} /></div>
          </div>

          <p className="asp-footnote">* 16번 API 응답 기준: engineerId, engineerName, completedCount, avgRating, totalEarning</p>
        </div>

        {/* 우측 상세 패널 - 16번 API 응답 기반 */}
        {selectedItem && (
          <aside className="asp-detail">
            <div className="asp-detail__header">
              <span className="asp-detail__title">정산 상세 정보</span>
              <div className="asp-detail__header-right">
                <button className="asp-detail__close" onClick={() => setSelectedItem(null)}><X size={16} /></button>
              </div>
            </div>

            <div className="asp-detail__body">
              <p className="asp-detail__id">{formatSettlementId(selectedItem.engineerId, year, month)}</p>

              {/* 기사 정보 */}
              <div className="asp-detail__profile">
                <Avatar name={selectedItem.engineerName} size={40} />
                <div>
                  <p className="asp-detail__profile-name">{selectedItem.engineerName} 기사</p>
                  <p className="asp-detail__profile-sub">ID: {selectedItem.engineerId}</p>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="asp-detail__section">
                <div className="asp-detail__row">
                  <span className="asp-detail__label">기준 연월</span>
                  <span className="asp-detail__value">{year}년 {month}월</span>
                </div>
                <div className="asp-detail__row">
                  <span className="asp-detail__label">완료 건수</span>
                  <span className="asp-detail__value">{selectedItem.completedCount}건</span>
                </div>
                <div className="asp-detail__row">
                  <span className="asp-detail__label">평균 평점</span>
                  <span className="asp-detail__value">
                    {selectedItem.avgRating != null ? `⭐ ${selectedItem.avgRating}` : "리뷰 없음"}
                  </span>
                </div>
              </div>

              {/* 금액 상세 */}
              <div className="asp-detail__section">
                <p className="asp-detail__section-label">금액 상세</p>
                <div className="asp-detail__amount-box">
                  <div className="asp-detail__amount-row asp-detail__amount-row--net">
                    <span>기사 실수령액</span>
                    <span className="asp-detail__net-amount">
                      ₩{(selectedItem.totalEarning ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="asp-detail__footer">
              <button className="asp-detail__footer-btn asp-detail__footer-btn--outline" onClick={handleDownload}>
                <Download size={13} /> CSV 다운로드
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}