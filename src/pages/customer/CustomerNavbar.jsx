import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, User, Settings, LogOut, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../styles/Customer/CustomerNavbar.css";

const PAGE_INFO = {
  "/customer/home":           { title: "안녕하세요 플로우님!", subtitle: "오늘도 우리집 가전의 건강을 체크해보세요." },
  "/customer/appliances":     { title: "내 가전",             subtitle: "보유하고 있는 가전제품을 한눈에 확인하고 관리하세요." },
  "/customer/repair-history": { title: "가전별 수리 이력",    subtitle: "가전을 선택하면 상세 수리 이력을 확인할 수 있습니다." },
  "/customer/as":             { title: "A/S 신청 · 예약",     subtitle: "접수한 A/S 현황과 방문 일정을 확인하세요." },
  "/customer/payment":        { title: "정산 / 결제",         subtitle: "이번 달 수리 비용과 결제 현황을 확인하세요." },
  "/customer/notice":         { title: "알림",                subtitle: "중요한 서비스 알림과 시스템 소식을 확인하세요." },
  // "/customer/market":         { title: "중고 마켓",           subtitle: "중고 가전을 안전하게 거래하세요." },
  "/customer/mypage":         { title: "마이페이지",          subtitle: "내 정보를 확인하고 수정하세요." },
};

export default function CustomerNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  const navigate = useNavigate();
  const customer = { name: "플로우", role: "고객" };
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
    <div className="customer-navbar">
      <div className="customer-navbar__left">
        <h1 className="customer-navbar__title">{pageInfo.title}</h1>
        {pageInfo.subtitle && <p className="customer-navbar__subtitle">{pageInfo.subtitle}</p>}
      </div>

      <div className="customer-navbar__actions">
        <div className="customer-navbar__profile-wrap" ref={dropdownRef}>
          <button className="customer-navbar__profile" onClick={() => setDropdownOpen(p => !p)}>
            <div className="customer-navbar__avatar"><UserRound /></div>
            <div>
              <p className="customer-navbar__name">{customer.name}</p>
              <p className="customer-navbar__role">{customer.role}</p>
            </div>
            {dropdownOpen ? <ChevronUp size={14} color="#aaa" /> : <ChevronDown size={14} color="#aaa" />}
          </button>
          {dropdownOpen && (
            <div className="customer-dropdown">
              <button className="customer-dropdown__item" onClick={() => { setDropdownOpen(false); navigate("/customer/mypage"); }}>
                <User size={14} /> 내 정보
              </button>
              <button className="customer-dropdown__item"><Settings size={14} /> 설정</button>
              <div className="customer-dropdown__divider" />
              <button className="customer-dropdown__item customer-dropdown__item--logout" onClick={() => alert("로그아웃")}>
                <LogOut size={14} /> 로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
