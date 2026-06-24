import { useState } from "react";
import {
  Wallet, CheckCircle, Clock, Lock, FileText,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, RefreshCw, X, Download, Building2,
} from "lucide-react";
import "../../styles/Agency/Agencysettlementpage.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/agency/settlements?page=0&size=10
// settlements + payments + as_requests + users(기사) + agencies JOIN
// 응답 필드:
//   settlementId, type (ENGINEER/AGENCY)
//   engineerName, engineerId (users), engineerPhone
//   agencyName, agencyId (agencies)
//   periodStart, periodEnd (기준 기간)
//   completedCount (완료 건수)
//   grossAmount (settlements.gross_amount)
//   platformFee (settlements.platform_fee)
//   agencyFeeRate, agencyFee (settlements.agency_fee_rate, agency_fee)
//   engineerNetAmount (settlements.engineer_net_amount)
//   status (payments.status → READY/SUCCESS/FAILED/CANCELLED/REFUNDED)
//   settledAt (payments.paid_at)
// ──────────────────────────────────────────

const SETTLEMENT_TABS = ["전체", "지급 대기", "지급 완료", "보류", "취소"];

const STATUS_MAP = {
  SUCCESS:   { label: "지급 완료", type: "success"  },
  READY:     { label: "지급 대기", type: "ready"    },
  FAILED:    { label: "보류",     type: "hold"     },
  CANCELLED: { label: "취소",     type: "cancel"   },
};

const TYPE_MAP = {
  ENGINEER: { label: "기사",  type: "engineer" },
};

// 정산 ID 포맷
function formatSettlementId(id) {
  return `ST-20240618-${String(id).padStart(4, "0")}`;
}

const statCards = [
  { label: "총 정산 금액 (이번 달)", value: "₩125,680,000", sub: "전월 대비 +12.5%",  subType: "up",      icon: Wallet,       color: "purple" },
  { label: "지급 완료 금액",         value: "₩98,420,000",  sub: "78.3%",             subType: "neutral", icon: CheckCircle,  color: "green"  },
  { label: "지급 대기 금액",         value: "₩22,380,000",  sub: "17.8%",             subType: "neutral", icon: Clock,        color: "orange" },
  { label: "보류 금액",              value: "₩4,880,000",   sub: "3.9%",              subType: "neutral", icon: Lock,         color: "red"    },
  { label: "정산 건수 (이번 달)",    value: "1,248건",       sub: "전월 대비 +105건",  subType: "up",      icon: FileText,     color: "blue"   },
];

// ──────────────────────────────────────────
// TODO: API 연동 - 정산 목록
// settlements + payments + users + agencies JOIN
// ──────────────────────────────────────────
const settlementList = [
  { id: 1,  type: "ENGINEER", name: "김현수 기사",   subId: "ENG-00123", phone: "010-1234-5678", agencyName: "퀵케어 서비스", agencyId: "AG-00001", period: "2024.06.01 ~ 2024.06.15", count: 28, grossAmount: 2480000, platformFeeRate: 10, platformFee: 248000, agencyFeeRate: 10, agencyFee: 248000, netAmount: 1984000, status: "SUCCESS",   settledAt: "2024.06.18", payMethod: "계좌 이체", bankAccount: "신한은행 110-123-456789" },
  { id: 2,  type: "ENGINEER", name: "박민수 기사",   subId: "ENG-00124", phone: "010-2345-6789", agencyName: "퀵케어 서비스", agencyId: "AG-00001", period: "2024.06.01 ~ 2024.06.15", count: 24, grossAmount: 2120000, platformFeeRate: 10, platformFee: 212000, agencyFeeRate: 12, agencyFee: 254400, netAmount: 1653600, status: "SUCCESS",   settledAt: "2024.06.18", payMethod: "계좌 이체", bankAccount: "국민은행 123-456-789012" },
  { id: 3,  type: "ENGINEER", name: "이정호 기사",   subId: "ENG-00125", phone: "010-3456-7890", agencyName: "퀵케어 서비스", agencyId: "AG-00001", period: "2024.06.01 ~ 2024.06.15", count: 31, grossAmount: 3310000, platformFeeRate: 10, platformFee: 331000, agencyFeeRate: 11, agencyFee: 364100, netAmount: 2614900, status: "READY",     settledAt: null,         payMethod: "계좌 이체", bankAccount: "하나은행 234-567-890123" },
  { id: 5,  type: "ENGINEER", name: "최재민 기사",   subId: "ENG-00126", phone: "010-4567-8901", agencyName: "퀵케어 서비스", agencyId: "AG-00001", period: "2024.06.01 ~ 2024.06.15", count: 19, grossAmount: 1680000, platformFeeRate: 10, platformFee: 168000, agencyFeeRate: 9,  agencyFee: 151200, netAmount: 1360800, status: "READY",     settledAt: null,         payMethod: "계좌 이체", bankAccount: "우리은행 456-789-012345" },
  { id: 7,  type: "ENGINEER", name: "정우진 기사",   subId: "ENG-00127", phone: "010-5678-9012", agencyName: "퀵케어 서비스", agencyId: "AG-00001", period: "2024.06.01 ~ 2024.06.15", count: 15, grossAmount: 1050000, platformFeeRate: 10, platformFee: 105000, agencyFeeRate: 9,  agencyFee: 94500,  netAmount: 850500,  status: "FAILED",    settledAt: null,         payMethod: "계좌 이체", bankAccount: "카카오뱅크 678-901-234567" },
  { id: 9,  type: "ENGINEER", name: "이재훈 기사",   subId: "ENG-00130", phone: "010-8901-2345", agencyName: "퀵케어 서비스", agencyId: "AG-00001", period: "2024.06.01 ~ 2024.06.15", count: 22, grossAmount: 1890000, platformFeeRate: 10, platformFee: 189000, agencyFeeRate: 12, agencyFee: 226800, netAmount: 1474200, status: "CANCELLED", settledAt: null,         payMethod: "계좌 이체", bankAccount: "하나은행 890-123-456789" },
];

function Avatar({ name, size = 32 }) {
  return (
    <div className="asp-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      <span>{name?.charAt(0)}</span>
    </div>
  );
}

export default function AgencySettlementPage() {
  const [activeTab, setActiveTab] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const totalPages = 25;

  const selectedStatus = selectedItem ? STATUS_MAP[selectedItem.status] : null;
  const selectedType = selectedItem ? TYPE_MAP[selectedItem.type] : null;

  return (
    <div className="asp">
      {/* 헤더 */}
      <div className="asp-header">
        <div>
          <h1 className="asp-header__title">정산 관리</h1>
          <p className="asp-header__sub">기사 및 대행사별 정산 내역을 조회하고 정산 상태를 관리할 수 있습니다.</p>
        </div>
        <div className="asp-refresh-bar">
          <span className="asp-refresh-label">자동 갱신</span>
          <div className={`asp-toggle ${autoRefresh ? "asp-toggle--on" : ""}`} onClick={() => setAutoRefresh(p => !p)}>
            <div className="asp-toggle__thumb" />
          </div>
          <div className="asp-refresh-select">30초 <ChevronDown size={13} /></div>
        </div>
      </div>

      {/* 통계 카드 */}
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
        <div className="asp-filter-date">
          <span>2024.06.01 ~ 2024.06.18</span>
        </div>
        <div className="asp-filter-select"><span>전체 유형</span><ChevronDown size={13} /></div>
        <div className="asp-filter-select"><span>전체 상태</span><ChevronDown size={13} /></div>
        <div className="asp-filter-select"><span>2024년 6월</span><ChevronDown size={13} /></div>
        <div className="asp-search">
          <Search size={13} color="#aaa" />
          <input type="text" placeholder="대행사/기사명, 정산 ID 검색" />
        </div>
        <button className="asp-reset-btn"><RefreshCw size={13} /> 필터 초기화</button>
        <button className="asp-excel-btn"><Download size={13} /> 엑셀 다운로드</button>
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

          {/* 테이블 */}
          <div className="asp-table">
            <div className="asp-table__header">
              <span>정산 ID</span>
              <span>유형</span>
              <span>대행사 / 기사</span>
              <span>기준 기간</span>
              <span>건수</span>
              <span>총 정산 금액</span>
              <span>CareFlow 수수료 (10%)</span>
              <span>대행사 수수료</span>
              <span>실 지급액</span>
              <span>상태</span>
              <span>정산일</span>
              <span>관리</span>
            </div>

            {settlementList.map((item) => {
              const status = STATUS_MAP[item.status];
              const type = TYPE_MAP[item.type];
              const isSelected = selectedItem?.id === item.id;
              return (
                <div key={item.id} className={`asp-table__row ${isSelected ? "asp-table__row--selected" : ""}`}>
                  <span className="asp-table__id">{formatSettlementId(item.id)}</span>
                  <span>
                    <span className={`asp-type-badge asp-type-badge--${type.type}`}>{type.label}</span>
                  </span>
                  <span className="asp-table__name-col">
                    <span className="asp-table__name">{item.name}</span>
                    <span className="asp-table__sub-id">{item.subId}</span>
                  </span>
                  <span className="asp-table__period">{item.period}</span>
                  <span className="asp-table__count">{item.count}건</span>
                  <span className="asp-table__amount">₩{item.grossAmount.toLocaleString()}</span>
                  <span className="asp-table__fee">
                    ₩{item.platformFee.toLocaleString()}<br/>
                    <span className="asp-table__fee-rate">({item.platformFeeRate}%)</span>
                  </span>
                  <span className="asp-table__fee">
                    {item.agencyFee ? `₩${item.agencyFee.toLocaleString()}` : "-"}<br/>
                    <span className="asp-table__fee-rate">({item.agencyFeeRate}%)</span>
                  </span>
                  <span className="asp-table__net">
                    {item.netAmount ? `₩${item.netAmount.toLocaleString()}` : "-"}
                  </span>
                  <span>
                    <span className={`asp-status-badge asp-status-badge--${status.type}`}>{status.label}</span>
                  </span>
                  <span className="asp-table__settled-at">{item.settledAt ?? "-"}</span>
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
            })}
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
              <button className={currentPage === 25 ? "asp-pagination__active" : ""} onClick={() => setCurrentPage(25)}>25</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight size={14} /></button>
            </div>
            <div className="asp-page-size">10개씩 보기 <ChevronDown size={13} /></div>
          </div>

          <p className="asp-footnote">* 실 지급액은 기사의 경우만 표시됩니다.</p>
        </div>

        {/* 우측 상세 패널 */}
        {selectedItem && (
          <aside className="asp-detail">
            <div className="asp-detail__header">
              <span className="asp-detail__title">정산 상세 정보</span>
              <div className="asp-detail__header-right">
                <span className={`asp-type-badge asp-type-badge--${selectedType?.type}`}>{selectedType?.label}</span>
                <span className={`asp-status-badge asp-status-badge--${selectedStatus?.type}`}>{selectedStatus?.label}</span>
                <button className="asp-detail__close" onClick={() => setSelectedItem(null)}><X size={16} /></button>
              </div>
            </div>

            <div className="asp-detail__body">
              {/* 정산 ID */}
              <p className="asp-detail__id">{formatSettlementId(selectedItem.id)}</p>

              {/* 기사/대행사 정보 */}
              <div className="asp-detail__profile">
                {selectedItem.type === "ENGINEER"
                  ? <Avatar name={selectedItem.name} size={40} />
                  : <div className="asp-detail__agency-icon"><Building2 size={20} /></div>
                }
                <div>
                  <p className="asp-detail__profile-name">{selectedItem.name}</p>
                  <p className="asp-detail__profile-sub">{selectedItem.subId}</p>
                  {selectedItem.phone && <p className="asp-detail__profile-phone">{selectedItem.phone}</p>}
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="asp-detail__section">
                <div className="asp-detail__row"><span className="asp-detail__label">기준 기간</span><span className="asp-detail__value">{selectedItem.period}</span></div>
                <div className="asp-detail__row"><span className="asp-detail__label">정산일</span><span className="asp-detail__value">{selectedItem.settledAt ?? "-"}</span></div>
                <div className="asp-detail__row"><span className="asp-detail__label">완료 건수</span><span className="asp-detail__value">{selectedItem.count}건</span></div>
                <div className="asp-detail__row"><span className="asp-detail__label">총 정산 금액</span><span className="asp-detail__value asp-detail__value--amount">₩{selectedItem.grossAmount.toLocaleString()}</span></div>
              </div>

              {/* 금액 상세 */}
              <div className="asp-detail__section">
                <p className="asp-detail__section-label">금액 상세</p>
                <div className="asp-detail__amount-box">
                  <div className="asp-detail__amount-row">
                    <span>총 정산 금액</span>
                    <span>₩{selectedItem.grossAmount.toLocaleString()}</span>
                  </div>
                  <div className="asp-detail__amount-row asp-detail__amount-row--fee">
                    <span>CareFlow 수수료 ({selectedItem.platformFeeRate}%)</span>
                    <span>-₩{selectedItem.platformFee.toLocaleString()}</span>
                  </div>
                  <div className="asp-detail__amount-row asp-detail__amount-row--fee">
                    <span>대행사 수수료 ({selectedItem.agencyFeeRate}%)</span>
                    <span>-₩{selectedItem.agencyFee?.toLocaleString() ?? "-"}</span>
                  </div>
                  <div className="asp-detail__amount-divider" />
                  <div className="asp-detail__amount-row asp-detail__amount-row--net">
                    <span>실 지급액</span>
                    <span className="asp-detail__net-amount">
                      {selectedItem.netAmount ? `₩${selectedItem.netAmount.toLocaleString()}` : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 연결된 대행사 (기사 정산인 경우) */}
              {selectedItem.type === "ENGINEER" && (
                <div className="asp-detail__section">
                  <p className="asp-detail__section-label">연결된 대행사</p>
                  <div className="asp-detail__agency-card">
                    <div className="asp-detail__agency-icon--sm"><Building2 size={14} /></div>
                    <div>
                      <p className="asp-detail__agency-name">{selectedItem.agencyName} ({selectedItem.agencyId})</p>
                      <p className="asp-detail__agency-rate">수수료율 {selectedItem.agencyFeeRate}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 지급 정보 */}
              <div className="asp-detail__section">
                <p className="asp-detail__section-label">지급 정보</p>
                <div className="asp-detail__row"><span className="asp-detail__label">지급 방식</span><span className="asp-detail__value">{selectedItem.payMethod}</span></div>
                <div className="asp-detail__row"><span className="asp-detail__label">지급 계좌</span><span className="asp-detail__value">{selectedItem.bankAccount}</span></div>
                <div className="asp-detail__row"><span className="asp-detail__label">지급 상태</span><span className={`asp-status-badge asp-status-badge--${selectedStatus?.type}`}>{selectedStatus?.label}</span></div>
                {selectedItem.settledAt && (
                  <div className="asp-detail__row"><span className="asp-detail__label">지급일</span><span className="asp-detail__value">{selectedItem.settledAt}</span></div>
                )}
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="asp-detail__footer">
              <button className="asp-detail__footer-btn asp-detail__footer-btn--outline">
                <Download size={13} /> 정산 내역 다운로드
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}