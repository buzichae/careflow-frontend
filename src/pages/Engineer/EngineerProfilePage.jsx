import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Pencil, Phone, Mail, LogOut, X, Check,
} from "lucide-react";
import {
  getEngineerProfile,
  updateEngineerProfile,
  // [신규] 백엔드에 대응 엔드포인트가 있는지 확인 필요 — 없으면 새로 만들어야 합니다.
  // 회원가입/로그인 공통 API(apis/auth.js 등)에 이미 비밀번호 변경 함수가 있다면
  // 그쪽을 재사용하는 게 맞을 수도 있습니다.
  changePassword,
} from "../../apis/engineers";
import "../../styles/Engineer/EngineerProfilePage.css";

const SKILL_MAP = {
  ADVANCED:     { label: "고급 (ADVANCED)",     lv: "LV.3", color: "purple" },
  INTERMEDIATE: { label: "중급 (INTERMEDIATE)", lv: "LV.2", color: "blue"   },
  BEGINNER:     { label: "초급 (BEGINNER)",     lv: "LV.1", color: "green"  },
};

export default function EngineerProfilePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  // ── 편집 모드 상태 (기본 정보 + 전문 정보 공용) ──
  // [수정] 기존엔 isEditing 하나로 "기본 정보"와 "전문 정보" 편집을 같이 켰다 껐다 해서,
  // 전문 정보 수정 버튼을 눌러도 기본 정보 카드까지 같이 편집 모드로 바뀌는 문제가 있었음.
  // → 어느 섹션을 편집 중인지 구분하는 editSection('basic' | 'spec' | null)으로 분리.
  const [editSection, setEditSection] = useState(null);
  const isEditingBasic = editSection === "basic";
  const isEditingSpec  = editSection === "spec";
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editData, setEditData] = useState(null);

  // ── 비밀번호 변경 상태 ──
  const [isChangingPw, setIsChangingPw] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  const fetchProfile = () => {
    setLoading(true);
    setError(null);
    return getEngineerProfile()
      .then((res) => setProfile(res.data))
      .catch((err) => {
        console.error("프로필 조회 실패:", err);
        setError("프로필 정보를 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let mounted = true;
    fetchProfile();
    return () => { mounted = false; };
  }, []);

  const startEdit = (section) => {
    setSaveError("");
    setEditData({
      phone: profile.phone ?? "",
      careerStartedYear: profile.careerStartedYear ?? "",
      // 배열 필드는 편집 편의를 위해 쉼표구분 문자열로 변환
      serviceRegionNames: (profile.serviceRegionNames ?? []).join(", "),
      expertBrands: (profile.expertBrands ?? []).join(", "),
      categoryName: profile.categoryName ?? "",
    });
    setEditSection(section);
  };

  const cancelEdit = () => {
    setEditSection(null);
    setEditData(null);
    setSaveError("");
  };

  const handleEditChange = (field) => (e) => {
    const value = e.target.value;
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      // ⚠ 백엔드 UpdateEngineerProfileRequest 필드명과 반드시 맞춰야 함
      const payload = {
        phone: editData.phone,
        careerStartedYear: editData.careerStartedYear
          ? Number(editData.careerStartedYear)
          : null,
        serviceRegionNames: editData.serviceRegionNames
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        expertBrands: editData.expertBrands
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        categoryName: editData.categoryName,
      };

      await updateEngineerProfile(payload);
      await fetchProfile();
      setEditSection(null);
      setEditData(null);
    } catch (err) {
      console.error("프로필 수정 실패:", err);
      setSaveError(
        err.response?.data?.message || "프로필 수정에 실패했습니다."
      );
    } finally {
      setSaving(false);
    }
  };

  // ── 비밀번호 변경 핸들러 ──
  const startChangePw = () => {
    setPwError("");
    setPwSuccess("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsChangingPw(true);
  };

  const cancelChangePw = () => {
    setIsChangingPw(false);
    setPwError("");
  };

  const handlePasswordSave = async () => {
    setPwError("");
    setPwSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError("모든 항목을 입력해주세요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    // [수정] PR 확정 규칙: 영문+숫자 포함 8~64자
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,64}$/.test(newPassword)) {
      setPwError("새 비밀번호는 영문과 숫자를 포함해 8~64자로 입력해주세요.");
      return;
    }
    if (currentPassword === newPassword) {
      setPwError("현재 비밀번호와 다른 비밀번호를 입력해주세요.");
      return;
    }

    setPwSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPwSuccess("비밀번호가 변경되었습니다.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPw(false);
    } catch (err) {
      console.error("비밀번호 변경 실패:", err);
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;

      // [연동] PUT /api/auth/password 확정 응답:
      // - 400: 현재 비밀번호 불일치 / 새 비밀번호 규칙 위반 / 현재와 동일
      // - 403: 소셜 로그인 전용 계정 (비밀번호 자체가 없어 변경 불가)
      if (status === 403) {
        setPwError(serverMsg ?? "소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.");
      } else if (status === 400) {
        setPwError(serverMsg ?? "현재 비밀번호를 확인해주세요.");
      } else {
        setPwError(serverMsg ?? "비밀번호 변경에 실패했습니다.");
      }
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) return <div className="epp">불러오는 중...</div>;
  if (error || !profile) return <div className="epp">{error ?? "프로필을 찾을 수 없습니다."}</div>;

  const skill = SKILL_MAP[profile.skillLevel] ?? SKILL_MAP.BEGINNER;
  const careerYears = profile.careerStartedYear
    ? new Date().getFullYear() - profile.careerStartedYear
    : null;

  const brands = profile.expertBrands ?? [];
  const serviceRegions = profile.serviceRegionNames ?? [];

  return (
    <div className="epp">
      {/* 헤더 */}
      <div className="epp-topbar">
        <div>
          <h1 className="epp-title">기사 프로필 관리</h1>
          <p className="epp-sub">기사 기본 정보와 근무 정보를 확인 및 수정할 수 있습니다.</p>
        </div>
        {editSection === null ? (
          <button className="epp-edit-btn" onClick={() => startEdit("basic")}>
            <Pencil size={13} /> 프로필 수정
          </button>
        ) : editSection === "basic" ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="epp-edit-btn" onClick={cancelEdit} disabled={saving}>
              <X size={13} /> 취소
            </button>
            <button className="epp-edit-btn" onClick={handleSave} disabled={saving}>
              <Check size={13} /> {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        ) : null}
      </div>

      {saveError && (
        <div className="epp-error-banner" style={{ color: "crimson", marginBottom: 12 }}>
          {saveError}
        </div>
      )}

      {/* 상단: 프로필 카드 + 기본 정보 */}
      <div className="epp-top">
        {/* 좌측 프로필 */}
        <div className="epp-profile-card">
          <div className="epp-avatar-wrap">
            <div className="epp-avatar">
              {profile.profileImageUrl
                ? <img src={profile.profileImageUrl} alt="프로필" />
                : <span>{profile.name?.charAt(0)}</span>
              }
            </div>
          </div>
          <p className="epp-profile-name">{profile.name} 기사</p>
          <span className={`epp-skill-badge epp-skill-badge--${skill.color}`}>{skill.label}</span>
          <p className="epp-profile-agency-label">소속</p>
          <p className="epp-profile-agency">{profile.agencyName ?? "소속 없음"}</p>
          <div className="epp-profile-contact">
            <p><Phone size={12} /> {profile.phone}</p>
            <p><Mail size={12} /> {profile.email}</p>
          </div>
        </div>

        {/* 우측 기본 정보 */}
        <div className="epp-info-card">
          <div className="epp-info-card__header">
            <h3 className="epp-info-card__title">기본 정보</h3>
          </div>
          <div className="epp-info-grid">
            <div className="epp-info-row">
              <span className="epp-info-label">이름</span><span>{profile.name}</span>
            </div>

            <div className="epp-info-row">
              <span className="epp-info-label">연락처</span>
              {isEditingBasic ? (
                <input
                  className="epp-edit-input"
                  value={editData.phone}
                  onChange={handleEditChange("phone")}
                />
              ) : (
                <span>{profile.phone}</span>
              )}
            </div>

            <div className="epp-info-row">
              <span className="epp-info-label">경력 시작 연도</span>
              {isEditingBasic ? (
                <input
                  className="epp-edit-input"
                  type="number"
                  value={editData.careerStartedYear}
                  onChange={handleEditChange("careerStartedYear")}
                />
              ) : (
                <span>{profile.careerStartedYear ? `${profile.careerStartedYear}년` : "-"}</span>
              )}
            </div>

            <div className="epp-info-row">
              <span className="epp-info-label">활동 지역</span>
              {isEditingBasic ? (
                <input
                  className="epp-edit-input"
                  placeholder="쉼표로 구분 (예: 강남구, 서초구)"
                  value={editData.serviceRegionNames}
                  onChange={handleEditChange("serviceRegionNames")}
                />
              ) : (
                <span>{serviceRegions.length ? serviceRegions.join(", ") : "-"}</span>
              )}
            </div>

            <div className="epp-info-row">
              <span className="epp-info-label">기술 등급</span>
              <span>{skill.label} <span className="epp-info-hint">ⓘ</span></span>
            </div>

            <div className="epp-info-row">
              <span className="epp-info-label">전문 가전 카테고리</span>
              {isEditingBasic ? (
                <input
                  className="epp-edit-input"
                  value={editData.categoryName}
                  onChange={handleEditChange("categoryName")}
                />
              ) : (
                <span>{profile.categoryName ?? "미지정"} <span className="epp-single-badge">단일 카테고리</span></span>
              )}
            </div>

            <div className="epp-info-row">
              <span className="epp-info-label">전문 브랜드</span>
              {isEditingBasic ? (
                <input
                  className="epp-edit-input"
                  placeholder="쉼표로 구분 (예: 삼성, LG)"
                  value={editData.expertBrands}
                  onChange={handleEditChange("expertBrands")}
                />
              ) : (
                <span>{brands.length ? brands.join(", ") : "-"}</span>
              )}
            </div>

            <div className="epp-info-row"><span className="epp-info-label">가입일</span><span>{profile.createdAt ?? "-"}</span></div>
            <div className="epp-info-row"><span className="epp-info-label">이메일</span><span>{profile.email}</span></div>
            <div className="epp-info-row"><span className="epp-info-label">최종 정보 수정일</span><span>{profile.updatedAt ?? "-"}</span></div>
          </div>
        </div>
      </div>


      {/* 중단: 전문 정보 + 근무표 링크 + LMS */}
      <div className="epp-mid">
        {/* 전문 정보 */}
        <div className="epp-mid-card">
          <div className="epp-mid-card__header">
            <span className="epp-mid-card__icon">🔧</span>
            <h3 className="epp-mid-card__title">전문 정보</h3>
          </div>

          {/* [수정] 전문 정보 항목(주요 수리 분야/카테고리, 전문 브랜드, 활동 경력)은
              기본 정보와 같은 필드를 쓰지만, editSection으로 분리되어 있어
              "전문 정보 수정"을 눌러도 기본 정보 카드는 편집 모드로 바뀌지 않습니다. */}
          <div className="epp-spec-list">
            <div className="epp-spec-row">
              <span className="epp-spec-label">주요 수리 분야</span>
              {isEditingSpec ? (
                <input
                  className="epp-edit-input"
                  value={editData.categoryName}
                  onChange={handleEditChange("categoryName")}
                  placeholder="예: 세탁기"
                />
              ) : (
                <span>{profile.categoryName ? `${profile.categoryName} 수리 및 정비` : "-"}</span>
              )}
            </div>
            <div className="epp-spec-row">
              <span className="epp-spec-label">전문 브랜드</span>
              {isEditingSpec ? (
                <input
                  className="epp-edit-input"
                  placeholder="쉼표로 구분 (예: 삼성, LG)"
                  value={editData.expertBrands}
                  onChange={handleEditChange("expertBrands")}
                />
              ) : (
                <span>{brands.length ? brands.join(", ") : "-"}</span>
              )}
            </div>
            <div className="epp-spec-row">
              <span className="epp-spec-label">활동 경력</span>
              {isEditingSpec ? (
                <input
                  className="epp-edit-input"
                  type="number"
                  placeholder="경력 시작 연도 (예: 2015)"
                  value={editData.careerStartedYear}
                  onChange={handleEditChange("careerStartedYear")}
                />
              ) : (
                <span>{careerYears != null ? `${careerYears}년 (${profile.careerStartedYear}년 ~ 현재)` : "-"}</span>
              )}
            </div>
          </div>

          {editSection === null && (
            <button className="epp-mid-card__btn" onClick={() => startEdit("spec")}>
              <Pencil size={13} /> 전문 정보 수정
            </button>
          )}
          {isEditingSpec && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="epp-mid-card__btn" onClick={cancelEdit} disabled={saving}>
                <X size={13} /> 취소
              </button>
              <button className="epp-mid-card__btn" onClick={handleSave} disabled={saving}>
                <Check size={13} /> {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          )}
          {isEditingBasic && (
            <p style={{ fontSize: 12, color: "#888", marginTop: 8 }}>
              기본 정보 편집이 진행 중입니다. 완료 후 전문 정보를 수정해주세요.
            </p>
          )}
        </div>

        {/* 근무표 — ⚠ ProfileResponse엔 이번 달 스케줄 상세(scheduleWeek, workTime 등)가 없습니다.
            실제 근무표는 별도 API(getMonthlyWorkSchedule)로 조회해야 해서, 여기선 링크만 제공합니다. */}
        <div className="epp-mid-card">
          <div className="epp-mid-card__header">
            <span className="epp-mid-card__icon">📅</span>
            <h3 className="epp-mid-card__title">근무표</h3>
          </div>
          <p style={{ fontSize: 13, color: "#888", padding: "8px 0" }}>
            근무표는 별도 화면에서 등록·확인할 수 있습니다.
          </p>
          <button className="epp-mid-card__btn" onClick={() => navigate("/engineer/my-schedule")}>
            📋 근무표 보기
          </button>
        </div>

        {/* LMS 교육 상태 */}
        <div className="epp-mid-card">
          <div className="epp-mid-card__header">
            <span className="epp-mid-card__icon">🎓</span>
            <h3 className="epp-mid-card__title">LMS 교육 상태</h3>
            <span className={`epp-lms-badge ${profile.isLmsCompleted ? "epp-lms-badge--done" : "epp-lms-badge--fail"}`}>
              {profile.isLmsCompleted ? "✓ 이수 완료" : "미이수"}
            </span>
          </div>
          <div className="epp-lms-info">
            <div className="epp-lms-row"><span>기술 등급</span><span>{skill.label}</span></div>
            <div className="epp-lms-row"><span>전문 카테고리</span><span>{profile.categoryName ?? "미지정"}</span></div>
          </div>
          {/* ⚠ 이수 진행률(lmsProgress), 이수 완료일(lmsCompletedAt)은 ProfileResponse 스펙에 없습니다.
              is_lms_completed(boolean)만 제공되므로, 진행률 바는 제거하고 완료 여부만 표시합니다. */}
          <button className="epp-mid-card__btn" onClick={() => navigate("/engineer/lms")}>
            📖 교육 내역 보기
          </button>
        </div>
      </div>

      {/* 하단: 계정 및 보안 */}
      <div className="epp-security">
        <div className="epp-security__header">
          <span>🛡</span>
          <h3 className="epp-security__title">계정 및 보안</h3>
        </div>
        <div className="epp-security__grid">
          <div className="epp-security__item" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p className="epp-security__item-label">비밀번호</p>
                <p className="epp-security__item-value">**********</p>
              </div>
              {!isChangingPw ? (
                <button className="epp-security__btn" onClick={startChangePw}>변경</button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="epp-security__btn" onClick={cancelChangePw} disabled={pwSaving}>취소</button>
                  <button className="epp-security__btn" onClick={handlePasswordSave} disabled={pwSaving}>
                    {pwSaving ? "변경 중..." : "저장"}
                  </button>
                </div>
              )}
            </div>

            {isChangingPw && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                <input
                  type="password"
                  className="epp-edit-input"
                  placeholder="현재 비밀번호"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <input
                  type="password"
                  className="epp-edit-input"
                  placeholder="새 비밀번호 (영문+숫자 8~64자)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <input
                  type="password"
                  className="epp-edit-input"
                  placeholder="새 비밀번호 확인"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {pwError && <p style={{ color: "crimson", fontSize: 12 }}>{pwError}</p>}
              </div>
            )}
            {!isChangingPw && pwSuccess && (
              <p style={{ color: "#16a34a", fontSize: 12 }}>{pwSuccess}</p>
            )}
          </div>
          {/* ⚠ lastLoginAt은 ProfileResponse 스펙에 없어 제거했습니다. */}
        </div>
      </div>
    </div>
  );
}