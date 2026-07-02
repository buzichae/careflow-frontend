import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Search, Phone, Mail, MapPin, Clock, FileText,
  ChevronRight, SlidersHorizontal, ArrowLeft,
} from "lucide-react";
import { getEngineerCustomerDetail } from "../../apis/engineers"; // 실제 경로에 맞게 수정
import "../../styles/Engineer/Engineercustomerpage.css";

const APPLIANCE_STATUS_MAP = {
  NORMAL:      { label: "정상",     type: "normal"      },
  NEED_REPAIR: { label: "수리 필요", type: "need-repair" },
  SOLD:        { label: "판매됨",   type: "sold"        },
};

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
  const memos = c.memos ?? [];

  const filteredAs = asTab === "전체"   ? asHistory
    : asTab === "진행 중" ? asHistory.filter(a => ["ACCEPTED", "IN_PROGRESS", "ASSIGNED"].includes(a.status))
    : asTab === "완료"    ? asHistory.filter(a => ["COMPLETED", "PAID"].includes(a.status))
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

      <div className="ecp-search-bar">
        <div className="ecp-search">
          <Search size={15} color="#aaa" />
          <input
            type="text"
            placeholder="이름, 연락처, 주소, 고객ID로 검색하세요."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="ecp-adv-search-btn">
          <SlidersHorizontal size={14} /> 상세 검색
        </button>
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
                  <span className="ecp-grade-badge">{c.grade}</span>
                  <span className={`ecp-status-badge ecp-status-badge--${c.status?.toLowerCase()}`}>
                    {c.status === "ACTIVE" ? "활성" : "비활성"}
                  </span>
                </div>
                <p className="ecp-profile__id">고객ID &nbsp; {c.customerId}</p>
              </div>
            </div>

            <div className="ecp-info-list">
              <div className="ecp-info-row"><Phone size={13} color="#aaa" /><span className="ecp-info-label">연락처</span><span className="ecp-info-value">{c.phone}</span></div>
              <div className="ecp-info-row"><Mail size={13} color="#aaa" /><span className="ecp-info-label">이메일</span><span className="ecp-info-value">{c.email}</span></div>
              <div className="ecp-info-row"><MapPin size={13} color="#aaa" /><span className="ecp-info-label">주소</span><span className="ecp-info-value">{c.address}</span></div>
              <div className="ecp-info-row"><Clock size={13} color="#aaa" /><span className="ecp-info-label">회원가입일</span><span className="ecp-info-value">{c.joinedAt}</span></div>
              <div className="ecp-info-row"><Clock size={13} color="#aaa" /><span className="ecp-info-label">선호 연락 시간</span><span className="ecp-info-value">{c.preferredContactTime}</span></div>
              <div className="ecp-info-row"><FileText size={13} color="#aaa" /><span className="ecp-info-label">메모</span><span className="ecp-info-value">{c.memo}</span></div>
            </div>

            <div className="ecp-as-stats">
              <div className="ecp-as-stat"><p className="ecp-as-stat__label">총 A/S 건수</p><p className="ecp-as-stat__value">{c.totalAs ?? 0}건</p></div>
              <div className="ecp-as-stat"><p className="ecp-as-stat__label">완료 건수</p><p className="ecp-as-stat__value">{c.doneAs ?? 0}건</p></div>
              <div className="ecp-as-stat"><p className="ecp-as-stat__label">진행 중</p><p className="ecp-as-stat__value">{c.inProgressAs ?? 0}건</p></div>
              <div className="ecp-as-stat"><p className="ecp-as-stat__label">취소/거절</p><p className="ecp-as-stat__value">{c.cancelledAs ?? 0}건</p></div>
              <div className="ecp-as-stat"><p className="ecp-as-stat__label">총 결제 금액</p><p className="ecp-as-stat__value ecp-as-stat__value--amount">{(c.totalPayment ?? 0).toLocaleString()}원</p></div>
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
                  {tab === "전체" ? `(${c.totalAs ?? 0})` : tab === "진행 중" ? `(${c.inProgressAs ?? 0})` : tab === "완료" ? `(${c.doneAs ?? 0})` : `(${c.cancelledAs ?? 0})`}
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
            <div className="ecp-appliance-list">
              {appliances.map(a => {
                const s = APPLIANCE_STATUS_MAP[a.status] ?? { label: a.status, type: "normal" };
                return (
                  <div key={a.applianceId} className="ecp-appliance-item">
                    <ApplianceImg imageUrl={a.imageUrl} size={56} />
                    <div className="ecp-appliance-item__info">
                      <p className="ecp-appliance-item__name">{a.brand} {a.modelName}</p>
                      <p className="ecp-appliance-item__model">모델명 &nbsp; {a.modelNo}</p>
                      <p className="ecp-appliance-item__purchase">구매일 &nbsp; {a.purchaseDate}</p>
                    </div>
                    <div className="ecp-appliance-item__right">
                      <span className={`ecp-appliance-badge ecp-appliance-badge--${s.type}`}>{s.label}</span>
                      <p className="ecp-appliance-item__registered">제품 등록일<br />{a.registeredAt}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ecp-panel">
            <h3 className="ecp-panel__title">진행 중인 작업</h3>
            {c.inProgressWork && (
              <div className="ecp-inprogress-card">
                <div className="ecp-inprogress-card__header">
                  <span className="ecp-inprogress-card__id">{c.inProgressWork.requestId}</span>
                  <span className={`ecp-as-badge ecp-as-badge--${AS_STATUS_MAP[c.inProgressWork.status]?.type}`}>
                    {AS_STATUS_MAP[c.inProgressWork.status]?.label}
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
                    <span>{c.inProgressWork.visitDate}</span>
                  </div>
                  <div className="ecp-inprogress-card__row">
                    <ChevronRight size={12} color="#aaa" />
                    <span className="ecp-inprogress-card__label">진행 상태</span>
                    <span>{c.inProgressWork.progressStatus}</span>
                  </div>
                </div>
                <button className="ecp-inprogress-card__btn">상세 보기 <ChevronRight size={13} /></button>
              </div>
            )}
          </div>

          <div className="ecp-panel">
            <div className="ecp-panel__header">
              <h3 className="ecp-panel__title">최근 상담/메모</h3>
              <button className="ecp-panel__link">전체 보기 <ChevronRight size={12} /></button>
            </div>
            <div className="ecp-memo-list">
              {memos.map((m, i) => (
                <div key={i} className="ecp-memo-item">
                  <p className="ecp-memo-item__date">{m.date}</p>
                  <p className="ecp-memo-item__content">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}