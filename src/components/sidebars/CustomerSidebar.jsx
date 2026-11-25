import { NavLink, useNavigate } from "react-router-dom";
import "../../styles/Sidebars.css";
// import {House, WashingMachine, Wrench, ShieldCheck, HandCoins, RefreshCw, Bell} from "lucide-react"
import {
  House,
  WashingMachine,
  ShieldCheck,
  HandCoins,
  Bell,
} from "lucide-react";

const MENU = [
  {
    label: "홈",
    path: "/customer/home",
    icon: (active) => (
      <House size={18} color={active ? "#ffffff" : "#000000"} />
    ),
  },
  {
    label: "내 가전",
    path: "/customer/appliances",
    icon: (active) => (
      <WashingMachine size={18} color={active ? "#ffffff" : "#000000"} />
    ),
  },
  {
    label: "A/S 신청 및 내역",
    path: "/customer/as",
    icon: (active) => (
      <ShieldCheck size={18} color={active ? "#ffffff" : "#000000"} />
    ),
  },
  {
    label: "정산 / 결제",
    path: "/customer/payment",
    icon: (active) => (
      <HandCoins size={18} color={active ? "#ffffff" : "#000000"} />
    ),
  },
  // { label: "중고 마켓", path: "/customer/market",icon: (active) => <RefreshCw size={18} color={ active ? "#ffffff" : "#000000"} />},
  {
    label: "알림",
    path: "/customer/notice",
    icon: (active) => <Bell size={18} color={active ? "#ffffff" : "#000000"} />,
  },
];

export default function CustomerSidebar() {
  const navigate = useNavigate();
  return (
    <aside className="sidebar">
      <div
        className="sidebar__logo"
        onClick={() => navigate("/customer/home")}
        style={{ cursor: "pointer" }}
      >
        <img
          src="/logo.png"
          alt="CareFlow"
          className="sidebar__logo-img"
        />
        CareFlow
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
            {({ isActive }) => (
              <>
                <span className="sidebar__icon">{item.icon(isActive)}</span>
                <span>{item.label}</span>
              </>
            )}
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
