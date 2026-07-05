import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Search, Phone, Mail, MapPin, Clock, FileText,
  ChevronRight, SlidersHorizontal, ArrowLeft,
} from "lucide-react";
import { getEngineerCustomerDetail } from "../../apis/engineers"; // 실제 경로에 맞게 수정
import "../../styles/Engineer/Engineercustomerpage.css";

const AS_STATUS_TABS = ["전체", "진행 중", "완료", "취소"];

const AS_STATUS_MAP = {
  PENDING:         { label: "접수 대기", type: "pending"   },
  AGENCY_RECEIVED: { label: "접수",     type: "received"  },
  ASSIGNED:        { label: "배정 완료", type: "assigned"  },
  ACCEPTED:        { label: "진행 중",  type: "accepted"  },
  IN_PROGRESS:     { label: "진행 중",  type: "progress"  },
  COMPLETED:       { label: "완료",    type: "completed" },
  PAID:            { label: "정산 완료", type: "paid"      },
  CANCELLED:       { label: "취소",    type: "cancelled" },
};

const IN_PROGRESS_STATUSES = ["ACCEPTED", "IN_PROGRESS", "ASSIGNED"];
const DONE_STATUSES        = ["COMPLETED", "PAID"];

function Avatar({ name, size = 60 }) {
  return (
    <div className="ecp-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      <span>{name?.charAt(0)}</span>
    </div>
  );
}

function ApplianceImg({ imageUrl, size = 56 }) {
  return (
    <div className="ecp-appliance-img" style={{ width: size, height: size }}>
      {imageUrl ? <img src={imageUrl} alt="가전" /> : <span>📦</span>}
    </div>
  );
}

export default function EngineerCustomerPage() {
  const navigate = useNavigate();
  const { customerId } = useParams();

  const [asTab, setAsTab] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [c, setC] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getEngineerCustomerDetail(customerId)
      .then((res) => {
        if (mounted) setC(res.data);
      })
      .catch((err) => {
        console.error("고객 상세 조회 실패:", err);
        if (mounted) setError("고객 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [customerId]);

  if (loading) return <div className="ecp">불러오는 중...</div>;
  if (error || !c) return <div className="ecp">{error ?? "고객 정보를 찾을 수 없습니다."}</div>;

  const asHistory = c.asHistory ?? [];
  const appliances = c.appliances ?? [];
  // [확정] 백엔드 회신: memos는 DB에 대응 테이블이 없어 영구적으로 빈 배열로 내려옴
  // (고객 레벨의 상담 메모 개념 자체가 스키마에 없음 — 추후 추가 예정도 아님)
  const memos = c.memos ?? [];

  // region/addressDetail 조합 (address 단일 필드는 응답에 없음)
  const fullAddress = [c.region, c.addressDetail].filter(Boolean).join(" ");

  // [확정] 백엔드 회신: asHistory는 "수리 완료 + 보고서 작성까지 끝난 건"만 포함.
  // 진행 중인 건은 애초에 이 배열에 안 들어가고 inProgressWork로 별도 제공됨
  // (finalAmount, diagnosisResult 등은 완료 시점에만 존재하는 데이터라서 설계상 그럼).
  // → asHistory.length는 "완료 건수"로 써야 정확하고, "진행 중"은 inProgressWork
  //   존재 여부로 판단 (상세 API 특성상 진행 중 건은 최대 1건으로 간주).
  // ⚠ "총 A/S 건수"는 이 페이지의 asHistory+inProgressWork만으로는 취소/거절
  //   이력까지 포함한 완전한 값을 만들 수 없음 — 목록 API의 totalAsCount가
  //   더 정확하지만 이 상세 화면에는 그 값이 없어 근사치로 계산함.
  const doneAsCount       = asHistory.length; // asHistory는 정의상 전부 완료 건
  const inProgressAsCount = c.inProgressWork ? 1 : 0;
  const cancelledAsCount  = asHistory.filter(a => a.status === "CANCELLED").length;
  const totalAsCount      = doneAsCount + inProgressAsCount + cancelledAsCount;
  const totalPayment      = asHistory
    .filter(a => a.finalAmount != null)
    .reduce((sum, a) => sum + a.finalAmount, 0);

  const filteredAs = asTab === "전체"   ? asHistory
    : asTab === "진행 중" ? asHistory.filter(a => IN_PROGRESS_STATUSES.includes(a.status))
    : asTab === "완료"    ? asHistory.filter(a => DONE_STATUSES.includes(a.status))
    : asHistory.filter(a => a.status === "CANCELLED");

  return (
    <div className="ecp">
      <button className="ecp-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={15} />
        목록으로 돌아가기
      </button>

      <div className="ecp-header">
        <h1 className="ecp-header__title">고객 정보 조회</h1>
        <p className="ecp-header__sub">고객의 기본 정보, 가전 보유 현황, A/S 이력 및 진행 중인 작업을 확인할 수 있습니다.</p>
      </div>

      <div className="ecp-body">
        <div className="ecp-left">
          <div className="ecp-section">
            <h2 className="ecp-section__title">고객 기본 정보</h2>
            <div className="ecp-profile">
              <div className="ecp-profile__avatar-wrap">
                <Avatar name={c.name} size={64} />
              </div>
              <div className="ecp-profile__info">
                <div className="ecp-profile__name-row">
                  <span className="ecp-profile__name">{c.name} 고객님</span>
                  {/* [확정] 백엔드 회신: grade(고객 등급/tier)는 users 테이블에
                      대응 컬럼이 없어 영구적으로 null입니다. HealthCertificate의
                      grade(가전 건강등급 A~E)와 이름만 같을 뿐 다른 개념이라
                      혼용 금지. status는 User에 실제 존재하는 컬럼이므로
                      이 API가 나중에 내려줄 수 있어 조건부 렌더링 유지. */}
                  {c.grade && <span className="ecp-grade-badge">{c.grade}</span>}
                  {c.status && (
                    <span className={`ecp-status-badge ecp-status-badge--${c.status?.toLowerCase()}`}>
                      {c.status === "ACTIVE" ? "활성" : "비활성"}
                    </span>
                  )}
                </div>
                <p className="ecp-profile__id">고객ID &nbsp; {c.customerId}</p>
              </div>
            </div>

            <div className="ecp-info-list">
              <div className="ecp-info-row"><Phone size={13} color="#aaa" /><span className="ecp-info-label">연락처</span><span className="ecp-info-value">{c.phone || "-"}</span></div>
              <div className="ecp-info-row"><Mail size={13} color="#aaa" /><span className="ecp-info-label">이메일</span><span className="ecp-info-value">{c.email || "-"}</span></div>
              <div className="ecp-info-row"><MapPin size={13} color="#aaa" /><span className="ecp-info-label">주소</span><span className="ecp-info-value">{fullAddress || "-"}</span></div>
              <div className="ecp-info-row"><Clock size={13} color="#aaa" /><span className="ecp-info-label">회원가입일</span><span className="ecp-info-value">{c.joinedAt || "-"}</span></div>
              {/* [확정] 백엔드 회신: preferredContactTime, memo는 users 테이블에
                  대응 컬럼이 없어 영구적으로 빈 값입니다 (추후 추가 예정 아님).
                  memo 개념 자체는 WorkReport/AsStatusLog에만 존재하고
                  고객(User) 레벨엔 스키마상 존재하지 않습니다. */}
              <div className="ecp-info-row"><Clock size={13} color="#aaa" /><span className="ecp-info-label">선호 연락 시간</span><span className="ecp-info-value">{c.preferredContactTime || "-"}</span></div>
              <div className="ecp-info-row"><FileText size={13} color="#aaa" /><span className="ecp-info-label">메모</span><span className="ecp-info-value">{c.memo || "-"}</span></div>
            </div>

            <div className="ecp-as-stats">
              <div className="ecp-as-stat"><p className="ecp-as-stat__label">총 A/S 건수</p><p className="ecp-as-stat__value">{totalAsCount}건</p></div>
              <div className="ecp-as-stat"><p className="ecp-as-stat__label">완료 건수</p><p className="ecp-as-stat__value">{doneAsCount}건</p></div>
              <div className="ecp-as-stat"><p className="ecp-as-stat__label">진행 중</p><p className="ecp-as-stat__value">{inProgressAsCount}건</p></div>
              <div className="ecp-as-stat"><p className="ecp-as-stat__label">취소/거절</p><p className="ecp-as-stat__value">{cancelledAsCount}건</p></div>
              <div className="ecp-as-stat"><p className="ecp-as-stat__label">총 결제 금액</p><p className="ecp-as-stat__value ecp-as-stat__value--amount">{totalPayment.toLocaleString()}원</p></div>
            </div>
          </div>

          <div className="ecp-section">
            <h2 className="ecp-section__title">A/S 이력</h2>
            <div className="ecp-as-tabs">
              {AS_STATUS_TABS.map(tab => (
                <button
                  key={tab}
                  className={`ecp-as-tab ${asTab === tab ? "ecp-as-tab--active" : ""}`}
                  onClick={() => setAsTab(tab)}
                >
                  {tab}{" "}
                  {tab === "전체" ? `(${totalAsCount})` : tab === "진행 중" ? `(${inProgressAsCount})` : tab === "완료" ? `(${doneAsCount})` : `(${cancelledAsCount})`}
                </button>
              ))}
            </div>

            <div className="ecp-as-table">
              <div className="ecp-as-table__header">
                <span>접수번호</span><span>접수일</span><span>제품명</span><span>증상</span>
                <span>상태</span><span>방문일</span><span>최종 결제금액</span><span></span>
              </div>
              {filteredAs.map(a => {
                const s = AS_STATUS_MAP[a.status] ?? { label: a.status, type: "pending" };
                return (
                  <div key={a.requestId} className="ecp-as-table__row">
                    <span className="ecp-as-table__id">{a.requestId}</span>
                    <span>{a.createdAt}</span>
                    <span>{a.productName}</span>
                    <span>{a.symptom}</span>
                    <span><span className={`ecp-as-badge ecp-as-badge--${s.type}`}>{s.label}</span></span>
                    <span>{a.visitDate}</span>
                    <span className="ecp-as-table__amount">{a.finalAmount ? `${a.finalAmount.toLocaleString()}원` : "-"}</span>
                    <span><ChevronRight size={14} color="#aaa" /></span>
                  </div>
                );
              })}
              {filteredAs.length === 0 && (
                <p style={{ padding: 20, textAlign: "center", color: "#aaa", fontSize: 13 }}>
                  {/* [확정] 백엔드 회신: asHistory는 완료(보고서 작성 완료)된 건만
                      포함하도록 설계됨. "진행 중"/"취소" 탭은 이 배열에 해당
                      데이터가 원래 없어서 항상 비어있는 게 정상 — 진행 중인 작업은
                      위쪽 "진행 중인 작업" 패널에서 확인 가능. */}
                  {asTab === "진행 중"
                    ? "진행 중인 작업은 위의 \"진행 중인 작업\" 패널에서 확인해주세요."
                    : asTab === "취소"
                      ? "취소/거절 이력은 현재 이 화면에서 제공되지 않습니다."
                      : "A/S 이력이 없습니다."}
                </p>
              )}
            </div>
            <button className="ecp-more-btn">전체 A/S 이력 보기 <ChevronRight size={13} /></button>
          </div>
        </div>

        <aside className="ecp-right">
          <div className="ecp-panel">
            <div className="ecp-panel__header">
              <h3 className="ecp-panel__title">보유 가전 목록 ({appliances.length})</h3>
              <button className="ecp-panel__link">전체 보기</button>
            </div>
            {/* [수정] 실제 응답의 appliance 항목엔 applianceId/brand/modelName/categoryName만
                있고, modelNo/purchaseDate/status/imageUrl/registeredAt은 없음.
                없는 필드를 억지로 참조하지 않고, 있는 정보(브랜드/모델명/카테고리)만 표시.
                구매일·상태·등록일이 필요하면 백엔드에 필드 추가 요청이 필요합니다. */}
            <div className="ecp-appliance-list">
              {appliances.map(a => (
                <div key={a.applianceId} className="ecp-appliance-item">
                  <ApplianceImg imageUrl={a.imageUrl} size={56} />
                  <div className="ecp-appliance-item__info">
                    <p className="ecp-appliance-item__name">{a.brand} {a.modelName}</p>
                    <p className="ecp-appliance-item__model">카테고리 &nbsp; {a.categoryName ?? "-"}</p>
                  </div>
                </div>
              ))}
              {appliances.length === 0 && (
                <p style={{ padding: 12, textAlign: "center", color: "#aaa", fontSize: 12 }}>
                  등록된 가전이 없습니다.
                </p>
              )}
            </div>
          </div>

          <div className="ecp-panel">
            <h3 className="ecp-panel__title">진행 중인 작업</h3>
            {/* [연동] PR로 inProgressWork가 객체로 확장됨:
                { requestId, productName, symptom, visitDate, progressStatus, status }
                기존 inProgressRequestId(숫자만)는 더 이상 안 씀. */}
            {c.inProgressWork ? (
              <div className="ecp-inprogress-card">
                <div className="ecp-inprogress-card__header">
                  <span className="ecp-inprogress-card__id">{c.inProgressWork.requestId}</span>
                  <span className={`ecp-as-badge ecp-as-badge--${AS_STATUS_MAP[c.inProgressWork.status]?.type ?? "pending"}`}>
                    {AS_STATUS_MAP[c.inProgressWork.status]?.label ?? c.inProgressWork.status}
                  </span>
                </div>
                <div className="ecp-inprogress-card__body">
                  <ApplianceImg imageUrl={null} size={44} />
                  <div>
                    <p className="ecp-inprogress-card__product">{c.inProgressWork.productName}</p>
                    <p className="ecp-inprogress-card__symptom">{c.inProgressWork.symptom}</p>
                  </div>
                </div>
                <div className="ecp-inprogress-card__detail">
                  <div className="ecp-inprogress-card__row">
                    <Clock size={12} color="#aaa" />
                    <span className="ecp-inprogress-card__label">방문 예정일</span>
                    <span>{c.inProgressWork.visitDate ?? "-"}</span>
                  </div>
                  <div className="ecp-inprogress-card__row">
                    <ChevronRight size={12} color="#aaa" />
                    <span className="ecp-inprogress-card__label">진행 상태</span>
                    <span>{c.inProgressWork.progressStatus ?? "-"}</span>
                  </div>
                </div>
                <button
                  className="ecp-inprogress-card__btn"
                  onClick={() => navigate("/engineer/work")}
                >
                  작업 관리에서 보기 <ChevronRight size={13} />
                </button>
              </div>
            ) : (
              <p style={{ padding: 12, textAlign: "center", color: "#aaa", fontSize: 12 }}>
                진행 중인 작업이 없습니다.
              </p>
            )}
          </div>

          <div className="ecp-panel">
            <div className="ecp-panel__header">
              <h3 className="ecp-panel__title">최근 상담/메모</h3>
              <button className="ecp-panel__link">전체 보기 <ChevronRight size={12} /></button>
            </div>
            {/* [확정] 백엔드 회신: memos는 DB에 대응 테이블이 없어 영구적으로
                빈 배열입니다. 고객 레벨 상담 메모 기능 자체가 스키마에 없어
                추후에도 채워질 가능성이 없습니다 (기능 자체를 없애는 것도 검토 가능). */}
            <div className="ecp-memo-list">
              {memos.map((m, i) => (
                <div key={i} className="ecp-memo-item">
                  <p className="ecp-memo-item__date">{m.date}</p>
                  <p className="ecp-memo-item__content">{m.content}</p>
                </div>
              ))}
              {memos.length === 0 && (
                <p style={{ padding: 12, textAlign: "center", color: "#aaa", fontSize: 12 }}>
                  등록된 메모가 없습니다.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}