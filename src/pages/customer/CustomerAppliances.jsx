import { useState } from "react";
import { Bell, MessageSquare, ChevronDown, Plus, CalendarCheck } from "lucide-react";
import "../../styles/CustomerAppliances.css";

const ALL_APPLIANCES = [
  { id: 1, name: "냉장고", brand: "LG 디오스 냉장고", model: "M870SN75", usagePeriod: "2년 3개월", score: 95, status: "정상", certified: true },
  { id: 2, name: "세탁기", brand: "삼성 그랑데 세탁기", model: "WF21A9500KV", usagePeriod: "1년 8개월", score: 72, status: "주의", certified: false },
  { id: 3, name: "에어컨", brand: "LG 휘센 에어컨", model: "FQ17H9DWA1", usagePeriod: "3년 1개월", score: 88, status: "정상", certified: true },
  { id: 4, name: "TV", brand: "삼성 QLED TV", model: "KQ65QC67AFXKR", usagePeriod: "2년 6개월", score: 90, status: "정상", certified: true },
  { id: 5, name: "공기청정기", brand: "삼성 블루스카이", model: "AX60R5580WBD", usagePeriod: "1년 2개월", score: 85, status: "정상", certified: true },
  { id: 6, name: "로봇청소기", brand: "LG 코드제로 R9", model: "R958GA", usagePeriod: "2년 9개월", score: 45, status: "점검 필요", certified: false },
  { id: 7, name: "건조기", brand: "삼성 그랑대 건조기", model: "DV17T9720SV", usagePeriod: "1년 4개월", score: 78, status: "정상", certified: true },
  { id: 8, name: "가습기", brand: "사오미 스마트 가습기", model: "MJJSQ05DY", usagePeriod: "6개월", score: 92, status: "정상", certified: true },
];

const TABS = [
  { key: "전체", label: "전체", count: 7 },
  { key: "정상", label: "정상", count: 5 },
  { key: "주의", label: "주의", count: 1 },
  { key: "점검 필요", label: "점검 필요", count: 1 },
];

const STATUS_COLOR = {
  "정상": "green",
  "주의": "orange",
  "점검 필요": "red",
};

const SCORE_COLOR = {
  "정상": "#734bcf",
  "주의": "#f59e0b",
  "점검 필요": "#ef4444",
};

export default function CustomerAppliances() {
  const [activeTab, setActiveTab] = useState("전체");

  const filtered = activeTab === "전체"
    ? ALL_APPLIANCES
    : ALL_APPLIANCES.filter((a) => a.status === activeTab);

  return (
    <div className="ca-wrap">
      {/* 헤더 */}
      <header className="ca-header">
        <div className="ca-header__left">
          <h1>내 가전</h1>
          <p>보유하고 있는 가전제품을 한눈에 확인하고 관리하세요.</p>
        </div>
        <div className="ca-header__right">
          <button className="ca-icon-btn"><Bell size={20} /></button>
          <button className="ca-icon-btn"><MessageSquare size={20} /></button>
          <div className="ca-profile">
            <div className="ca-avatar">혜</div>
            <span>혜민님</span>
            <ChevronDown size={16} />
          </div>
        </div>
      </header>

      {/* 탭 + 정렬 */}
      <div className="ca-toolbar">
        <div className="ca-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`ca-tab ${activeTab === t.key ? "ca-tab--active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
        <div className="ca-sort">
          <span>등록순</span>
          <ChevronDown size={14} />
        </div>
      </div>

      {/* 가전 그리드 */}
      <div className="ca-grid">
        {filtered.map((a) => (
          <div key={a.id} className="ca-card">
            <div className="ca-card__top">
              <div className="ca-card__img" />
              <div className="ca-card__badges">
                {a.certified && (
                  <span className="ca-cert-badge">careflow<br />인증</span>
                )}
                <span className={`ca-status-badge ca-status-badge--${STATUS_COLOR[a.status]}`}>
                  {a.status === "정상" ? "😊" : a.status === "주의" ? "⚠️" : "🔴"} {a.status}
                </span>
              </div>
            </div>
            <p className="ca-card__name">{a.name}</p>
            <p className="ca-card__brand">{a.brand}</p>
            <p className="ca-card__model">{a.model}</p>
            <p className="ca-card__period">사용 기간 · {a.usagePeriod}</p>
            <div className="ca-score-row">
              <span className="ca-score-num">{a.score}점</span>
              <div className="ca-score-bar">
                <div
                  className="ca-score-bar__fill"
                  style={{ width: `${a.score}%`, background: SCORE_COLOR[a.status] }}
                />
              </div>
            </div>
            <div className="ca-card__actions">
              <button className="ca-btn-detail">상세 및 이력 보기</button>
              <button className="ca-btn-check"><CalendarCheck size={13} /> 점검 예약</button>
            </div>
          </div>
        ))}

        {/* 가전 등록 카드 */}
        <div className="ca-card ca-card--add">
          <div className="ca-add-icon"><Plus size={28} strokeWidth={1.5} /></div>
          <p className="ca-add-label">가전 등록하기</p>
          <p className="ca-add-sub">새로운 가전을 등록하고 관리하세요.</p>
        </div>
      </div>

      {/* 하단 배너 */}
      <div className="ca-banner">
        <div className="ca-banner__text">
          <p>새로운 가전을 등록하고</p>
          <p><strong>더 스마트한 관리를 시작해보세요!</strong></p>
        </div>
        <button className="ca-banner__btn">+ 가전 등록하기</button>
      </div>
    </div>
  );
}
