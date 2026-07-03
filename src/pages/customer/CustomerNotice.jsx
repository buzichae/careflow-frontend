import { useState } from "react";
import { Bell, Settings, Search, Trash2, ChevronRight, ChevronLeft, ChevronDown, RefreshCw, Shield, Wrench, X } from "lucide-react";
import "../../styles/Customer/CustomerNotice.css";

/* ─── 타입 메타 (DB enum 기준) ─── */
const TYPE_META = {
  AS_STATUS:  { label: "A/S 단계 변경",  color: "#3b82f6", bg: "#eff6ff", Icon: Wrench    },
  CONSUMABLE: { label: "소모품 교체",     color: "#f59e0b", bg: "#fff7e6", Icon: RefreshCw },
  WARRANTY:   { label: "무상 A/S 만료",  color: "#734bcf", bg: "#f0edff", Icon: Shield    },
};

const KPI_KEYS = [
  { key: "전체",      typeKey: null,        label: "전체",          Icon: Bell      },
  { key: "AS_STATUS", typeKey: "AS_STATUS",  label: "A/S 단계 변경", Icon: Wrench    },
  { key: "CONSUMABLE",typeKey: "CONSUMABLE", label: "소모품 교체",   Icon: RefreshCw },
  { key: "WARRANTY",  typeKey: "WARRANTY",   label: "무상 A/S 만료", Icon: Shield    },
];

/* ─── 임시 mock (API 연결 전) ─── */
const MOCK_STATS = {
  total:      { count: 95, unreadCount: 12 },
  AS_STATUS:  { count: 45, unreadCount: 4  },
  CONSUMABLE: { count: 32, unreadCount: 5  },
  WARRANTY:   { count: 18, unreadCount: 3  },
};

const MOCK_NOTIFICATIONS = [
  {
    notificationId: 1, type: "CONSUMABLE", isRead: false,
    title: "냉장고 필터 교체 주기가 도래했습니다.",
    body: "LG 오브제 냉장고 (M875GB8231)",
    tagDetail: "필터",
    createdAt: "2024-06-18T09:30:00",
  },
  {
    notificationId: 2, type: "WARRANTY", isRead: false,
    title: "무상 A/S 기간이 7일 후 종료됩니다.",
    body: "LG 오브제 냉장고 (M875GB8231)",
    tagDetail: "종료 예정: 2024.06.24",
    createdAt: "2024-06-17T14:20:00",
  },
  {
    notificationId: 3, type: "AS_STATUS", isRead: false,
    title: "A/S 진행 단계가 변경되었습니다.",
    body: "접수번호: AS-240601-0001",
    tagDetail: "접수 → 수리중",
    createdAt: "2024-06-17T11:05:00",
  },
  {
    notificationId: 4, type: "AS_STATUS", isRead: true,
    title: "A/S 진행 단계가 변경되었습니다.",
    body: "접수번호: AS-240601-0002",
    tagDetail: "수리중 → 수리완료",
    createdAt: "2024-06-17T10:15:00",
  },
  {
    notificationId: 5, type: "CONSUMABLE", isRead: true,
    title: "에어컨 필터 교체 주기가 도래했습니다.",
    body: "LG 휘센 에어컨 (FQ18H9KWA2)",
    tagDetail: "필터",
    createdAt: "2024-06-16T16:40:00",
  },
  {
    notificationId: 7, type: "WARRANTY", isRead: true,
    title: "무상 A/S 기간이 오늘 종료됩니다.",
    body: "LG 오브제 냉장고 (M875GB8231)",
    tagDetail: "종료일: 2024.06.18",
    createdAt: "2024-06-15T08:30:00",
  },
];

function fmtDate(str) {
  if (!str) return "—";
  return str.slice(0, 16).replace("T", " ");
}

/* ─── 알림 설정 모달 ─── */
function SettingsModal({ toggles, onToggle, onClose }) {
  const ITEMS = [
    { key: "consume",   label: "소모품 교체 주기 알림", desc: "필터, 부품 등 교체 주기 도래 시" },
    { key: "freeas",    label: "무상 A/S 기간 알림",    desc: "무상 A/S 만료 도래 알림" },
    { key: "asstep",    label: "A/S 단계 변경 알림",    desc: "접수, 진단, 수리 등 단계 변경 시" },
    { key: "marketing", label: "마케팅 / 이벤트 알림",  desc: "이벤트 및 프로모션 알림" },
  ];
  return (
    <div className="cn-modal-overlay" onClick={onClose}>
      <div className="cn-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cn-modal__header">
          <div className="cn-modal__header-left">
            <Settings size={17} color="#734bcf" />
            <h2 className="cn-modal__title">알림 설정</h2>
          </div>
          <button className="cn-modal__close" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="cn-modal__body">
          {ITEMS.map((item) => (
            <div key={item.key} className="cn-toggle-row">
              <div>
                <p className="cn-toggle-label">{item.label}</p>
                <p className="cn-toggle-desc">{item.desc}</p>
              </div>
              <button
                className={`cn-toggle ${toggles[item.key] ? "cn-toggle--on" : ""}`}
                onClick={() => onToggle(item.key)}
              >
                <span className="cn-toggle__thumb" />
              </button>
            </div>
          ))}
        </div>
        <div className="cn-modal__footer">
          <button className="cn-modal__btn cn-modal__btn--primary" onClick={onClose}>저장</button>
        </div>
      </div>
    </div>
  );
}

/* ─── 메인 ─── */
export default function CustomerNotice() {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [activeTab, setActiveTab]           = useState("전체");
  const [toggles, setToggles]               = useState({ consume: true, freeas: true, asstep: true, marketing: true });
  const [page, setPage]                     = useState(1);
  const [showSettings, setShowSettings]     = useState(false);

  // TODO: API 연결 시 아래 두 줄을 실제 fetch 결과로 교체
  const stats = MOCK_STATS;
  const notifications = MOCK_NOTIFICATIONS;

  const filtered = notifications.filter((n) => {
    if (activeCategory !== "전체" && n.type !== activeCategory) return false;
    if (activeTab === "안읽음") return !n.isRead;
    return true;
  });

  const toggleSwitch = (key) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="cn-wrap">
      {showSettings && (
        <SettingsModal toggles={toggles} onToggle={toggleSwitch} onClose={() => setShowSettings(false)} />
      )}

      {/* 카테고리 KPI 탭 */}
      <div className="cn-kpi-grid">
        {KPI_KEYS.map(({ key, typeKey, label, Icon }) => {
          const stat = typeKey ? stats[typeKey] : stats.total;
          return (
            <button
              key={key}
              className={`cn-kpi${activeCategory === key ? " cn-kpi--active" : ""}${(stat?.unreadCount ?? 0) > 0 ? " cn-kpi--has-unread" : ""}`}
              onClick={() => setActiveCategory(key)}
            >
              <div className="cn-kpi__text">
                <p className="cn-kpi__value">{stat?.count ?? 0}<span>건</span></p>
                <p className="cn-kpi__label">{label}</p>
                <p className="cn-kpi__unread">읽지 않음 {stat?.unreadCount ?? 0}건</p>
              </div>
              <Icon className="cn-kpi__watermark" strokeWidth={1} />
            </button>
          );
        })}
      </div>

      {/* 서브 탭 + 툴바 */}
      <div className="cn-toolbar">
        <div className="cn-subtabs">
          {["전체", "안읽음"].map((t) => (
            <button
              key={t}
              className={`cn-subtab ${activeTab === t ? "cn-subtab--active" : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="cn-toolbar__right">
          <div className="cn-search">
            <Search size={14} />
            <input placeholder="알림 제목, 내용 검색" />
          </div>
          <div className="cn-period">
            <span>전체 기간</span>
            <ChevronDown size={13} />
          </div>
          <button className="cn-delete-btn">
            <Trash2 size={13} /> 읽은 알림 삭제
          </button>
          <button className="cn-settings-open-btn" onClick={() => setShowSettings(true)}>
            <Settings size={14} /> 알림 설정
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="cn-table">
        <div className="cn-table__head">
          <span className="cn-col-check"><input type="checkbox" /></span>
          <span className="cn-col-content">알림 내용</span>
          <span className="cn-col-target">관련 대상</span>
          <span className="cn-col-time">알림 시간 ↑</span>
          <span className="cn-col-status">상태</span>
          <span className="cn-col-more" />
        </div>
        {filtered.map((n) => {
          const meta = TYPE_META[n.type] ?? { label: n.type, color: "#aaa", bg: "#f5f5f5", Icon: Bell };
          const { Icon: TypeIcon } = meta;
          return (
            <div key={n.notificationId} className={`cn-row ${!n.isRead ? "cn-row--unread" : ""}`}>
              <span className="cn-col-check"><input type="checkbox" /></span>
              <span className="cn-col-content">
                <span className="cn-row__icon" style={{ background: meta.bg, color: meta.color }}>
                  <TypeIcon size={14} />
                </span>
                <span className="cn-row__text">
                  <span className="cn-row__title">{n.title}</span>
                  <span className="cn-row__subject">{n.body}</span>
                </span>
              </span>
              <span className="cn-col-target">
                <span className="cn-tag" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                <span className="cn-tag-sub">{n.tagDetail}</span>
              </span>
              <span className="cn-col-time">{fmtDate(n.createdAt)}</span>
              <span className="cn-col-status">
                <span className={`cn-status ${n.isRead ? "cn-status--read" : "cn-status--unread"}`}>
                  {n.isRead ? "읽음" : "안읽음"}
                </span>
              </span>
              <span className="cn-col-more">⋯</span>
            </div>
          );
        })}
      </div>

      {/* 페이지네이션 */}
      <div className="cn-pagination">
        <button className="cn-page-btn"><ChevronLeft size={14} /></button>
        {[1, 2, 3, 4, 5].map((p) => (
          <button
            key={p}
            className={`cn-page-btn ${page === p ? "cn-page-btn--active" : ""}`}
            onClick={() => setPage(p)}
          >
            {p}
          </button>
        ))}
        <span className="cn-page-ellipsis">…</span>
        <button className="cn-page-btn">13</button>
        <button className="cn-page-btn"><ChevronRight size={14} /></button>
      </div>
    </div>
  );
}
