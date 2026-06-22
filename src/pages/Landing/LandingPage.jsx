import "../../styles/Landing/LandingPage.css";
import { UsersRound , ShieldCheck, Star ,Bell , LayoutGrid ,Wrench , RefreshCw , ChartNoAxesCombined} from "lucide-react";
import { useNavigate } from "react-router-dom";

const NAV_LINKS = [
  { label: "서비스 소개", path: "/service" },
  { label: "주요 기능", path: "/features" },
  { label: "이용 방법", path: "/guide" },
];

const FEATURES = [
  { icon: <LayoutGrid size={22} color="#5B4FF5" />, title: "통합 관리", desc: "여러 브랜드의 가전을 한 곳에서 편리하게 관리" },
  { icon: <Wrench size={22} color="#5B4FF5" />,title: "간편한 A/S 신청", desc: "원하는 시간에 맞는 기사 배정, 실시간 진행 상황 확인" },
  { icon: <ShieldCheck size={22} color="#5B4FF5" />, title: "제품 건강 진단서", desc: "수리/점검 이력을 기반으로 가전의 건강 상태를 한눈에" },
  { icon: <Bell size={22} color="#5B4FF5" />, title: "교체 알림", desc: "소모품 교체 시기를 알려주고 바로 구매까지 연결" },
  { icon: <RefreshCw size={22} color="#5B4FF5" />, title: "중고 거래 연계", desc: "신뢰할 수 있는 진단서를 기반으로 제값 받고 거래" },
];

const STATS = [
  { icon: <UsersRound size={40} color="#5B4FF5" />, label: "가입자 수", value: "120,000+", unit: "명" },
  { icon: <ShieldCheck size={40} color="#5B4FF5" />,label: "누적 A/S 건수", value: "320,000+", unit: "건" },
  { icon: <Star size={40} color="#5B4FF5" />,label: "고객 만족도", value: "4.8", unit: "/ 5.0" },
];

const BADGES = [
  { icon: <ShieldCheck size={16} color="#5B4FF5" />, label: "투명한 A/S" },
  { icon: <ChartNoAxesCombined size={16} color="#5B4FF5" />, label: "데이터 기반 관리" },
  { icon: <RefreshCw size={16} color="#5B4FF5" />, label: "순환 경제 실현" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  
  return (
    <div className="landing">
      <nav className="landing__nav">
        <div className="landing__logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <img src="/src/assets/logo.png" alt="CareFlow" className="landing__logo-img" />
          CareFlow
        </div>
        <div className="landing__nav-links">
          {NAV_LINKS.map((l) => (
           <a key={l.label} href="#" className="landing__nav-link"
            onClick={(e) => { e.preventDefault(); navigate(l.path); }}>
            {l.label}
           </a>
          ))}
        </div>
        <div className="landing__nav-actions">
          <button className="landing__btn landing__btn--ghost">로그인</button>
          <button className="landing__btn landing__btn--primary">회원가입</button>
        </div>
      </nav>

      <section className="landing__hero">
        <div className="landing__hero-blob" />
        <div className="landing__hero-text">
          <p className="landing__eyebrow">가전 생애주기 통합 관리 플랫폼</p>
          <h1 className="landing__title">
            가전 관리의 모든 순간,<br />
            <span className="landing__title-accent">CareFlow</span>가 함께합니다.
          </h1>
          <p className="landing__desc">
            수리, 점검, 교체부터 중고 거래까지<br />
            데이터로 더 스마트하게 관리하세요.
          </p>
          <div className="landing__hero-buttons">
            <button className="landing__btn landing__btn--primary landing__btn--lg">무료로 시작하기</button>
            <button className="landing__btn landing__btn--outline landing__btn--lg" onClick={() => navigate("/service")}>서비스 소개 보기 ▶</button>
          </div>
          <div className="landing__badges">
            {BADGES.map((b) => (
             <span key={b.label} className="landing__badge">
               {b.icon} {b.label}
             </span>
            ))}
         </div>
        </div>
        <div className="landing__hero-visual">
          <img src="/src/assets/main.png" alt="가전제품" className="landing__hero-img" />
        </div>
      </section>

      <section className="landing__features">
        <h2 className="landing__features-title">
          CareFlow 하나로 모든 가전을 스마트하게 관리하세요
        </h2>
        <div className="landing__features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="landing__feature-card">
              <div className="landing__feature-icon">{f.icon}</div>
              <p className="landing__feature-title">{f.title}</p>
              <p className="landing__feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing__stats">
  <div className="landing__stats-box">
    {STATS.map((s, i) => (
      <div key={s.label} className={"landing__stat" + (i > 0 ? " landing__stat--border" : "")}>
        {s.icon && <div className="landing__stat-icon">{s.icon}</div>}
        <div className="landing__stat-info">
          <p className="landing__stat-label">{s.label}</p>
          <p className="landing__stat-value">
            {s.value}<span className="landing__stat-unit">{s.unit}</span>
          </p>
        </div>
      </div>
    ))}
  </div>
</section>
     </div>
  );
}