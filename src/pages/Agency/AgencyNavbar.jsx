import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, User, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../apis/auth";
import { getAgencyMe } from "../../apis/agency";
import { getIsRepresentativeFromToken } from "../../utils/auth";
import "../../styles/Agency/AgencyNavbar.css"

export default function AgencyNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [agency, setAgency] = useState({ name: "", role: "" });
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
  async function fetchAgency() {
    try {
      const data = await getAgencyMe();
      // JWT의 isRepresentative 클레임으로 슈퍼 계정(대표 담당자) 여부 판별
      const isRepresentative = getIsRepresentativeFromToken();
      setAgency({
        name: data.agencyName,
        role: isRepresentative ? "대행사 슈퍼 관리자" : "대행사 관리자",
      });
    } catch (err) {
      console.error("대행사 정보를 불러오지 못했습니다.", err);
    }
  }
  fetchAgency();
}, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (_) {}
    localStorage.removeItem("token");
    navigate("/auth/login");
  };

  return (
    <div className="agency-navbar">
      <div className="agency-navbar__actions">
        <div className="agency-navbar__profile-wrap" ref={dropdownRef}>
          <button className="agency-navbar__profile" onClick={() => setDropdownOpen(p => !p)}>
            <div className="agency-navbar__avatar">🏢</div>
            <div>
              <p className="agency-navbar__name">{agency.name || "불러오는 중..."}</p>
              <p className="agency-navbar__role">{agency.role}</p>
            </div>
            {dropdownOpen ? <ChevronUp size={14} color="#aaa" /> : <ChevronDown size={14} color="#aaa" />}
          </button>
          {dropdownOpen && (
            <div className="agency-dropdown">
              {logoutConfirm ? (
                <div className="customer-dropdown__confirm">
                  <p className="customer-dropdown__confirm-text">로그아웃 하시겠습니까?</p>
                  <div className="customer-dropdown__confirm-btns">
                    <button className="customer-dropdown__confirm-cancel" onClick={() => setLogoutConfirm(false)}>취소</button>
                    <button className="customer-dropdown__confirm-ok" onClick={handleLogout}>로그아웃</button>
                  </div>
                </div>
              ) : (
                <>
                  <button className="agency-dropdown__item"><User size={14} /> 내 정보</button>
                  <button className="agency-dropdown__item"><Settings size={14} /> 설정</button>
                  <div className="agency-dropdown__divider" />
                  <button className="agency-dropdown__item agency-dropdown__item--logout" onClick={() => setLogoutConfirm(true)}>
                    <LogOut size={14} /> 로그아웃
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}