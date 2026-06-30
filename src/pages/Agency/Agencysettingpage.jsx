import { useState, useEffect } from "react";
import { ChevronRight, Lock as LockIcon } from "lucide-react";
import "../../styles/Agency/Agencysettingpage.css";

const BASE_URL = "http://localhost:8080";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("accessToken");
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export default function AgencySettingPage() {
  // ── 대행사 정보 (3번 + 4번 API) ───────────────
  // GET /api/agency/me → { agencyId, agencyName, agencyAddress }
  // PUT /api/agency/me → { agencyName, agencyAddress }
  const [agencyName,  setAgencyName]  = useState("");
  const [address,     setAddress]     = useState("");
  const [infoLoading, setInfoLoading] = useState(true);
  const [infoSaving,  setInfoSaving]  = useState(false);

  // ── 수수료율 (5번 + 6번 API) ──────────────────
  // GET /api/agencies/fee-rate → { agencyId, agencyName, agencyFeeRate }
  // PATCH /api/agencies/fee-rate → { agencyFeeRate }
  const [feeRate,      setFeeRate]      = useState("");
  const [feeLoading,   setFeeLoading]   = useState(true);
  const [feeSaving,    setFeeSaving]    = useState(false);

  // ── 계정 정보 (더미 - 별도 API 없음) ───────────
  const accountInfo = {
    id:          "agency_admin",
    name:        "대행사 관리자",
    email:       "admin@careflow.co.kr",
    lastLoginAt: "2024.06.18 (화) 14:35:22",
  };

  // ── 초기 데이터 로드 ──────────────────────────
  useEffect(() => {
    // 3번: 대행사 내 정보 조회
    // 응답: { agencyId, agencyName, agencyAddress }
    apiFetch("/api/agency/me")
      .then(data => {
        setAgencyName(data.agencyName ?? "");
        setAddress(data.agencyAddress ?? "");
      })
      .catch(console.error)
      .finally(() => setInfoLoading(false));

    // 5번: 수수료율 조회
    // 응답: { agencyId, agencyName, agencyFeeRate }
    apiFetch("/api/agencies/fee-rate")
      .then(data => setFeeRate(data.agencyFeeRate ?? ""))
      .catch(console.error)
      .finally(() => setFeeLoading(false));
  }, []);

  // ── 4번: 대행사 정보 수정 ─────────────────────
  // PUT /api/agency/me
  // 요청: { agencyName, agencyAddress }
  // 응답: { agencyId, agencyName, agencyAddress }
  const handleSaveAgency = async () => {
    if (!agencyName.trim() || !address.trim()) {
      alert("대행사명과 주소를 입력해주세요.");
      return;
    }
    setInfoSaving(true);
    try {
      await apiFetch("/api/agency/me", {
        method: "PUT",
        body: JSON.stringify({
          agencyName:    agencyName.trim(),
          agencyAddress: address.trim(),
        }),
      });
      alert("대행사 정보가 저장되었습니다.");
    } catch (e) {
      console.error(e);
      alert("저장에 실패했습니다.");
    } finally {
      setInfoSaving(false);
    }
  };

  // ── 6번: 수수료율 수정 ────────────────────────
  // PATCH /api/agencies/fee-rate
  // 요청: { agencyFeeRate: Double }
  // 응답: { agencyId, agencyName, agencyFeeRate }
  const handleSaveFeeRate = async () => {
    const rate = Number(feeRate);
    if (isNaN(rate) || rate < 0 || rate > 999.99) {
      alert("유효한 수수료율을 입력해주세요.");
      return;
    }
    setFeeSaving(true);
    try {
      const data = await apiFetch("/api/agencies/fee-rate", {
        method: "PATCH",
        body: JSON.stringify({ agencyFeeRate: rate }),
      });
      setFeeRate(data.agencyFeeRate);
      alert("수수료율이 변경되었습니다.");
    } catch (e) {
      console.error(e);
      alert("수수료율 변경에 실패했습니다.");
    } finally {
      setFeeSaving(false);
    }
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

          {/* 대행사 정보 - 3번/4번 API */}
          <div className="asp3-section">
            <div className="asp3-section__header">
              <h2 className="asp3-section__title">대행사 정보</h2>
              <button
                className="asp3-save-btn"
                onClick={handleSaveAgency}
                disabled={infoLoading || infoSaving}
              >
                {infoSaving ? "저장 중..." : "저장하기"}
              </button>
            </div>

            {infoLoading ? (
              <p style={{ color: "#aaa", fontSize: "13px", padding: "12px 0" }}>로딩 중...</p>
            ) : (
              <div className="asp3-form-grid">
                {/* 4번 API 수정 가능 필드: agencyName, agencyAddress */}
                <div className="asp3-form-field">
                  <label className="asp3-label">대행사명</label>
                  <input
                    className="asp3-input"
                    value={agencyName}
                    onChange={e => setAgencyName(e.target.value)}
                    placeholder="대행사명을 입력하세요"
                  />
                </div>
                {/* 주소 full width */}
                <div className="asp3-form-field asp3-form-field--full">
                  <label className="asp3-label">주소</label>
                  <input
                    className="asp3-input"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="대행사 소재지 주소를 입력하세요"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 수수료율 - 5번/6번 API */}
          <div className="asp3-section">
            <div className="asp3-section__header">
              <h2 className="asp3-section__title">수수료율 설정</h2>
              <button
                className="asp3-save-btn"
                onClick={handleSaveFeeRate}
                disabled={feeLoading || feeSaving}
              >
                {feeSaving ? "변경 중..." : "변경하기"}
              </button>
            </div>

            {feeLoading ? (
              <p style={{ color: "#aaa", fontSize: "13px", padding: "12px 0" }}>로딩 중...</p>
            ) : (
              <div className="asp3-form-grid">
                <div className="asp3-form-field">
                  <label className="asp3-label">대행사 수수료율</label>
                  <div className="asp3-input-suffix">
                    <input
                      className="asp3-input asp3-input--suffix"
                      type="number"
                      min={0}
                      max={999}
                      step={0.01}
                      value={feeRate}
                      onChange={e => setFeeRate(e.target.value)}
                    />
                    <span className="asp3-suffix">%</span>
                  </div>
                  <p className="asp3-hint">
                    ⚠ 변경된 수수료율은 이후 생성되는 정산에만 적용되며 기존 정산 소급 적용 없음
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 우측 패널 */}
        <aside className="asp3-right">
          {/* 계정 정보 - 별도 API 없음, 더미 유지 */}
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