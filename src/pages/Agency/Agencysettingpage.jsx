import { useState } from "react";
import {
  ChevronRight, Lock as LockIcon,
} from "lucide-react";
import "../../styles/Agency/Agencysettingpage.css";

// ──────────────────────────────────────────
// TODO: API 연동
// GET  /api/agency/me  → agencies + users(representative) JOIN
// PUT  /api/agency/me  → agencies.name, business_number, address, agency_fee_rate 수정
//                        users.name(대표자명), users.phone, users.email 수정
//
// DB 필드:
//   agencies.name               → 대행사명
//   agencies.business_number    → 사업자등록번호
//   agencies.address            → 주소
//   agencies.agency_fee_rate    → 대행사 수수료율 (5~30% DECIMAL(5,2))
//   users.name                  → 대표자명
//   users.phone                 → 연락처
//   users.email                 → 이메일
//   users.last_login_at         → 마지막 로그인
// ──────────────────────────────────────────
 
export default function AgencySettingPage() {
 
  const [agencyName,     setAgencyName]     = useState("케어플로우 대행사");
  const [businessNumber, setBusinessNumber] = useState("123-45-67890");
  const [repName,        setRepName]        = useState("홍길동");
  const [address,        setAddress]        = useState("서울특별시 강남구 테헤란로 123, 10층 (역삼동, 케어빌딩)");
  const [phone,          setPhone]          = useState("02-1234-5678");
  const [email,          setEmail]          = useState("agency@careflow.co.kr");
  const [feeRate,        setFeeRate]        = useState(15);
 
  const accountInfo = {
    id:          "agency_admin",
    name:        "대행사 관리자",
    email:       "admin@careflow.co.kr",
    lastLoginAt: "2024.06.18 (화) 14:35:22",
  };
 
  const handleSaveAgency = () => {
    // TODO: PUT /api/agency/me
    alert("저장되었습니다.");
  };
 
  return (
    <div className="asp3">
      {/* 헤더 */}
      <div className="asp3-header">
        <h1 className="asp3-header__title">설정 <span className="asp3-header__arrow">›</span> 기본 설정</h1>
        <p className="asp3-header__sub">대행사 정보를 관리하고 시스템 설정을 구성할 수 있습니다.</p>
      </div>
 
      <div className="asp3-body">
        <div className="asp3-left">
          {/* 대행사 정보 */}
          <div className="asp3-section">
            <div className="asp3-section__header">
              <h2 className="asp3-section__title">대행사 정보</h2>
              <button className="asp3-save-btn" onClick={handleSaveAgency}>저장하기</button>
            </div>
 
            <div className="asp3-form-grid">
              <div className="asp3-form-field">
                <label className="asp3-label">대행사명</label>
                <input className="asp3-input" value={agencyName} onChange={e => setAgencyName(e.target.value)} />
              </div>
              <div className="asp3-form-field">
                <label className="asp3-label">사업자 등록번호</label>
                <input className="asp3-input" value={businessNumber} onChange={e => setBusinessNumber(e.target.value)} />
              </div>
              <div className="asp3-form-field">
                <label className="asp3-label">대표자명</label>
                <input className="asp3-input" value={repName} onChange={e => setRepName(e.target.value)} />
              </div>
              <div className="asp3-form-field">
                <label className="asp3-label">연락처</label>
                <input className="asp3-input" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="asp3-form-field">
                <label className="asp3-label">이메일</label>
                <input className="asp3-input" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              {/* 주소는 한 줄 full */}
              <div className="asp3-form-field asp3-form-field--full">
                <label className="asp3-label">주소</label>
                <input className="asp3-input" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
              {/* 수수료율 */}
              <div className="asp3-form-field">
                <label className="asp3-label">대행사 수수료율</label>
                <div className="asp3-input-suffix">
                  <input
                    className="asp3-input asp3-input--suffix"
                    type="number" min={5} max={30}
                    value={feeRate}
                    onChange={e => setFeeRate(Number(e.target.value))}
                  />
                  <span className="asp3-suffix">%</span>
                </div>
                <p className="asp3-hint">기본값: 15% (5% ~ 30%) · 변경 시 관리자 승인 후 반영됩니다</p>
              </div>
            </div>
          </div>
        </div>
 
        {/* 우측 패널 */}
        <aside className="asp3-right">
          {/* 계정 정보 */}
          <div className="asp3-panel">
            <div className="asp3-panel__header">
              <h3 className="asp3-panel__title">계정 정보</h3>
              <div className="asp3-panel__avatar"><span>👤</span></div>
            </div>
            <div className="asp3-panel__row"><span className="asp3-panel__label">아이디</span><span className="asp3-panel__value">{accountInfo.id}</span></div>
            <div className="asp3-panel__row"><span className="asp3-panel__label">이름</span><span className="asp3-panel__value">{accountInfo.name}</span></div>
            <div className="asp3-panel__row"><span className="asp3-panel__label">이메일</span><span className="asp3-panel__value">{accountInfo.email}</span></div>
            <div className="asp3-panel__row"><span className="asp3-panel__label">마지막 로그인</span><span className="asp3-panel__value">{accountInfo.lastLoginAt}</span></div>
            <button className="asp3-pw-btn"><LockIcon size={12} /> 비밀번호 변경</button>
          </div>
 
          {/* 로그인 보안 */}
          <div className="asp3-panel">
            <h3 className="asp3-panel__title">로그인 보안</h3>
            <div className="asp3-security-row">
              <p className="asp3-security-label">2단계 인증</p>
              <div className="asp3-security-right">
                <span className="asp3-security-badge asp3-security-badge--on">사용 중</span>
                <button className="asp3-manage-btn">관리</button>
              </div>
            </div>
            <div className="asp3-security-row">
              <p className="asp3-security-label">로그인 알림</p>
              <div className="asp3-security-right">
                <span className="asp3-security-badge asp3-security-badge--on">사용 중</span>
                <button className="asp3-manage-btn">관리</button>
              </div>
            </div>
            <div className="asp3-security-row">
              <p className="asp3-security-label">신뢰 기기 관리</p>
              <div className="asp3-security-right">
                <span className="asp3-security-badge asp3-security-badge--neutral">3개 등록됨</span>
                <button className="asp3-manage-btn">관리</button>
              </div>
            </div>
          </div>
 
          {/* 데이터 관리 */}
          <div className="asp3-panel">
            <h3 className="asp3-panel__title">데이터 관리</h3>
            <button className="asp3-data-btn">
              <LockIcon size={12} color="#5B4FF5" /> 데이터 내보내기 <ChevronRight size={13} />
            </button>
            <button className="asp3-data-btn">
              <LockIcon size={12} color="#5B4FF5" /> 데이터 가져오기 <ChevronRight size={13} />
            </button>
            <button className="asp3-data-btn asp3-data-btn--danger">
              <LockIcon size={12} color="#dc2626" /> 계정 탈퇴 <ChevronRight size={13} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}