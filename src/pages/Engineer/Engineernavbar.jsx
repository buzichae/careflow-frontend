import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, User, Settings, LogOut } from "lucide-react";
import { logout } from "../../apis/auth";

import "../../styles/Engineer/EngineerNavbar.css";

export default function EngineerNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [engineer, setEngineer] = useState({ name: "", role: "수리 기사" });
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

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
  }

  useEffect(() => {
    getUserInfo()
      .then((res) => {
        setEngineer({
          name: res.data.name,
          role: res.data.role ?? "수리 기사",
        });
      })
      .catch((err) => {
        console.error("유저 정보 조회 실패:", err);
        // 토큰 만료 등으로 조회 실패 시 로그인 페이지로
        navigate("/login");
      });
  }, [navigate]);

  return (
    <div className="enb">

      <div className="enb__actions"/>
        <div className="enb__profile-wrap" ref={dropdownRef}>
          <button className="enb__profile" onClick={() => setDropdownOpen(p => !p)}>
            <div className="enb__avatar">🔧</div>
            <div>
              <p className="enb__name">{engineer.name} 기사님</p>
              <p className="enb__role">{engineer.role}</p>
            </div>
            {dropdownOpen ? <ChevronUp size={14} color="#aaa" /> : <ChevronDown size={14} color="#aaa" />}
          </button>
          {dropdownOpen && (
            <div className="enb__dropdown">
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
                  <button className="enb__dropdown-item"><User size={14} /> 내 정보</button>
                  <button className="enb__dropdown-item"><Settings size={14} /> 설정</button>
                  <div className="enb__dropdown-divider" />
                  <button className="enb__dropdown-item enb__dropdown-item--logout" onClick={() => setLogoutConfirm(true)}>
                    <LogOut size={14} /> 로그아웃
                  </button>
                </>
              )}
            </div>
          )}
        </div>

      </div>

  );
}