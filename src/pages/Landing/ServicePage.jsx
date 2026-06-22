import "../../styles/Landing/ServicePage.css";
import { ShieldCheck, ChartNoAxesCombined, RefreshCw, Wrench, Bell, Monitor, ClipboardList} from "lucide-react";
import { useNavigate } from "react-router-dom";

const FLOW_STEPS = [
  { num: 1, icon: <Monitor size={28} color="#5B4FF5" />, title: "가전 등록", desc: "모델명/시리얼 또는 영수증으로 내 가전을 등록합니다." },
  { num: 2, icon: <ChartNoAxesCombined size={28} color="#5B4FF5" />, title: "상태 진단 및 관리", desc: "데이터 기반으로 가전 상태를 분석하고 관리합니다." },
  { num: 3, icon: <Wrench size={28} color="#5B4FF5" />, title: "A/S 신청", desc: "문제 발생 시 간편하게 A/S를 신청하고 실시간으로 진행 상황을 확인합니다." },
  { num: 4, icon: <ClipboardList size={28} color="#5B4FF5" />, title: "수리 이력 & 진단서", desc: "모든 수리/점검 이력이 기록되어 제품 건강 진단서를 발급받을 수 있습니다." },
  { num: 5, icon: <RefreshCw size={28} color="#5B4FF5" />, title: "중고 거래 활용", desc: "진단서를 기반으로 더 신뢰할 수 있는 중고 거래를 경험하세요." },
];

const BADGES = [
  { icon: <ShieldCheck size={20} color="#5B4FF5" />, title: "투명한 A/S", desc: "정확한 진단과 투명한 비용 안내" },
  { icon: <ChartNoAxesCombined size={20} color="#5B4FF5" />, title: "데이터 기반 관리", desc: "가전 상태를 데이터로 분석하고 관리" },
  { icon: <RefreshCw size={20} color="#5B4FF5" />, title: "순환 경제 실현", desc: "수리·재사용·중고 거래로 가치를 이어갑니다" },
];

const TARGETS = [
  {
    img: "/src/assets/고객.png",
    title: "일반 고객",
    desc: "내 가전을 한눈에 관리하고, 필요할 때 빠르고 투명하게 A/S를 받을 수 있어요.",
  },
  {
    img: "/src/assets/기사.png",
    title: "엔지니어 / 대행사",
    desc: "스킬/위치 기반 배정으로 더 많은 작업을 효율적으로 수행하고, 정확한 정산과 평가를 받아요.",
  },
  {
    img: "/src/assets/대행사.png",
    title: "기업 / 파트너",
    desc: "데이터 인사이트로 제품 품질을 개선하고, 신뢰도 높은 서비스로 브랜드 가치를 높일 수 있어요.",
  },
];

const FLOATING_ICONS = [
  { icon: <Wrench size={24} color="#5B4FF5" />, label: "수리/점검", top: "26%", left: "15%" },
  { icon: <Monitor size={24} color="#5B4FF5" />, label: "등록/관리", top: "7%", left: "28%" },
  { icon: <Bell size={24} color="#5B4FF5" />, label: "소모품 교체 알림", top: "16%", right: "11%" },
  { icon: <RefreshCw size={24} color="#5B4FF5" />, label: "중고 거래", top: "43%", right: "8%" },
];

export default function ServicePage() {
  const navigate = useNavigate();

  return (
    <div className="service">

      {/* 네브바 */}
      <nav className="service__nav">
        <div className="service__logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <img src="/src/assets/logo.png" alt="CareFlow" className="service__logo-img" />
             CareFlow
        </div>
        <div className="service__nav-links">
          {[
            { label: "서비스 소개", path: "/service" },
            { label: "주요 기능", path: "/features" },
            { label: "이용 방법", path: "/guide" },
           ].map((l, i) => (
            <a key={l.label} href="#"
             className={`service__nav-link ${i === 0 ? "service__nav-link--active" : ""}`}
             onClick={(e) => { e.preventDefault(); if (l.path !== "#") navigate(l.path); }}>
             {l.label}
            </a>
           ))}
        </div>
        <div className="service__nav-actions">
          <button className="service__btn service__btn--ghost">로그인</button>
          <button className="service__btn service__btn--primary">회원가입</button>
        </div>
      </nav>

      {/* 히어로 */}
      <section className="service__hero">
        <div className="service__hero-blob" />
        <div className="service__hero-text">
          <p className="service__eyebrow">서비스 소개</p>
          <h1 className="service__title">
            가전의 모든 순간을<br />
            <span className="service__title-accent">CareFlow</span>가 함께합니다.
          </h1>
          <p className="service__desc">
            가전 등록부터 수리, 점검, 소모품 교체, 중고 거래까지<br />
            데이터 기반으로 통합 관리하여 더 편리하고 스마트한 가전 생활을 제공합니다.
          </p>
          <div className="service__badges">
            {BADGES.map((b) => (
              <div key={b.title} className="service__badge-card">
                <div className="service__badge-icon">{b.icon}</div>
                <div>
                  <p className="service__badge-title">{b.title}</p>
                  <p className="service__badge-desc">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="service__hero-visual">
          {FLOATING_ICONS.map((f, i) => (
            <div key={i} className="service__floating" style={{ top: f.top, left: f.left, right: f.right }}>
              <div className="service__floating-icon">{f.icon}</div>
              <span className="service__floating-label">{f.label}</span>
            </div>
          ))}
          <img src="/src/assets/main.png" alt="가전제품" className="service__hero-img" />
        </div>
      </section>

      {/* 작동 방식 */}
      <section className="service__flow">
        <h2 className="service__section-title">CareFlow는 이렇게 작동합니다</h2>
        <div className="service__flow-steps">
          {FLOW_STEPS.map((s, i) => (
            <div key={s.num} className="service__flow-item">
              <div className="service__flow-card">
                <div className="service__flow-num">{s.num}</div>
                <div className="service__flow-icon">{s.icon}</div>
                <p className="service__flow-title">{s.title}</p>
                <p className="service__flow-desc">{s.desc}</p>
              </div>
              {i < FLOW_STEPS.length - 1 && <span className="service__flow-arrow">›</span>}
            </div>
          ))}
        </div>
      </section>

      {/* 누구를 위한 서비스 */}
      <section className="service__targets">
        <h2 className="service__section-title">CareFlow는 누구를 위한 서비스인가요?</h2>
        <div className="service__targets-grid">
          {TARGETS.map((t) => (
           <div key={t.title} className="service__target-card">
             <img src={t.img} alt={t.title} className="service__target-img" />
             <div className="service__target-text">
              <p className="service__target-title">{t.title}</p>
              <p className="service__target-desc">{t.desc}</p>
             </div>
           </div>
          ))}
        </div>
      </section>

    </div>
  );
}