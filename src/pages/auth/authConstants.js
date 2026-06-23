import customerImg from "../../assets/고객.png";
import agencyImg   from "../../assets/대행사.png";
import engineerImg from "../../assets/기사.png";

export const ROLES = [
  {
    key: "customer",
    img: customerImg,
    title: "일반 고객",
    desc: "가전을 등록하고 관리하며\n다양한 혜택을 받아보세요.",
    color: "#5B4FF5",
    bg: "#f0edff",
    loginTitle: "일반 고객 로그인",
    signupTitle: "일반 고객 회원가입",
    dashPath: "/customer/home",
  },
  {
    key: "agency",
    img: agencyImg,
    title: "대행사",
    desc: "여러 고객의 가전을 관리하고\n업무를 효율적으로 관리하세요.",
    color: "#22c55e",
    bg: "#e8f9f0",
    loginTitle: "대행사 로그인",
    signupTitle: "대행사 회원가입",
    dashPath: "/agency/dashboard",
  },
  {
    key: "engineer",
    img: engineerImg,
    title: "기사님",
    desc: "A/S 접수와 방문 일정,\n이력을 간편하게 관리하세요.",
    color: "#3b82f6",
    bg: "#eff6ff",
    loginTitle: "기사님 로그인",
    signupTitle: "기사님 회원가입",
    dashPath: "/engineer/dashboard",
  },
];
