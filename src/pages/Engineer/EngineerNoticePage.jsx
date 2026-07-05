import { useState, useEffect, useCallback } from "react";
import {
  Bell, Truck, GraduationCap, ShieldCheck, Wrench,
  Search, ChevronLeft, ChevronRight, MoreVertical, CheckCheck,
} from "lucide-react";
import "../../styles/Engineer/EngineerNoticePage.css";
import {
  getMyNotifications,
  getNotificationSummary,
  markNotificationRead,
  markNotificationsRead,
  markAllNotificationsRead,
} from "../../apis/engineersNotifications";

const TAB_DEFS = [
  { key: "ALL",        label: "전체"    },
  { key: "AS_STATUS",  label: "작업/배정" },
  { key: "LMS",        label: "교육"    },
  { key: "CONSUMABLE", label: "소모품"  },
  { key: "WARRANTY",   label: "무상기간" },
];

const TYPE_MAP = {
  AS_STATUS:  { label: "작업/배정", icon: Truck,         color: "purple", bg: "#eeeaff" },
  LMS:        { label: "교육",     icon: GraduationCap, color: "green",  bg: "#eaf3de" },
  CONSUMABLE: { label: "소모품",   icon: Wrench,        color: "orange", bg: "#fef0e0" },
  WARRANTY:   { label: "무상기간", icon: ShieldCheck,   color: "blue",   bg: "#e6f1fb" },
};

const STAT_COLOR_MAP = {
  ALL: "purple", AS_STATUS: "blue", LMS: "green", CONSUMABLE: "orange", WARRANTY: "teal",
};

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function NotifIcon({ type }) {
  const t = TYPE_MAP[type];
  const Icon = t.icon;
  return (
    <div className="enp-notif-icon" style={{ background: t.bg }}>
      <Icon size={16} color={`var(--enp-${t.color})`} />
    </div>
  );
}

export default function EngineerNoticePage() {
  const [activeTab, setActiveTab]     = useState("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [list, setList]               = useState([]);
  const [summary, setSummary]         = useState({});
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [marking, setMarking]         = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getNotificationSummary();
      setSummary(res.data);
    } catch (e) {
      console.error("알림 요약 조회 실패", e);
    }
  }, []);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyNotifications({ type: activeTab, page: currentPage, size: 10 });
      setList(res.data.content ?? []);
      setTotalPages(res.data.totalPages ?? 1);
      setSelectedIds(new Set());
    } catch (e) {
      setError("알림을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchList(); }, [fetchList]);

  function handleTabChange(key) {
    setActiveTab(key);
    setCurrentPage(0);
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === list.length ? new Set() : new Set(list.map((n) => n.id))
    );
  }

  async function handleOpenNotification(item) {
    if (item.isRead) return;
    setList((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
    try {
      await markNotificationRead(item.id);
      fetchSummary();
    } catch (e) {
      console.error("읽음 처리 실패", e);
      setList((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: false } : n)));
    }
  }

  async function handleMarkSelectedRead() {
    if (selectedIds.size === 0) return;
    setMarking(true);
    try {
      await markNotificationsRead(Array.from(selectedIds));
      await Promise.all([fetchList(), fetchSummary()]);
    } catch (e) {
      console.error("선택 항목 읽음 처리 실패", e);
      alert("선택한 알림을 읽음 처리하지 못했습니다.");
    } finally {
      setMarking(false);
    }
  }

  async function handleMarkAllRead() {
    setMarking(true);
    try {
      await markAllNotificationsRead();
      await Promise.all([fetchList(), fetchSummary()]);
    } catch (e) {
      console.error("모두 읽음 처리 실패", e);
      alert("모두 읽음 처리에 실패했습니다.");
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="enp">
      <div className="enp-header">
        <h1 className="enp-header__title">알림</h1>
        <p className="enp-header__sub">작업 배정, 일정, 공지 등 중요한 알림을 확인하세요.</p>
      </div>

      <div className="enp-stats">
        {TAB_DEFS.map((s) => {
          const Icon = s.key === "ALL" ? Bell : TYPE_MAP[s.key].icon;
          return (
            <div key={s.key} className="enp-stat-card" onClick={() => handleTabChange(s.key)}>
              <div className="enp-stat-card__text">
                <p className="enp-stat-card__value">{summary[s.key] ?? 0}<span>건</span></p>
                <p className="enp-stat-card__label">{s.label}</p>
              </div>
              <div className={`enp-stat-card__icon enp-stat-card__icon--${STAT_COLOR_MAP[s.key]}`}>
                <Icon size={40} strokeWidth={1} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="enp-tab-bar">
        <div className="enp-tabs">
          {TAB_DEFS.map((tab) => (
            <button
              key={tab.key}
              className={`enp-tab ${activeTab === tab.key ? "enp-tab--active" : ""}`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
              <span className={`enp-tab__count ${activeTab === tab.key ? "enp-tab__count--active" : ""}`}>
                {summary[tab.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="enp-tab-actions">
          <div className="enp-search">
            <Search size={13} color="#aaa" />
            <input type="text" placeholder="알림 제목 검색" disabled />
          </div>
          {selectedIds.size > 0 && (
            <button className="enp-read-all-btn" onClick={handleMarkSelectedRead} disabled={marking}>
              <CheckCheck size={13} /> 선택 항목 읽음 처리 ({selectedIds.size})
            </button>
          )}
          <button className="enp-read-all-btn" onClick={handleMarkAllRead} disabled={marking}>
            <CheckCheck size={13} /> 모두 읽음 처리
          </button>
        </div>
      </div>

      <div className="enp-table">
        <div className="enp-table__header">
          <span>
            <input
              type="checkbox"
              checked={list.length > 0 && selectedIds.size === list.length}
              onChange={toggleSelectAll}
            />
          </span>
          <span>알림 내용</span>
          <span>유형</span>
          <span>채널</span>
          <span>시간</span>
          <span></span>
        </div>

        {loading && <p style={{ padding: 24, textAlign: "center", color: "#aaa" }}>불러오는 중...</p>}
        {error   && <p style={{ padding: 24, textAlign: "center", color: "red" }}>{error}</p>}

        {!loading && !error && list.map((item) => {
          const typeInfo = TYPE_MAP[item.type];
          const isRead = !!item.isRead;
          return (
            <div
              key={item.id}
              className="enp-table__row"
              onClick={() => handleOpenNotification(item)}
              style={{
                cursor: "pointer",
                background: isRead ? undefined : "#f8f7ff",
              }}
            >
              <span onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                />
              </span>
              <span className="enp-table__content-col">
                <NotifIcon type={item.type} />
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  {!isRead && (
                    <span
                      style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#5B4FF5", marginTop: 6, flexShrink: 0,
                      }}
                    />
                  )}
                  <div>
                    <p
                      className="enp-table__title"
                      style={{ fontWeight: isRead ? 400 : 700, color: isRead ? "#888" : undefined }}
                    >
                      {item.title}
                    </p>
                    <p
                      className="enp-table__body"
                      style={{ color: isRead ? "#bbb" : undefined }}
                    >
                      {item.body}
                    </p>
                  </div>
                </div>
              </span>
              <span>
                <span className={`enp-type-badge enp-type-badge--${typeInfo.color}`}>{typeInfo.label}</span>
              </span>
              <span className="enp-table__channel">{item.channel}</span>
              <span className="enp-table__time">{formatDate(item.createdAt)}</span>
              <span>
                <button className="enp-more-btn" onClick={(e) => e.stopPropagation()}><MoreVertical size={14} /></button>
              </span>
            </div>
          );
        })}

        {!loading && !error && list.length === 0 && (
          <p style={{ padding: 24, textAlign: "center", color: "#aaa" }}>알림이 없습니다.</p>
        )}
      </div>

      <div className="enp-pagination">
        <button onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0}>
          <ChevronLeft size={14} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
          <button
            key={p}
            className={currentPage === p ? "enp-pagination__active" : ""}
            onClick={() => setCurrentPage(p)}
          >
            {p + 1}
          </button>
        ))}
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={currentPage >= totalPages - 1}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}