import "../../styles/Landing/FeaturePage.css";
import { useNavigate } from "react-router-dom";
import {MapPin, Bell, ShieldCheck, ChartNoAxesCombined, RefreshCw} from "lucide-react";

const FEATURES = [
  {
    num: "01",
    title: "통합 가전 관리",
    desc: "여러 브랜드의 가전을 한 곳에서 등록하고 관리",
    checks: ["모델명/시리얼 등록", "보증기간 및 구매 정보 관리", "IoT 연동으로 자동 상태 확인"],
    preview: "appliance",
  },
  {
    num: "02",
    title: "A/S 신청 및 실시간 추적",
    desc: "간편하게 A/S를 신청하고 진행 상황을 실시간으로 확인",
    checks: ["스킬/위치 기반 기사 매칭", "실시간 진행 단계 알림", "정확한 방문 시간 안내(ETA)"],
    preview: "tracking",
  },
  {
    num: "03",
    title: "제품 건강 진단서",
    desc: "수리/점검 이력을 기반으로 가전의 건강 상태를 한눈에 확인",
    checks: ["수리/점검 이력 자동 반영", "건강 점수 및 등급 제공", "중고 거래 시 신뢰도 보증"],
    preview: "certificate",
  },
  {
    num: "04",
    title: "소모품 교체 알림",
    desc: "소모품 교체 주기를 예측하여 알림과 함께 구매까지 연결",
    checks: ["소모품 교체 시기 알림", "호환 부품 추천", "원클릭 구매 연결"],
    preview: "alarm",
  },
  {
    num: "05",
    title: "수리 이력 관리",
    desc: "모든 수리 및 점검 내역을 체계적으로 기록하고 관리",
    checks: ["상세 수리 내역 확인", "진단서 자동 갱신", "문서 다운로드 및 공유"],
    preview: "history",
  },
];

const VALUES = [
  { icon: <ShieldCheck size={36} color="#5B4FF5" />, title: "투명한 A/S", desc: "정확한 진단과 투명한 비용 안내로 신뢰할 수 있는 A/S 경험을 제공합니다." },
  { icon: <ChartNoAxesCombined size={36} color="#5B4FF5" />, title: "데이터 기반 관리", desc: "가전 데이터를 분석하여 최적의 관리와 예측 서비스를 제공합니다." },
  { icon: <RefreshCw size={36} color="#5B4FF5" />, title: "순환 경제 실현", desc: "진단서를 기반으로 중고 거래의 가치를 높이고 자원 순환에 기여합니다." },
];

function PreviewAppliance() {
  return (
    <div className="feature__preview feature__preview--appliance">
      <img src="/src/assets/가구.png" alt="가전제품" className="feature__appliance-img" />
    </div>
  );
}

function PreviewTracking() {
  return (
    <div className="feature__preview feature__preview--tracking">
      <div className="feature__tracking-steps">
        {["접수 완료", "기사 배정", "방문 예정", "수리 완료"].map((s, i) => (
          <div key={s} className={`feature__tracking-step ${i < 2 ? "feature__tracking-step--done" : i === 2 ? "feature__tracking-step--active" : ""}`}>
            <div className="feature__tracking-dot" />
            <span>{s}</span>
          </div>
        ))}
      </div>
      <div className="feature__tracking-map">
        <MapPin size={20} color="#5B4FF5" />
        <span>기사 이동 중</span>
      </div>
    </div>
  );
}

function PreviewCertificate() {
  return (
    <div className="feature__preview feature__preview--cert">
      <div className="feature__cert-header">
        <span className="feature__cert-title">Digital Health Certificate</span>
      </div>
      <div className="feature__cert-body">
        <div className="feature__cert-score">
          <span className="feature__cert-num">92</span>
          <span className="feature__cert-pt">점</span>
          <div className="feature__cert-grade">A</div>
        </div>
        <div className="feature__cert-stars">★★★★☆</div>
        <div className="feature__cert-info">
          <span>최근 점검 2024.04.20</span>
          <span>보증기간 2027.04.19까지</span>
        </div>
        <button className="feature__cert-btn">진단서 보기 →</button>
      </div>
    </div>
  );
}

function PreviewAlarm() {
  return (
    <div className="feature__preview feature__preview--alarm">
      <div className="feature__alarm-header">
        <Bell size={20} color="#5B4FF5" />
        <span>교체가 필요해요</span>
      </div>
      <div className="feature__alarm-item">
        <span className="feature__alarm-icon">🌬️</span>
        <div>
          <p className="feature__alarm-name">에어컨 필터</p>
          <p className="feature__alarm-date">최근 교체일 2024.01.20</p>
          <p className="feature__alarm-cycle">교체 주기 6개월</p>
        </div>
      </div>
      <div className="feature__alarm-btn">지금 구매하기</div>
    </div>
  );
}

function PreviewHistory() {
  return (
    <div className="feature__preview feature__preview--history">
      <p className="feature__history-title">최근 수리 이력</p>
      {[
        { date: "2024.04.24", text: "세탁기 수리 완료" },
        { date: "2024.01.15", text: "정기 점검 완료" },
        { date: "2023.10.03", text: "냉장고 부품 교체" },
      ].map((h) => (
        <div key={h.date} className="feature__history-item">
          <div className="feature__history-dot" />
          <div>
            <p className="feature__history-date">{h.date}</p>
            <p className="feature__history-text">{h.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const PREVIEWS = {
  appliance: <PreviewAppliance />,
  tracking: <PreviewTracking />,
  certificate: <PreviewCertificate />,
  alarm: <PreviewAlarm />,
  history: <PreviewHistory />,
};

export default function FeaturePage() {
  const navigate = useNavigate();

  return (
    <div className="feature">

      {/* 네브바 */}
      <nav className="feature__nav">
        <div className="feature__logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <img src="/src/assets/logo.png" alt="CareFlow" className="feature__logo-img" />
          CareFlow
        </div>
        <div className="feature__nav-links">
          {[
            { label: "서비스 소개", path: "/service" },
            { label: "주요 기능", path: "/features" },
            { label: "이용 방법", path: "/guide" },
          ].map((l, i) => (
            <a key={l.label} href="#"
              className={`feature__nav-link ${i === 1 ? "feature__nav-link--active" : ""}`}
              onClick={(e) => { e.preventDefault(); if (l.path !== "#") navigate(l.path); }}>
              {l.label}
            </a>
          ))}
        </div>
        <div className="feature__nav-actions">
          <button className="feature__btn feature__btn--ghost">로그인</button>
          <button className="feature__btn feature__btn--primary">회원가입</button>
        </div>
      </nav>

      {/* 헤더 */}
      <section className="feature__header">
        <h1 className="feature__header-title">
          <span className="feature__header-accent">CareFlow</span>의 핵심 기능
        </h1>
        <p className="feature__header-desc">가전의 생애주기 전 과정을 통합 관리하여 더 편리하고 스마트한 경험을 제공합니다.</p>
      </section>

      {/* 기능 카드 */}
      <section className="feature__cards">
        <div className="feature__cards-grid">
          {FEATURES.map((f) => (
            <div key={f.num} className={`feature__card ${f.highlight ? "feature__card--highlight" : ""}`}>
              <div className="feature__card-top">
                <span className="feature__card-num">{f.num}</span>
                <p className="feature__card-title">{f.title}</p>
                <p className="feature__card-desc">{f.desc}</p>
              </div>
              <div className="feature__card-preview">
                {PREVIEWS[f.preview]}
              </div>
              <div className="feature__card-checks">
                {f.checks.map((c) => (
                  <div key={c} className="feature__check">
                    <span className="feature__check-icon">✓</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 가치 섹션 */}
      <section className="feature__values">
        <h2 className="feature__values-title">CareFlow가 제공하는 가치</h2>
        <div className="feature__values-grid">
          {VALUES.map((v) => (
            <div key={v.title} className="feature__value-item">
              <div className="feature__value-icon">{v.icon}</div>
              <p className="feature__value-title">{v.title}</p>
              <p className="feature__value-desc">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}