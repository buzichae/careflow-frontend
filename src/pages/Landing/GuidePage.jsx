import "../../styles/Landing/GuidePage.css";
import { useNavigate } from "react-router-dom";
import { Monitor, ClipboardList, Users, Truck, FileText, CreditCard, ShieldCheck, Wrench, Headphones, MessageCircle, BookOpen } from "lucide-react";

const STEPS = [
  { num: "01", icon: <Monitor size={28} color="#5B4FF5" />, title: "가전 등록", desc: "보유한 가전을 등록하고 통합 관리하세요." },
  { num: "02", icon: <ClipboardList size={28} color="#5B4FF5" />, title: "A/S 신청", desc: "증상과 희망 일정을 선택하여 A/S를 신청하세요." },
  { num: "03", icon: <Users size={28} color="#5B4FF5" />, title: "대행사 접수", desc: "신청 내용이 해당 대행사로 전달되어 접수됩니다." },
  { num: "04", icon: <Truck size={28} color="#5B4FF5" />, title: "기사 배정", desc: "대행사가 소속 기사에게 작업을 배정합니다." },
  { num: "05", icon: <Wrench size={28} color="#5B4FF5" />, title: "방문 및 수리", desc: "기사가 방문하여 수리를 진행합니다." },
  { num: "06", icon: <FileText size={28} color="#5B4FF5" />, title: "작업 보고서 제출", desc: "수리 완료 후 기사보고서가 제출됩니다." },
  { num: "07", icon: <CreditCard size={28} color="#5B4FF5" />, title: "고객 확인 및 결제", desc: "보고서를 확인하고 승인 후 결제를 진행합니다." },
  { num: "08", icon: <ShieldCheck size={28} color="#5B4FF5" />, title: "진단서 갱신", desc: "제품 건강 진단서가 자동으로 갱신됩니다." },
];

const USER_GUIDES = [
  {
    img: "/고객.png",
    role: "일반 고객",
    color: "#5B4FF5",
    desc: "내 가전을 등록하고 A/S를 신청하여 편리하게 관리하세요.",
    checks: ["가전 등록 및 관리", "A/S 신청 및 진행 상황 확인", "수리 이력 및 진단서 조회", "소모품 교체 알림 및 중고 거래"],
  },
  {
    img: "/기사.png",
    role: "수리 기사",
    color: "#00b894",
    desc: "배정된 작업을 수행하고 정확한 보고서로 신뢰를 쌓으세요.",
    checks: ["배정 알림 및 일정 확인", "단계별 상태 업데이트", "작업 보고서 작성 및 제출", "실적 및 정산 확인"],
  },
  {
    img: "/대행사.png",
    role: "대행사",
    color: "#0984e3",
    desc: "접수 관리부터 기사 배정, 정산까지 효율적으로 운영하세요.",
    checks: ["접수 목록 및 배정 관리", "기사 근무표 및 실적 관리", "정산 관리 및 리포트", "고객 민원 관리"],
  },
];

const SUPPORTS = [
  { icon: <Headphones size={32} color="#5B4FF5" />, title: "고객센터", sub: "1670-1234", desc: "평일 09:00 - 18:00", arrow: false },
  { icon: <MessageCircle size={32} color="#5B4FF5" />, title: "1:1 문의하기", desc: "궁금한 점을 문의하시면 빠르게 답변드리겠습니다.", arrow: true },
  { icon: <BookOpen size={32} color="#5B4FF5" />, title: "자주 묻는 질문", desc: "많은 분들이 궁금해하는 질문들을 확인해 보세요.", arrow: true },
];

export default function GuidePage() {
  const navigate = useNavigate();

  return (
    <div className="guide">

      {/* 네브바 */}
      <nav className="guide__nav">
        <div className="guide__logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <img src="/logo.png" alt="CareFlow" className="guide__logo-img" />
          CareFlow
        </div>
        <div className="guide__nav-links">
          {[
            { label: "서비스 소개", path: "/service" },
            { label: "주요 기능", path: "/features" },
            { label: "이용 방법", path: "/guide" },
          ].map((l, i) => (
            <a key={l.label} href="#"
              className={`guide__nav-link ${i === 2 ? "guide__nav-link--active" : ""}`}
              onClick={(e) => { e.preventDefault(); if (l.path !== "#") navigate(l.path); }}>
              {l.label}
            </a>
          ))}
        </div>
        <div className="guide__nav-actions">
          <button className="guide__btn guide__btn--ghost" onClick={() => navigate("/auth/login")}>로그인</button>
          <button className="guide__btn guide__btn--primary" onClick={() => navigate("/auth/signup")}>회원가입</button>
        </div>
      </nav>

      {/* 히어로 */}
      <section className="guide__hero">
        <div className="guide__hero-blob" />
        <div className="guide__hero-text">
          <p className="guide__eyebrow">이용 방법</p>
          <h1 className="guide__title">
            <span className="guide__title-accent">CareFlow</span>, 이렇게 이용하세요
          </h1>
          <p className="guide__desc">
            가전 등록부터 수리, 점검, 소모품 교체, 중고 거래까지<br />
            CareFlow가 처음부터 끝까지 함께합니다.
          </p>
        </div>
        <div className="guide__hero-visual">
          <img src="/main.png" alt="가전제품" className="guide__hero-img" />
        </div>
      </section>

      {/* 1. 이용 절차 */}
      <section className="guide__section">
        <div className="guide__section-header">
          <div className="guide__section-num">1</div>
          <h2 className="guide__section-title">CareFlow 서비스 이용 절차</h2>
        </div>
        <div className="guide__steps">
          {STEPS.map((s, i) => (
            <div key={s.num} className="guide__step-item">
              <div className="guide__step-card">
                <div className="guide__step-num">{s.num}</div>
                <div className="guide__step-icon">{s.icon}</div>
                <p className="guide__step-title">{s.title}</p>
                <p className="guide__step-desc">{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && <span className="guide__step-arrow">›</span>}
            </div>
          ))}
        </div>
        <div className="guide__tip">
          <span className="guide__tip-icon">💡</span>
          <span><strong>TIP</strong> 모든 진행 단계는 실시간으로 알림(SSE)되어 현재 상태를 바로 확인할 수 있습니다.</span>
        </div>
      </section>

      {/* 2. 유형별 가이드 */}
      <section className="guide__section">
        <div className="guide__section-header">
          <div className="guide__section-num">2</div>
          <h2 className="guide__section-title">이용자 유형별 이용 가이드</h2>
        </div>
        <div className="guide__user-grid">
          {USER_GUIDES.map((u) => (
            <div key={u.role} className="guide__user-card">
              <div className="guide__user-top">
                <img src={u.img} alt={u.role} className="guide__user-img" />
             <div>
                  <p className="guide__user-role" style={{ color: u.color }}>{u.role}</p>
                  <p className="guide__user-desc">{u.desc}</p>
                  <div className="guide__user-checks">
                   {u.checks.map((c) => (
                    <div key={c} className="guide__user-check">
                     <span className="guide__check-icon" style={{ background: u.color }}>✓</span>
                     <span>{c}</span>
                    </div>
                   ))}
                 </div>
             </div>
           </div>
        </div>
          ))}
        </div>
      </section>

      {/* 3. 도움말 */}
      <section className="guide__section">
        <div className="guide__section-header">
          <div className="guide__section-num">3</div>
          <h2 className="guide__section-title">도움이 필요하신가요?</h2>
        </div>
        <div className="guide__support-grid">
          {SUPPORTS.map((s) => (
            <div key={s.title} className="guide__support-card">
              <div className="guide__support-icon">{s.icon}</div>
              <div className="guide__support-info">
                <p className="guide__support-title">{s.title}</p>
                {s.sub && <p className="guide__support-sub">{s.sub}</p>}
                <p className="guide__support-desc">{s.desc}</p>
              </div>
              {s.arrow && <span className="guide__support-arrow">›</span>}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}