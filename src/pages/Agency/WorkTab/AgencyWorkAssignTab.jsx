import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle, Clock, RefreshCw, XCircle, Calendar,
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, MoreVertical, RotateCcw,
} from "lucide-react";
import "../../../styles/Agency/WorkTab/AgencyWorkAssignTab.css";
import { ChangeEngineerModal, AssignDetailModal, ReassignModal } from "../../../pages/Agency/Modal/AssignModals";

// ──────────────────────────────────────────
// TODO: API 연동
// GET /api/agency/as-assignments?page=0&size=10&sort=assigned_at,desc
// as_assignments + as_requests + appliances + users(고객) + engineer_profiles JOIN
// 필터: region_id, engineer_id, status, assign_method, keyword, dateFrom, dateTo
// ──────────────────────────────────────────

// as_assignments.status ENUM 매핑
const ASSIGN_STATUS_MAP = {
  WAITING:   { label: "수락 대기",  type: "waiting"   },
  ACCEPTED:  { label: "배정 완료",  type: "accepted"  },
  REJECTED:  { label: "기사 거절",  type: "rejected"  },
  COMPLETED: { label: "배정 완료",  type: "completed" },
};

// 재배차 필요 여부 판단 (기사 거절 or 수락 대기 30분 이상 초과)
function needsReassign(item) {
  return item.assignStatus === "REJECTED" || item.overtimeMin >= 30;
}

function formatRequestId(requestId, createdAt) {
  const date = new Date(createdAt);
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `AS-${yy}${mm}${dd}-${String(requestId).padStart(4, "0")}`;
}


// ──────────────────────────────────────────
// TODO: API- 통계
// GET /api/agency/as-assignments/stats
// ──────────────────────────────────────────
const statCards = [
  { label: "배정 완료",   value: 18, today: "+5", icon: CheckCircle, color: "blue"   },
  { label: "수락 대기",   value: 7,  today: "+2", icon: Clock,       color: "orange" },
  { label: "재배차 필요", value: 2,  today: "+1", icon: RefreshCw,   color: "red"    },
  { label: "기사 거절",   value: 4,  today: "+0", icon: XCircle,     color: "gray"   },
  { label: "오늘 완료 예정", value: 11, today: "+3", icon: Calendar,  color: "green"  },
];

// ──────────────────────────────────────────
// TODO: API  - 배정 목록
// GET /api/agency/as-assignments
// ──────────────────────────────────────────
const assignList = [
  { requestId: 1, createdAt: "2024-06-18 09:35", customer: "김민지",  phone: "010-1234-5678", productName: "LG 디오스 냉장고",   modelNo: "M874GBB231",    type: "출장 A/S", engineerName: "김철수 기사", engineerImg: null, visitDate: "2024-06-20", startTime: "10:00", endTime: "12:00", assignStatus: "WAITING",   assignedAt: "2024-06-18 09:35", overtimeMin: 18 },
  { requestId: 2, createdAt: "2024-06-18 09:50", customer: "이영희",  phone: "010-2345-6789", productName: "삼성 그랑데 세탁기", modelNo: "WF21T6500KP",   type: "출장 A/S", engineerName: "박민수 기사", engineerImg: null, visitDate: "2024-06-20", startTime: "14:00", endTime: "16:00", assignStatus: "ACCEPTED",  assignedAt: "2024-06-18 09:50", overtimeMin: 0  },
  { requestId: 3, createdAt: "2024-06-18 10:10", customer: "박준호",  phone: "010-3456-7890", productName: "LG 휘센 에어컨",     modelNo: "FQ18HDWHRN",   type: "출장 A/S", engineerName: null,          engineerImg: null, visitDate: "2024-06-20", startTime: "16:00", endTime: "18:00", assignStatus: "REJECTED",  assignedAt: "2024-06-18 10:10", overtimeMin: 30 },
  { requestId: 4, createdAt: "2024-06-18 10:30", customer: "최서연",  phone: "010-4567-8901", productName: "삼성 QLED TV",       modelNo: "KQ55QC674FXKR", type: "설치/점검", engineerName: "이영호 기사", engineerImg: null, visitDate: "2024-06-21", startTime: "11:00", endTime: "13:00", assignStatus: "REJECTED",  assignedAt: "2024-06-18 10:30", overtimeMin: 0  },
  { requestId: 5, createdAt: "2024-06-18 11:05", customer: "정유진",  phone: "010-5678-9012", productName: "LG 식기세척기",      modelNo: "DFB22S",        type: "출장 A/S", engineerName: "최지현 기사", engineerImg: null, visitDate: "2024-06-21", startTime: "15:00", endTime: "17:00", assignStatus: "ACCEPTED",  assignedAt: "2024-06-18 11:05", overtimeMin: 0  },
  { requestId: 6, createdAt: "2024-06-18 11:30", customer: "이태훈",  phone: "010-6789-0123", productName: "위니아 김치냉장고",  modelNo: "WQ57DGK",       type: "출장 A/S", engineerName: "홍길동 기사", engineerImg: null, visitDate: "2024-06-22", startTime: "13:00", endTime: "15:00", assignStatus: "WAITING",   assignedAt: "2024-06-18 11:30", overtimeMin: 25 },
  { requestId: 7, createdAt: "2024-06-18 13:20", customer: "김수현",  phone: "010-8901-2345", productName: "삼성 에어드레서",    modelNo: "DF60A8500KG",   type: "출장 A/S", engineerName: null,          engineerImg: null, visitDate: "2024-06-22", startTime: "15:00", endTime: "17:00", assignStatus: "REJECTED",  assignedAt: "2024-06-18 13:20", overtimeMin: 30 },
];

// ──────────────────────────────────────────
// TODO: API - 추천 기사
// GET /api/agency/engineers/recommended?requestId=xxx
// engineer_profiles + engineer_service_regions + engineer_schedules JOIN
// is_lms_completed=1 필터 필수
// ──────────────────────────────────────────
const recommendedEngineers = [
  { id: 1, name: "김철수", brand: "LG 전문",   region: "강남구 · 2.1km", rating: 4.9, availableFrom: "오늘 13:00 이후 가능", profileImageUrl: null },
  { id: 2, name: "박민수", brand: "삼성 전문",  region: "송파구 · 3.4km", rating: 4.8, availableFrom: "오늘 14:00 이후 가능", profileImageUrl: null },
  { id: 3, name: "이영호", brand: "LG 전문",   region: "강남구 · 4.0km", rating: 4.7, availableFrom: "오늘 09:00 가능",      profileImageUrl: null },
];

// 재배차 알림 더미
const reassignAlerts = [
  { id: 3, type: "overtime", label: "수락 대기 초과", productName: "LG 휘센 에어컨", requestId: "AS-20240618-0003", overtime: "남은 시간 03:00" },
  { id: 7, type: "rejected", label: "재배차 필요",    productName: "삼성 에어드레서", requestId: "AS-20240618-0007", overtime: "배정 후 경과 32분" },
];

function EngineerAvatar({ name, profileImageUrl, size = 32 }) {
  return (
    <div className="awt-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {profileImageUrl
        ? <img src={profileImageUrl} alt={name} />
        : <span>{name?.charAt(0) ?? "?"}</span>
      }
    </div>
  );
}

export default function AgencyWorkAssignTab() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5;
  const [changeModal, setChangeModal]   = useState(null); // 변경 모달
  const [detailModal, setDetailModal]   = useState(null); // 상세 모달
  const [reassignModal, setReassignModal] = useState(null); // 재배정 모달
  const navigate = useNavigate(); // 재배차 알림 더보기

  return (
    <div className="awt">
      {/* 통계 카드 */}
      <div className="awt-stats">
        {statCards.map((s) => (
          <div key={s.label} className="awt-stat-card">
            <div className={`awt-stat-card__icon awt-stat-card__icon--${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="awt-stat-card__label">{s.label}</p>
              <p className="awt-stat-card__value">{s.value}<span>건</span></p>
              <p className="awt-stat-card__today">오늘 {s.today}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="awt-body">
        {/* 좌측: 테이블 */}
        <div className="awt-left">
          {/* 필터 */}
          <div className="awt-filters">
            <div className="awt-filter-date">
              <span>2024.06.01 ~ 2024.06.30</span>
              <Calendar size={14} color="#aaa" />
            </div>
            <div className="awt-filter-select"><span>전체 지역</span><ChevronDown size={13} /></div>
            <div className="awt-filter-select"><span>전체 기사</span><ChevronDown size={13} /></div>
            <div className="awt-filter-select"><span>전체 상태</span><ChevronDown size={13} /></div>
            <div className="awt-filter-select"><span>전체 보변도</span><ChevronDown size={13} /></div>
            <div className="awt-search">
              <Search size={13} color="#aaa" />
              <input type="text" placeholder="고객명, 제품명, 접수번호 검색" />
            </div>
            <button className="awt-reset-btn"><RotateCcw size={13} /> 초기화</button>
          </div>

          {/* 테이블 메타 */}
          <div className="awt-table-meta">
            <span className="awt-total">총 31건</span>
            <div className="awt-sort-select">최신순 <ChevronDown size={13} /></div>
          </div>

          {/* 테이블 */}
          <div className="awt-table">
            <div className="awt-table__header">
              <span className="awt-table__check"><input type="checkbox" /></span>
              <span>접수번호</span>
              <span>고객</span>
              <span>제품 정보</span>
              <span>담당 기사</span>
              <span>예약 일정</span>
              <span>상태</span>
              <span>배정 시간</span>
              <span>액션</span>
            </div>

            {assignList.map((item) => {
              const s = ASSIGN_STATUS_MAP[item.assignStatus] || { label: item.assignStatus, type: "waiting" };
              const displayId = formatRequestId(item.requestId, item.createdAt);
              const isReassign = needsReassign(item);

              return (
                <div key={item.requestId} className={`awt-table__row ${isReassign ? "awt-table__row--alert" : ""}`}>
                  <span className="awt-table__check"><input type="checkbox" /></span>
                  <span className="awt-table__id-col">
                    <span className="awt-table__id">{displayId}</span>
                    <span className="awt-table__type">{item.type}</span>
                  </span>
                  <span className="awt-table__customer-col">
                    <span className="awt-table__customer">{item.customer}</span>
                    <span className="awt-table__phone">{item.phone}</span>
                  </span>
                  <span className="awt-table__product-col">
                    <span className="awt-table__product-name">{item.productName}</span>
                    <span className="awt-table__model">{item.modelNo}</span>
                  </span>
                  <span className="awt-table__engineer-col">
                    {item.engineerName
                      ? <>
                          <EngineerAvatar name={item.engineerName} profileImageUrl={item.engineerImg} size={28} />
                          <div>
                            <span className="awt-table__engineer-name">{item.engineerName}</span>
                            <span className={`awt-engineer-sub awt-engineer-sub--${s.type}`}>{s.label}</span>
                          </div>
                        </>
                      : <span className="awt-table__no-engineer">-</span>
                    }
                  </span>
                  <span className="awt-table__visit-col">
                    <span>{item.visitDate.slice(5).replace("-", ".")} {item.startTime} ~ {item.endTime}</span>
                  </span>
                  <span>
                    <span className={`awt-badge awt-badge--${needsReassign(item) ? "reassign" : s.type}`}>
                      {needsReassign(item) ? "재배차 필요" : s.label}
                    </span>
                    {item.overtimeMin > 0 && !needsReassign(item) && (
                      <span className="awt-overtime">남은 시간 {item.overtimeMin}분</span>
                    )}
                    {needsReassign(item) && item.overtimeMin > 0 && (
                      <span className="awt-overtime">{item.overtimeMin}분 초과</span>
                    )}
                  </span>
                  <span className="awt-table__assigned-at">
                    {item.assignedAt?.slice(5, 16).replace("-", ".")}
                  </span>
                  <span className="awt-table__actions">
                    {item.assignStatus === "REJECTED" || item.overtimeMin >= 30
                      ? <button className="awt-reassign-btn" onClick={() => setReassignModal(item)}>재배정</button>
                      : item.assignStatus === "WAITING"
                        ? <button className="awt-change-btn" onClick={() => setChangeModal(item)}>변경</button>
                        : <button className="awt-detail-btn" onClick={() => setDetailModal(item)}>상세보기</button>
                    }
                    <button className="awt-more-btn"><MoreVertical size={14} /></button>
                  </span>
                </div>
              );
            })}
          </div>

          {/* 페이지네이션 */}
          <div className="awt-pagination">
            <div className="awt-pagination__left">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft size={14} /></button>
              <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}><ChevronLeft size={14} /></button>
              {[1,2,3,4,5].map(p => (
                <button key={p} className={currentPage === p ? "awt-pagination__active" : ""} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}><ChevronRight size={14} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight size={14} /></button>
            </div>
            <div className="awt-page-size">10개씩 보기 <ChevronDown size={13} /></div>
          </div>
        </div>

        {/* 우측 패널 */}
        <aside className="awt-right">
          {/* 재배차 알림 */}
          <div className="awt-panel">
            <div className="awt-panel__header">
              <h3 className="awt-panel__title">재배차 알림</h3>
             <button className="awt-more-link" onClick={() => navigate("/agency/reassign-alerts")}>
               더보기 ›
             </button>
            </div>
            {reassignAlerts.map((a) => (
              <div key={a.id} className={`awt-alert awt-alert--${a.type}`}>
                <div className="awt-alert__icon">
                  {a.type === "overtime" ? <Clock size={16} /> : <RefreshCw size={16} />}
                </div>
                <div className="awt-alert__info">
                  <p className="awt-alert__label">{a.label}</p>
                  <p className="awt-alert__product">{a.productName}</p>
                  <p className="awt-alert__id">{a.requestId}</p>
                </div>
                <div className="awt-alert__time">{a.overtime}</div>
              </div>
            ))}
          </div>

          {/* 추천 기사 */}
          <div className="awt-panel">
            <div className="awt-panel__header">
              <h3 className="awt-panel__title">추천 기사</h3>
              <button className="awt-more-link">더보기 ›</button>
            </div>
            {recommendedEngineers.map((e) => (
              <div key={e.id} className="awt-engineer-item">
                <EngineerAvatar name={e.name} profileImageUrl={e.profileImageUrl} size={36} />
                <div className="awt-engineer-item__info">
                  <p className="awt-engineer-item__name">{e.name} <span className="awt-engineer-item__rating">⭐ {e.rating}</span></p>
                  <p className="awt-engineer-item__brand">{e.brand} · {e.region}</p>
                  <p className="awt-engineer-item__avail">{e.availableFrom}</p>
                </div>
                <button className="awt-assign-btn">배정</button>
              </div>
            ))}
          </div>

          {/* 배정 처리 안내 */}
          <div className="awt-panel">
            <h3 className="awt-panel__title">배정 처리 안내</h3>
            <div className="awt-guide-item">
              <div className="awt-guide-icon awt-guide-icon--orange"><Clock size={13} /></div>
              <div>
                <p className="awt-guide-label">기사 수락 대기</p>
                <p className="awt-guide-desc">배정 후 30분 내 수락하지 않으면 자동 재배차됩니다.</p>
              </div>
            </div>
            <div className="awt-guide-item">
              <div className="awt-guide-icon awt-guide-icon--red"><RefreshCw size={13} /></div>
              <div>
                <p className="awt-guide-label">재배차 필요</p>
                <p className="awt-guide-desc">기사 거절 또는 미이수 시 재배차가 필요합니다.</p>
              </div>
            </div>
            <div className="awt-guide-item">
              <div className="awt-guide-icon awt-guide-icon--green"><CheckCircle size={13} /></div>
              <div>
                <p className="awt-guide-label">배정 완료</p>
                <p className="awt-guide-desc">기사가 수락하면 진행 모니터링에서 확인하세요.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* 모달 */}
      {changeModal   && <ChangeEngineerModal onClose={() => setChangeModal(null)}   item={changeModal} />}
      {detailModal   && <AssignDetailModal   onClose={() => setDetailModal(null)}   item={detailModal} />}
      {reassignModal && <ReassignModal       onClose={() => setReassignModal(null)} item={reassignModal} />}
    </div>
  );
}