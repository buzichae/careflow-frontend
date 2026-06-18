import { NavLink } from "react-router-dom";
import "../../styles/Sidebars.css";

const MENU = [
  { label: "대시보드", path: "/engineer/dashboard", icon: "⊞" },
  { label: "오늘의 일정", path: "/engineer/schedule", icon: "📅" },
  { label: "작업 목록", path: "/engineer/work", icon: "📋" },
  { label: "작업 완료 내역", path: "/engineer/work-done", icon: "✅" },
  { label: "정산 / 수익", path: "/engineer/settlement", icon: "💰" },
  { label: "고객 평가", path: "/engineer/reviews", icon: "⭐" },
  { label: "공지사항", path: "/engineer/notice", icon: "🔔" },
  { label: "내 정보", path: "/engineer/profile", icon: "👤" },
  { label: "도움말", path: "/engineer/help", icon: "❓" },
];

export default function EngineerSidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <span>💜</span> CareFlow
      </div>
      <nav className="sidebar__nav">
        {MENU.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar__item ${isActive ? "sidebar__item--active" : ""}`
            }
          >
            <span className="sidebar__icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__footer">
        <p className="sidebar__cs-label">고객센터</p>
        <p className="sidebar__cs-number">1588-1234</p>
        <p className="sidebar__cs-hours">평일 09:00 - 18:00</p>
        <button className="sidebar__cs-btn">📞 전화하기</button>
      </div>
    </aside>
  );
}