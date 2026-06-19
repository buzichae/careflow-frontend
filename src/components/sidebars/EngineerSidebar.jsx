import { NavLink } from "react-router-dom";
import "../../styles/Sidebars.css";
import {House, CalendarDays, ClipboardList, UserSearch, ChartLine, HandCoins, Star ,UserRound ,Bell} from "lucide-react"

const MENU = [
  { label: "대시보드", path: "/engineer/dashboard", icon: (active) => <House size={18} color={ active ? "#ffffff" : "#000000"} /> },
  { label: "작업 일정", path: "/engineer/schedule", icon: (active) => <CalendarDays size={18} color={ active ? "#ffffff" : "#000000"} /> },
  { label: "작업 관리", path: "/engineer/work", icon: (active) => <ClipboardList size={18} color={ active ? "#ffffff" : "#000000"} />},
  { label: "고객 정보 조회", path: "/engineer/customers",icon: (active) => <UserSearch size={18} color={ active ? "#ffffff" : "#000000"} />},
  { label: "작업보고서", path: "/engineer/report", icon: (active) => <ChartLine size={18} color={ active ? "#ffffff" : "#000000"} /> },
  { label: "실적 / 정산", path: "/engineer/settlement", icon: (active) => <HandCoins size={18} color={ active ? "#ffffff" : "#000000"} /> },
  { label: "고객 평가", path: "/engineer/reviews", icon: (active) => <Star size={18} color={ active ? "#ffffff" : "#000000"} />},
  { label: "프로필 관리", path: "/engineer/profile", icon: (active) => <UserRound size={18} color={ active ? "#ffffff" : "#000000"} /> },
  { label: "알림", path: "/engineer/notice", icon: (active) => <Bell size={18} color={ active ? "#ffffff" : "#000000"} /> },
];

export default function EngineerSidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
  <img src="/src/assets/logo.png" alt="CareFlow" className="sidebar__logo-img" />
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
        <button className="sidebar__cs-btn">📞 전화하기</button>
      </div>
    </aside>
  );
}