import { useState } from "react";
import { Bell, Settings, Search, Trash2, Star, ChevronRight, ChevronLeft, ChevronDown, RefreshCw, Shield, Wrench, Megaphone, X } from "lucide-react";
import "../../styles/Customer/CustomerNotice.css";

/* ─── 데이터 ─── */
const CATEGORY_STATS = [
  { key: "전체",   label: "전체",         count: 128, unread: 15, Icon: Bell     },
  { key: "소모품", label: "소모품 교체",  count: 32,  unread: 5,  Icon: RefreshCw },
  { key: "무상AS", label: "무상 A/S 만료",count: 18,  unread: 3,  Icon: Shield   },
  { key: "AS단계", label: "A/S 단계 변경",count: 45,  unread: 4,  Icon: Wrench   },
  { key: "시스템", label: "시스템/공지",  count: 33,  unread: 3,  Icon: Megaphone },
];

const ICON_MAP = {
  "소모품": { emoji: "🔑", color: "#f59e0b", bg: "#fff7e6" },
  "무상AS":  { emoji: "🛡",  color: "#734bcf", bg: "#f0edff" },
  "AS단계":  { emoji: "💬", color: "#3b82f6", bg: "#eff6ff" },
  "시스템":  { emoji: "📢", color: "#6b7280", bg: "#f3f4f6" },
};

const NOTIFICATIONS = [
  {
    id: 1, category: "소모품", starred: true, read: false,
    title: "냉장고 필터 교체 주기가 도래했습니다.",
    subject: "LG 오브제 냉장고 (M875GB8231) · 김민지 고객",
    tag: "소모품 교체 주기", tagSub: "필터",
    time: "2024.06.18 09:30",
  },
  {
    id: 2, category: "무상AS", starred: false, read: false,
    title: "무상 A/S 기간이 7일 후 종료됩니다.",
    subject: "LG 오브제 냉장고 (M875GB8231) · 이영희 고객",
    tag: "무상 A/S 기간 종료", tagSub: "종료 예정: 2024.06.24",
    time: "2024.06.17 14:20",
  },
  {
    id: 3, category: "AS단계", starred: true, read: false,
    title: "A/S 진행 단계가 변경되었습니다.",
    subject: "접수번호: AS-240601-0001 · 김민지 고객",
    tag: "A/S 단계 변경", tagSub: "접수 → 수리중",
    time: "2024.06.17 11:05",
  },
  {
    id: 4, category: "AS단계", starred: false, read: true,
    title: "A/S 진행 단계가 변경되었습니다.",
    subject: "접수번호: AS-240601-0002 · 이영희 고객",
    tag: "A/S 단계 변경", tagSub: "수리중 → 수리완료",
    time: "2024.06.17 10:15",
  },
  {
    id: 5, category: "소모품", starred: false, read: true,
    title: "에어컨 필터 교체 주기가 도래했습니다.",
    subject: "LG 휘센 에어컨 (FQ18H9KWA2) · 박준호 고객",
    tag: "소모품 교체 주기", tagSub: "필터",
    time: "2024.06.16 16:40",
  },
  {
    id: 6, category: "시스템", starred: false, read: true,
    title: "시스템 점검 안내",
    subject: "CareFlow 시스템 점검이 예정되어 있습니다.",
    tag: "시스템/공지", tagSub: "서비스 점검",
    time: "2024.06.16 09:00",
  },
  {
    id: 7, category: "무상AS", starred: false, read: true,
    title: "무상 A/S 기간이 오늘 종료됩니다.",
    subject: "LG 오브제 냉장고 (M875GB8231) · 최지연 고객",
    tag: "무상 A/S 기간 종료", tagSub: "종료일: 2024.06.18",
    time: "2024.06.15 08:30",
  },
];

const TAG_COLOR = {
  "소모품 교체 주기":   { color: "#f59e0b", bg: "#fff7e6" },
  "무상 A/S 기간 종료": { color: "#734bcf", bg: "#f0edff" },
  "A/S 단계 변경":      { color: "#3b82f6", bg: "#eff6ff" },
  "시스템/공지":        { color: "#6b7280", bg: "#f3f4f6" },
};



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

  const filtered = NOTIFICATIONS.filter((n) => {
    if (activeCategory !== "전체" && n.category !== activeCategory) return false;
    if (activeTab === "안읽음") return !n.read;
    if (activeTab === "즐겨찾기") return n.starred;
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
        {CATEGORY_STATS.map(({ key, label, count, unread, Icon }) => (
          <button
            key={key}
            className={`cn-kpi${activeCategory === key ? " cn-kpi--active" : ""}${unread > 0 ? " cn-kpi--has-unread" : ""}`}
            onClick={() => setActiveCategory(key)}
          >
            <div className="cn-kpi__text">
              <p className="cn-kpi__value">{count}<span>건</span></p>
              <p className="cn-kpi__label">{label}</p>
              <p className="cn-kpi__unread">읽지 않음 {unread}건</p>
            </div>
            <Icon className="cn-kpi__watermark" strokeWidth={1} />
          </button>
        ))}
      </div>

      {/* 서브 탭 + 툴바 */}
      <div className="cn-toolbar">
        <div className="cn-subtabs">
          {["전체", "안읽음", "즐겨찾기"].map((t) => (
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
          const icon = ICON_MAP[n.category];
          const tagStyle = TAG_COLOR[n.tag] || {};
          return (
            <div key={n.id} className={`cn-row ${!n.read ? "cn-row--unread" : ""}`}>
              <span className="cn-col-check"><input type="checkbox" /></span>
              <span className="cn-col-content">
                <span className="cn-row__icon" style={{ background: icon?.bg, color: icon?.color }}>
                  {icon?.emoji}
                </span>
                <span className="cn-row__text">
                  <span className="cn-row__title">
                    {n.title}
                    {n.starred && <Star size={12} fill="#f59e0b" color="#f59e0b" style={{ marginLeft: 4 }} />}
                  </span>
                  <span className="cn-row__subject">{n.subject}</span>
                </span>
              </span>
              <span className="cn-col-target">
                <span className="cn-tag" style={{ background: tagStyle.bg, color: tagStyle.color }}>{n.tag}</span>
                <span className="cn-tag-sub">{n.tagSub}</span>
              </span>
              <span className="cn-col-time">{n.time}</span>
              <span className="cn-col-status">
                <span className={`cn-status ${n.read ? "cn-status--read" : "cn-status--unread"}`}>
                  {n.read ? "읽음" : "안읽음"}
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
