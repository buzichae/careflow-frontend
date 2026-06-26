import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, User, Settings, LogOut } from "lucide-react";
import "../../styles/Engineer/EngineerNavbar.css";

// TODO: API - GET /api/engineer/me → users + engineer_profiles JOIN
const engineer = { name: "김철수", role: "수리 기사" };

export default function EngineerNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    // await axios.post("/api/auth/logout");
    alert("로그아웃");
  };

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
              <button className="enb__dropdown-item"><User size={14} /> 내 정보</button>
              <button className="enb__dropdown-item"><Settings size={14} /> 설정</button>
              <div className="enb__dropdown-divider" />
              <button className="enb__dropdown-item enb__dropdown-item--logout" onClick={handleLogout}>
                <LogOut size={14} /> 로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
  );
}