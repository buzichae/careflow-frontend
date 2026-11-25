import { NavLink } from "react-router-dom";
import "../../styles/Sidebars.css";
import {House, UserRound, ClipboardList, HandCoins, UsersRound , Star ,
        ChartNoAxesCombined, Bell, Settings, BookOpen} from "lucide-react"

const MENU = [
  { label: "대시보드", path: "/agency/dashboard", icon: (active) => <House size={18} color={ active ? "#ffffff" : "#000000"} /> },
  { label: "작업 관리", path: "/agency/work", icon: (active) => <ClipboardList size={18} color={ active ? "#ffffff" : "#000000"}/> },
  { label: "기사 관리", path: "/agency/engineers", icon: (active) => <UserRound size={18} color={ active ? "#ffffff" : "#000000"} /> },
  { label: "정산 관리", path: "/agency/settlement", icon: (active) =>  <HandCoins size={18} color={ active ? "#ffffff" : "#000000"} /> },
  { label: "고객 관리", path: "/agency/customers", icon: (active) =>  <UsersRound size={18} color={ active ? "#ffffff" : "#000000"} /> },
  { label: "평가 및 리뷰", path: "/agency/reviews", icon: (active) => <Star size={18} color={ active ? "#ffffff" : "#000000"} /> },
  { label: "통계 및 리포트", path: "/agency/statistics", icon: (active) =>  <ChartNoAxesCombined size={18} color={ active ? "#ffffff" : "#000000"} /> },
  { label: "알림", path: "/agency/notice", icon: (active) =>  <Bell size={18}color={ active ? "#ffffff" : "#000000"} /> },
  { label: "LMS 교육 관리", path: "/agency/lms", icon: (active) =>  <BookOpen size={18}color={ active ? "#ffffff" : "#000000"} /> },
  { label: "설정", path: "/agency/settings", icon: (active) =>  <Settings size={18} color={ active ? "#ffffff" : "#000000"} /> },
];

export default function AgencySidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
  <img src="/logo.png" alt="CareFlow" className="sidebar__logo-img" />
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
        <button className="sidebar__cs-btn">💬 문의하기</button>
      </div>
    </aside>
  );
}