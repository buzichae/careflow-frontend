import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, LogOut, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/Admin/AdminNavbar.css";

const PAGE_INFO = {
  "/admin/dashboard":  { title: "운영 대시보드",      subtitle: "플랫폼 전반의 KPI와 주요 현황을 확인하세요." },
  "/admin/members":    { title: "회원 관리",          subtitle: "전체 회원 조회 및 계정 상태를 관리하세요." },
  "/admin/service":    { title: "서비스 운영",        subtitle: "A/S 현황, 수리 비용 가이드, 인증 뱃지 기준을 관리하세요." },
  "/admin/lms":        { title: "LMS 콘텐츠 관리",    subtitle: "교육 콘텐츠를 등록하고 기사별 이수 현황을 확인하세요." },
  "/admin/settlement": { title: "정산 관리",          subtitle: "대행사 단위 정산 내역을 조회하고 지급 승인을 처리하세요." },
};

export default function AdminNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const admin = { name: "관리자", role: "ADMIN" };
  const pageInfo = PAGE_INFO[location.pathname] || { title: "", subtitle: "" };

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="admin-navbar">
      <div className="admin-navbar__left">
        <h1 className="admin-navbar__title">{pageInfo.title}</h1>
        {pageInfo.subtitle && <p className="admin-navbar__subtitle">{pageInfo.subtitle}</p>}
      </div>

      <div className="admin-navbar__actions">
        <div className="admin-navbar__profile-wrap" ref={dropdownRef}>
          <button className="admin-navbar__profile" onClick={() => setDropdownOpen(p => !p)}>
            <div className="admin-navbar__avatar"><UserRound /></div>
            <div>
              <p className="admin-navbar__name">{admin.name}</p>
              <p className="admin-navbar__role">{admin.role}</p>
            </div>
            {dropdownOpen ? <ChevronUp size={14} color="#aaa" /> : <ChevronDown size={14} color="#aaa" />}
          </button>
          {dropdownOpen && (
            <div className="admin-dropdown">
              <div className="admin-dropdown__divider" />
              <button
                className="admin-dropdown__item admin-dropdown__item--logout"
                onClick={() => { setDropdownOpen(false); navigate("/auth/login"); }}
              >
                <LogOut size={14} /> 로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
