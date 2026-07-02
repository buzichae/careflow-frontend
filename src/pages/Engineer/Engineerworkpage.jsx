import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Search, ChevronDown, ChevronRight, X,
  User, Phone, Calendar, Clock,
  MapPin, CheckCircle,
} from "lucide-react";
import {
  getEngineerAssignments,
  acceptAssignment,
  rejectAssignment,
  updateAssignmentStatus,
} from "../../apis/engineers"; // 실제 경로에 맞게 수정
import "../../styles/Engineer/Engineerworkpage.css";

const TAB_LABELS = {
  ALL: "전체",
  WAITING: "배정 대기",
  ACCEPTED: "진행 중",
  COMPLETED: "완료",
  REJECTED: "취소",
};

const WORK_STEPS = [
  { key: "WAITING",           label: "배정 대기", icon: "📋" },
  { key: "ENGINEER_DEPARTED", label: "출발",     icon: "🚗" },
  { key: "ENGINEER_ARRIVED",  label: "도착",     icon: "📍" },
  { key: "IN_PROGRESS",       label: "작업 중",  icon: "🔧" },
  { key: "COMPLETED",         label: "완료",     icon: "✅" },
];

const ASSIGN_STATUS_MAP = {
  WAITING:   { label: "배정 대기", type: "waiting"  },
  ACCEPTED:  { label: "진행 중",   type: "accepted" },
  REJECTED:  { label: "취소",     type: "rejected" },
  COMPLETED: { label: "완료",     type: "completed"},
};

const LOG_STATUS_MAP = {
  WAITING:           { label: "배정 대기", type: "waiting"   },
  ENGINEER_DEPARTED: { label: "출발",     type: "departed"  },
  ENGINEER_ARRIVED:  { label: "도착",     type: "arrived"   },
  IN_PROGRESS:       { label: "작업 중",  type: "progress"  },
  COMPLETED:         { label: "완료",     type: "completed" },
};

function ProductImg({ url, size = 52 }) {
  return (
    <div className="ewp-product-img" style={{ width: size, height: size }}>
      {url ? <img src={url} alt="제품" /> : <span>📦</span>}
    </div>
  );
}

function WorkSteps({ logStatus }) {
  const currentIdx = WORK_STEPS.findIndex((s) => s.key === logStatus);
  return (
    <div className="ewp-steps">
      {WORK_STEPS.map((step, i) => {
        const isDone = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step.key} className="ewp-step">
            <div className={`ewp-step__dot ${isDone ? "ewp-step__dot--done" : ""} ${isCurrent ? "ewp-step__dot--current" : ""}`}>
              <span>{step.icon}</span>
            </div>
            {i < WORK_STEPS.length - 1 && (
              <div className={`ewp-step__line ${i < currentIdx ? "ewp-step__line--done" : ""}`} />
            )}
            <p className={`ewp-step__label ${isCurrent ? "ewp-step__label--current" : ""}`}>{step.label}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function EngineerWorkPage() {
  const [activeTab, setActiveTab] = useState("ALL");
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workList, setWorkList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchList = useCallback(() => {
    setLoading(true);
    setError(null);

    getEngineerAssignments(activeTab)
      .then((res) => {
        const d = res.data;
        const list = (d.content ?? d.list ?? []).map((item) => ({
          ...item,
          isNew: item.new, // 백엔드가 boolean isNew를 "new"로 직렬화해서 내려줌
          visitTime: `${item.scheduledDate} ${item.scheduledTime}`, // 응답에 가공된 문자열이 없어서 직접 조합
        }));

        setWorkList(list);
        setTotalCount(d.totalElements ?? list.length);

        // 상세 패널: 라우터로 넘어온 assignmentId가 있으면 그걸 선택, 없으면 첫 항목
        const targetId = location.state?.assignmentId;
        const found = list.find((item) => item.assignmentId === targetId);
        setSelectedItem(found ?? list[0] ?? null);
      })
      .catch((err) => {
        console.error("작업 목록 조회 실패:", err);
        setError("작업 목록을 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, [activeTab, location.state]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleAccept = async (id) => {
    try {
      await acceptAssignment(id);
      fetchList();
    } catch (err) {
      console.error("수락 실패:", err);
      alert("수락 처리에 실패했습니다.");
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("거절 사유를 입력해주세요.");
    if (reason === null) return; // 취소
    if (!reason.trim()) {
      alert("거절 사유를 입력해주세요.");
      return;
    }
    try {
      await rejectAssignment(id, reason);
      fetchList();
    } catch (err) {
      console.error("거절 실패:", err);
      alert("거절 처리에 실패했습니다.");
    }
  };

  const tabs = Object.keys(TAB_LABELS).map((key) => ({
    key,
    label: TAB_LABELS[key],
  }));

  const handleChangeWorkStatus = async (requestId, nextStatus) => {
  try {
    await updateAssignmentStatus(requestId, nextStatus);
    fetchList(); // 최신 상태로 다시 조회
  } catch (err) {
    console.error("작업 상태 변경 실패:", err);
    alert("작업 상태 변경에 실패했습니다.");
  }
};

  return (
    <div className="ewp">
      <div className="ewp-header">
        <h1 className="ewp-header__title">작업 관리</h1>
        <p className="ewp-header__sub">배정된 작업을 확인하고 관리할 수 있습니다.</p>
      </div>

      <div className="ewp-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`ewp-tab ${activeTab === tab.key ? "ewp-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {/* ⚠ 백엔드가 탭별 카운트를 안 내려줘서, 현재 선택된 탭에서만 실제 카운트를 보여줍니다. */}
            {activeTab === tab.key && (
              <span className="ewp-tab__count ewp-tab__count--active">{totalCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="ewp-filters">
        <div className="ewp-search">
          <Search size={13} color="#aaa" />
          <input type="text" placeholder="고객명, 연락처, 모델명, 주소 검색" />
        </div>
        <div className="ewp-filter-select"><span>전체 상태</span><ChevronDown size={13} /></div>
        <div className="ewp-filter-select"><span>전체 지역</span><ChevronDown size={13} /></div>
        <div className="ewp-filter-select"><span>전체 날짜</span><ChevronDown size={13} /></div>
        <div className="ewp-filter-date"><span>2024.06.01 ~ 2024.06.30</span></div>
        <button className="ewp-schedule-btn" onClick={() => navigate("/engineer/my-schedule")}>
          📋 내 근무표 보기
        </button>
      </div>

      {loading && <p style={{ padding: "16px" }}>불러오는 중...</p>}
      {error && <p style={{ padding: "16px", color: "red" }}>{error}</p>}

      {!loading && !error && (
        <div className="ewp-body">
          <div className="ewp-left">
            <div className="ewp-summary">
              <p className="ewp-summary__title">상태 요약</p>
              {/* ⚠ 상태별 집계(counts) API가 없어서, 상태 요약 패널은 현재 탭 기준 총 건수만 표시합니다.
                  탭별 세부 카운트가 필요하면 백엔드에 집계 API 추가 요청이 필요해요. */}
              <div className="ewp-summary__row">
                <span className="ewp-summary__label ewp-summary__label--total">
                  {TAB_LABELS[activeTab]}
                </span>
                <span className="ewp-summary__count ewp-summary__count--total">{totalCount}</span>
              </div>

              {/* ⚠ 오늘의 실적(todayStats)도 이 API엔 없습니다. 표시가 필요하면 별도 API 확인 필요. */}
            </div>
          </div>

          <div className="ewp-center">
            <div className="ewp-list-header">
              <span className="ewp-list-count">작업 목록 ({workList.length})</span>
              <div className="ewp-sort-select">최신순 <ChevronDown size={13} /></div>
            </div>

            <div className="ewp-list">
              {workList.map((item) => {
                const aStatus = ASSIGN_STATUS_MAP[item.assignStatus];
                const lStatus = LOG_STATUS_MAP[item.logStatus];
                const isSelected = selectedItem?.assignmentId === item.assignmentId;

                return (
                  <div
                    key={item.assignmentId}
                    className={`ewp-card ${isSelected ? "ewp-card--selected" : ""} ${item.assignStatus === "WAITING" ? "ewp-card--new" : ""}`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <ProductImg url={item.productImageUrl} size={52} />
                    <div className="ewp-card__info">
                      <div className="ewp-card__badges">
                        <span className={`ewp-badge ewp-badge--${aStatus.type}`}>{aStatus.label}</span>
                        {item.isNew && <span className="ewp-badge ewp-badge--new">신규</span>}
                        {item.logStatus !== "WAITING" && (
                          <span className={`ewp-badge ewp-badge--log-${lStatus.type}`}>{lStatus.label}</span>
                        )}
                      </div>
                      <p className="ewp-card__product">{item.productName}</p>
                      <p className="ewp-card__customer">{item.customerName} 고객 · {item.customerPhone}</p>
                      <p className="ewp-card__address">{item.address}</p>
                    </div>
                    <div className="ewp-card__right">
                      <span className={`ewp-card__time ${item.assignStatus === "WAITING" ? "ewp-card__time--urgent" : ""}`}>
                        {item.visitTime}
                      </span>
                      {item.assignStatus === "WAITING" ? (
                        <div className="ewp-card__actions">
                          <button className="ewp-accept-btn" onClick={(e) => { e.stopPropagation(); handleAccept(item.assignmentId); }}>수락</button>
                          <button className="ewp-reject-btn" onClick={(e) => { e.stopPropagation(); handleReject(item.assignmentId); }}>거절</button>
                        </div>
                      ) : (
                        <ChevronRight size={16} color="#aaa" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedItem && (
            <aside className="ewp-detail">
              <div className="ewp-detail__header">
                <div className="ewp-detail__badges">
                  <span className={`ewp-badge ewp-badge--${ASSIGN_STATUS_MAP[selectedItem.assignStatus].type}`}>
                    {ASSIGN_STATUS_MAP[selectedItem.assignStatus].label}
                  </span>
                  {selectedItem.isNew && <span className="ewp-badge ewp-badge--new">신규</span>}
                </div>
                <button className="ewp-detail__close" onClick={() => setSelectedItem(null)}><X size={16} /></button>
              </div>

              <div className="ewp-detail__body">
                <div className="ewp-detail__product-row">
                  <ProductImg url={selectedItem.productImageUrl} size={48} />
                  <div>
                    <p className="ewp-detail__product">{selectedItem.productName}</p>
                    <p className="ewp-detail__request-id">{selectedItem.requestId}</p>
                  </div>
                </div>

                {selectedItem.assignStatus === "WAITING" && (
                  <div className="ewp-detail__action-btns">
                    <button className="ewp-detail__accept-btn" onClick={() => handleAccept(selectedItem.assignmentId)}>수락하기</button>
                    <button className="ewp-detail__reject-btn" onClick={() => handleReject(selectedItem.assignmentId)}>거절하기</button>
                  </div>
                )}

                <div className="ewp-detail__section">
                  <div className="ewp-detail__section-header">
                    <p className="ewp-detail__section-label">고객 정보</p>
                    <button className="ewp-detail__link">상세 보기</button>
                  </div>
                  <div className="ewp-detail__row"><User size={12} /><span>{selectedItem.customerName} 고객</span></div>
                  <div className="ewp-detail__row"><Phone size={12} /><span>{selectedItem.customerPhone}</span></div>
                  <div className="ewp-detail__row"><MapPin size={12} /><span>{selectedItem.address}</span></div>
                </div>

                <div className="ewp-detail__section">
                  <p className="ewp-detail__section-label">제품 정보</p>
                  <div className="ewp-detail__info-row"><span className="ewp-detail__info-label">모델명</span><span>{selectedItem.modelNo}</span></div>
                  <div className="ewp-detail__info-row"><span className="ewp-detail__info-label">구매일</span><span>{selectedItem.purchaseDate}</span></div>
                  <div className="ewp-detail__info-row"><span className="ewp-detail__info-label">보증기간</span><span>{selectedItem.warrantyEnd}</span></div>
                </div>

                <div className="ewp-detail__section">
                  <p className="ewp-detail__section-label">증상</p>
                  <p className="ewp-detail__symptom">{selectedItem.symptomDesc}</p>
                  {selectedItem.imageUrl && <img src={selectedItem.imageUrl} alt="증상 사진" className="ewp-detail__symptom-img" />}
                </div>

                <div className="ewp-detail__section">
                  <p className="ewp-detail__section-label">방문 일정</p>
                  <div className="ewp-detail__row"><Calendar size={12} /><span>{selectedItem.scheduledDate}</span></div>
                  <div className="ewp-detail__row"><Clock size={12} /><span>{selectedItem.scheduledTime}</span></div>
                </div>

                <div className="ewp-detail__section">
                  <p className="ewp-detail__section-label">예상 수리 비용</p>
                  <p className="erdp-parts-table__total">
                    {selectedItem.estimatedAvgCost != null
                      ? `약 ${selectedItem.estimatedAvgCost.toLocaleString()}원`
                      : "예상 비용 정보 없음"}
                  </p>
                </div>

                <div className="ewp-detail__section">
  <p className="ewp-detail__section-label">작업 진행 단계</p>
  <WorkSteps
    logStatus={
      selectedItem.assignStatus === "COMPLETED" ? "COMPLETED" : selectedItem.logStatus
    }
  />

  {selectedItem.assignStatus === "ACCEPTED" && (
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      {(() => {
        const currentIdx = WORK_STEPS.findIndex((s) => s.key === selectedItem.logStatus);
        const nextStep = WORK_STEPS[currentIdx + 1];
        if (!nextStep) return null;
        return (
          <button
            onClick={() => handleChangeWorkStatus(selectedItem.requestId, nextStep.key)}
            style={{
              flex: 1, padding: "10px", borderRadius: 8, border: "none",
              background: "#5B4FF5", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}
          >
            {nextStep.icon} {nextStep.label}(으)로 변경
          </button>
        );
      })()}
    </div>
  )}
</div>
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}