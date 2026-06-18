import { NavLink } from "react-router-dom";
import "../../styles/Sidebars.css";

const MENU = [
  { label: "홈", path: "/customer/home", icon: "🏠" },
  { label: "내 가전", path: "/customer/appliances", icon: "📦" },
  { label: "가전별 수리 이력", path: "/customer/repair-history", icon: "🔧" },
  { label: "A/S 신청 / 예약", path: "/customer/as", icon: "📝" },
  { label: "정산 / 결제", path: "/customer/payment", icon: "💳" },
  { label: "중고 마켓", path: "/customer/market", icon: "🏪" },
  { label: "알림", path: "/customer/notice", icon: "🔔" },
];

export default function CustomerSidebar() {
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
      </div>
    </aside>
  );
}