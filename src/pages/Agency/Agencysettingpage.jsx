import { useState, useEffect, useRef } from "react";
import { ChevronRight, Lock as LockIcon, UserPlus } from "lucide-react";
import { getIsRepresentativeFromToken } from "../../utils/auth";
import AgencyStaffApprovalModal from "./Modal/AgencyStaffApprovalModal";
import "../../styles/Agency/Agencysettingpage.css";

const BASE_URL = "http://localhost:8080";

// 계좌 등록 시 선택 가능한 은행 목록 (드롭다운용)
const BANK_LIST = [
  { code: "WOORI",   name: "우리은행" },
  { code: "KB",      name: "KB국민은행" },
  { code: "SHINHAN", name: "신한은행" },
  { code: "IBK",     name: "IBK기업은행" },
  { code: "NH",      name: "NH농협은행" },
  { code: "SC",      name: "SC제일은행" },
  { code: "HANA",    name: "하나은행" },
  { code: "KAKAO",   name: "카카오뱅크" },
  { code: "TOSS",    name: "토스뱅크" },
];

// 계좌번호: 숫자와 '-'만 허용, 은행마다 자릿수가 달라 최소 자릿수만 느슨하게 체크
function isValidAccountNumber(value) {
  if (!value) return false;
  return /^[0-9-]+$/.test(value) && value.replace(/-/g, "").length >= 10;
}

// ISO LocalDateTime → "yyyy.MM.dd (요일) HH:mm:ss" 표시용 포맷
function formatLastLoginAt(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} (${days[d.getDay()]}) ${hh}:${min}:${ss}`;
}

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  });

  // 토큰 만료/미인증 처리: 세션 정리 후 로그인 페이지로 이동
  if (res.status === 401) {
    localStorage.removeItem("token");
    alert("세션이 만료되었습니다. 다시 로그인해주세요.");
    window.location.href = "/login"; // 실제 로그인 라우트 경로에 맞게 수정 필요
    throw new Error("401");
  }

  if (!res.ok) throw new Error(`${res.status}`);

  // 204 No Content 등 바디가 없는 응답은 res.json()이 파싱 에러를 던지므로 그 전에 걸러낸다
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export default function AgencySettingPage() {
  // ── 대행사 정보 (3번 + 4번 API) ───────────────
  // GET /api/agency/me → { agencyId, agencyName, agencyAddress, bankName, accountNumber }
  // PUT /api/agency/me → { agencyName, agencyAddress, bankName, accountNumber }
  const [agencyName,  setAgencyName]  = useState("");
  const [address,     setAddress]     = useState("");
  const [infoLoading, setInfoLoading] = useState(true);
  const [infoSaving,  setInfoSaving]  = useState(false);

  // ── 정산 계좌 정보 (신규 추가, 4번 API에 필드만 확장) ──
  const [bankName,      setBankName]      = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountError,  setAccountError]  = useState("");

  // ── 수수료율 (5번 + 6번 API) ──────────────────
  // GET /api/agencies/fee-rate → { agencyId, agencyName, agencyFeeRate }
  // PATCH /api/agencies/fee-rate → { agencyFeeRate }
  const [feeRate,      setFeeRate]      = useState("");
  const [feeLoading,   setFeeLoading]   = useState(true);
  const [feeSaving,    setFeeSaving]    = useState(false);

  // ── 계정 정보 (3번 API 응답에 포함된 로그인 계정 필드 재사용) ──
  // GET /api/agency/me 응답: { ..., name, email, lastLoginAt }
  const [accountInfo, setAccountInfo] = useState({ name: "", email: "", lastLoginAt: null });

  // JWT의 isRepresentative 클레임으로 슈퍼 계정(대표 담당자) / 일반 관리자 계정 판별
  const isRepresentative = getIsRepresentativeFromToken();
  const accountTypeLabel = isRepresentative ? "슈퍼 계정" : "일반 관리자 계정";

  // ── 일반 관리자 가입 신청 관리 모달 (슈퍼 계정 전용) ──
  const [isStaffApprovalModalOpen, setIsStaffApprovalModalOpen] = useState(false);

  // ── 계정 탈퇴 (7번 API) ───────────────────────
  // DELETE /api/agency/me/withdraw, 요청: { password }
  const [withdrawing, setWithdrawing] = useState(false);

  // ── 로그인 보안 (2단계 인증 / 로그인 알림) ──
  // GET /api/agency/me/security → { twoFactorEnabled, loginAlertEnabled }
  const [security, setSecurity] = useState({ twoFactorEnabled: false, loginAlertEnabled: false });
  const [securityToggling, setSecurityToggling] = useState(false);

  // ── 초기 데이터 로드 ──────────────────────────
  useEffect(() => {
    // 3번: 대행사 내 정보 조회
    // 응답: { agencyId, agencyName, agencyAddress, bankName, accountNumber }
    apiFetch("/api/agency/me")
      .then(data => {
        setAgencyName(data.agencyName ?? "");
        setAddress(data.agencyAddress ?? "");
        setBankName(data.bankName ?? "");
        setAccountNumber(data.accountNumber ?? "");
        setAccountInfo({
          name: data.name ?? "",
          email: data.email ?? "",
          lastLoginAt: data.lastLoginAt ?? null,
        });
      })
      .catch(console.error)
      .finally(() => setInfoLoading(false));

    // 5번: 수수료율 조회
    // 응답: { agencyId, agencyName, agencyFeeRate }
    apiFetch("/api/agencies/fee-rate")
      .then(data => setFeeRate(data.agencyFeeRate ?? ""))
      .catch(console.error)
      .finally(() => setFeeLoading(false));

    // 로그인 보안 설정 조회
    apiFetch("/api/agency/me/security")
      .then(data => setSecurity(data))
      .catch(console.error);
  }, []);

  // 계좌번호 입력 시 숫자와 '-'만 허용
  const handleAccountNumberChange = (e) => {
    const value = e.target.value.replace(/[^0-9-]/g, "");
    setAccountNumber(value);
    if (accountError) setAccountError("");
  };

  // ── 4번: 대행사 정보 수정 ─────────────────────
  // PUT /api/agency/me
  // 요청: { agencyName, agencyAddress, bankName, accountNumber }
  // 응답: { agencyId, agencyName, agencyAddress, bankName, accountNumber }
  const handleSaveAgency = async () => {
    if (!agencyName.trim() || !address.trim()) {
      alert("대행사명과 주소를 입력해주세요.");
      return;
    }

    // 계좌 정보는 필수 입력
    if (!bankName) {
      setAccountError("은행을 선택해주세요.");
      return;
    }
    if (!isValidAccountNumber(accountNumber)) {
      setAccountError("올바른 계좌번호 형식이 아닙니다.");
      return;
    }
    setAccountError("");

    setInfoSaving(true);
    try {
      await apiFetch("/api/agency/me", {
        method: "PUT",
        body: JSON.stringify({
          agencyName:    agencyName.trim(),
          agencyAddress: address.trim(),
          bankName:      bankName || null,
          accountNumber: accountNumber || null,
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

  // ── 7번: 계정 탈퇴 ────────────────────────────
  // DELETE /api/agency/me/withdraw
  const handleWithdraw = async () => {
    if (isRepresentative) {
      alert("대표 담당자는 탈퇴할 수 없습니다. 먼저 대표를 위임하거나 대행사 해지를 문의해주세요.");
      return;
    }
    const password = window.prompt("본인 확인을 위해 현재 비밀번호를 입력해주세요.");
    if (!password) return;
    if (!window.confirm("정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;

    setWithdrawing(true);
    try {
      await apiFetch("/api/agency/me/withdraw", {
        method: "DELETE",
        body: JSON.stringify({ password }),
      });
      alert("탈퇴 처리가 완료되었습니다.");
      localStorage.removeItem("token");
      window.location.href = "/login";
    } catch (e) {
      console.error(e);
      if (e.message === "400") {
        alert("현재 비밀번호가 일치하지 않습니다.");
      } else if (e.message === "403") {
        alert("대표 담당자는 탈퇴할 수 없습니다.");
      } else {
        alert("탈퇴 처리에 실패했습니다.");
      }
    } finally {
      setWithdrawing(false);
    }
  };

  // ── 2단계 인증 / 로그인 알림 토글 ──────────────
  const handleToggleTwoFactor = async () => {
    const next = !security.twoFactorEnabled;
    if (!window.confirm(`2단계 인증을 ${next ? "사용" : "사용 안 함"}으로 변경하시겠습니까?`)) return;
    setSecurityToggling(true);
    try {
      await apiFetch("/api/agency/me/security/two-factor", {
        method: "PATCH",
        body: JSON.stringify({ enabled: next }),
      });
      setSecurity(prev => ({ ...prev, twoFactorEnabled: next }));
    } catch (e) {
      console.error(e);
      alert("설정 변경에 실패했습니다.");
    } finally {
      setSecurityToggling(false);
    }
  };

  const handleToggleLoginAlert = async () => {
    const next = !security.loginAlertEnabled;
    if (!window.confirm(`로그인 알림을 ${next ? "사용" : "사용 안 함"}으로 변경하시겠습니까?`)) return;
    setSecurityToggling(true);
    try {
      await apiFetch("/api/agency/me/security/login-alert", {
        method: "PATCH",
        body: JSON.stringify({ enabled: next }),
      });
      setSecurity(prev => ({ ...prev, loginAlertEnabled: next }));
    } catch (e) {
      console.error(e);
      alert("설정 변경에 실패했습니다.");
    } finally {
      setSecurityToggling(false);
    }
  };

  // ── 데이터 내보내기 / 가져오기 ─────────────────
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const importFileInputRef = useRef(null);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BASE_URL}/api/agency/me/data-export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : "engineers.csv";

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("데이터 내보내기에 실패했습니다.");
    } finally {
      setExporting(false);
    }
  };

  const handleImportButtonClick = () => {
    importFileInputRef.current?.click();
  };

  const handleImportFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 동일 파일 재선택 시에도 change 이벤트가 발생하도록 초기화
    if (!file) return;

    setImporting(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${BASE_URL}/api/agency/me/data-import`, {
        method: "POST",
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData,
      });
      if (!res.ok) throw new Error(`${res.status}`);

      const result = await res.json();
      let message = `성공 ${result.successCount}건, 실패 ${result.failCount}건`;
      if (result.errors?.length > 0) {
        message += `\n\n${result.errors.join("\n")}`;
      }
      alert(message);
    } catch (e) {
      console.error(e);
      if (e.message === "401") {
        alert("대표 담당자만 기사 로스터를 일괄 등록할 수 있습니다.");
      } else {
        alert("데이터 가져오기에 실패했습니다.");
      }
    } finally {
      setImporting(false);
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
              <>
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

                {/* 정산 계좌 정보 - 신규 추가 */}
                <div className="asp3-form-grid" style={{ marginTop: "16px" }}>
                  <div className="asp3-form-field">
                    <label className="asp3-label">정산 은행 <span style={{ color: "#dc2626" }}>*</span></label>
                    <select
                      className="asp3-input"
                      value={bankName}
                      onChange={e => { setBankName(e.target.value); if (accountError) setAccountError(""); }}
                    >
                      <option value="">은행을 선택하세요</option>
                      {BANK_LIST.map(bank => (
                        <option key={bank.code} value={bank.name}>{bank.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="asp3-form-field">
                    <label className="asp3-label">계좌번호 <span style={{ color: "#dc2626" }}>*</span></label>
                    <input
                      className="asp3-input"
                      value={accountNumber}
                      onChange={handleAccountNumberChange}
                      placeholder="'-' 없이 또는 포함하여 입력"
                    />
                  </div>
                  {accountError && (
                    <p className="asp3-hint" style={{ color: "#dc2626" }}>
                      {accountError}
                    </p>
                  )}
                </div>
              </>
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
          {/* 계정 정보 - GET /api/agency/me 응답의 name/email/lastLoginAt 사용 */}
          <div className="asp3-panel">
            <div className="asp3-panel__header">
              <h3 className="asp3-panel__title">계정 정보</h3>
              <div className="asp3-panel__avatar"><span>👤</span></div>
            </div>
            <div className="asp3-panel__row"><span className="asp3-panel__label">이름</span><span className="asp3-panel__value">{infoLoading ? "..." : accountInfo.name}</span></div>
            <div className="asp3-panel__row"><span className="asp3-panel__label">이메일</span><span className="asp3-panel__value">{infoLoading ? "..." : accountInfo.email}</span></div>
            <div className="asp3-panel__row"><span className="asp3-panel__label">계정 유형</span><span className="asp3-panel__value">{accountTypeLabel}</span></div>
            <div className="asp3-panel__row"><span className="asp3-panel__label">마지막 로그인</span><span className="asp3-panel__value">{infoLoading ? "..." : formatLastLoginAt(accountInfo.lastLoginAt)}</span></div>
            <button className="asp3-pw-btn"><LockIcon size={12} /> 비밀번호 변경</button>
            {/* 슈퍼 계정만 자기 대행사의 일반 관리자 가입 신청을 승인/반려할 수 있음 */}
            {isRepresentative && (
              <button className="asp3-pw-btn" onClick={() => setIsStaffApprovalModalOpen(true)}>
                <UserPlus size={12} /> 가입 신청 관리
              </button>
            )}
          </div>

          {/* 로그인 보안 */}
          <div className="asp3-panel">
            <h3 className="asp3-panel__title">로그인 보안</h3>
            <div className="asp3-security-row">
              <p className="asp3-security-label">2단계 인증</p>
              <div className="asp3-security-right">
                <span className={`asp3-security-badge ${security.twoFactorEnabled ? "asp3-security-badge--on" : "asp3-security-badge--neutral"}`}>
                  {security.twoFactorEnabled ? "사용 중" : "사용 안 함"}
                </span>
                <button className="asp3-manage-btn" disabled={securityToggling} onClick={handleToggleTwoFactor}>관리</button>
              </div>
            </div>
            <div className="asp3-security-row">
              <p className="asp3-security-label">로그인 알림</p>
              <div className="asp3-security-right">
                <span className={`asp3-security-badge ${security.loginAlertEnabled ? "asp3-security-badge--on" : "asp3-security-badge--neutral"}`}>
                  {security.loginAlertEnabled ? "사용 중" : "사용 안 함"}
                </span>
                <button className="asp3-manage-btn" disabled={securityToggling} onClick={handleToggleLoginAlert}>관리</button>
              </div>
            </div>
          </div>

          {/* 데이터 관리 */}
          <div className="asp3-panel">
            <h3 className="asp3-panel__title">데이터 관리</h3>
            <button className="asp3-data-btn" disabled={exporting} onClick={handleExportData}>
              <LockIcon size={12} color="#5B4FF5" /> {exporting ? "내보내는 중..." : "데이터 내보내기"} <ChevronRight size={13} />
            </button>
            <button className="asp3-data-btn" disabled={importing} onClick={handleImportButtonClick}>
              <LockIcon size={12} color="#5B4FF5" /> {importing ? "가져오는 중..." : "데이터 가져오기"} <ChevronRight size={13} />
            </button>
            <input
              ref={importFileInputRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={handleImportFileChange}
            />
            <button
              className="asp3-data-btn asp3-data-btn--danger"
              disabled={withdrawing || isRepresentative}
              title={isRepresentative ? "대표 담당자는 탈퇴할 수 없습니다" : undefined}
              onClick={handleWithdraw}
            >
              <LockIcon size={12} color="#dc2626" /> {withdrawing ? "처리 중..." : "계정 탈퇴"} <ChevronRight size={13} />
            </button>
          </div>
        </aside>
      </div>

      {isStaffApprovalModalOpen && (
        <AgencyStaffApprovalModal onClose={() => setIsStaffApprovalModalOpen(false)} />
      )}
    </div>
  );
}