import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Star,
  ChevronRight,
  Clock,
  ArrowLeft,
  Check,
  Wrench,
  Upload,
  X,
  MapPin,
  Calendar,
  AlertTriangle,
  FileText,
  Package,
  Receipt,
  Timer,
  ClipboardList,
  Loader,
  CreditCard,
  CalendarCheck,
} from "lucide-react";
import "../../styles/Customer/CustomerAS.css";
import ApplianceIcon from "./ApplianceIcon";
import {
  getMyAS,
  cancelAsRequest,
  getReport,
  approveReport,
  review,
  getAsRequestDetail,
} from "../../apis/as";

/* ─────────────────────────────────
   A/S 신청 플로우 데이터
───────────────────────────────── */
const MY_APPLIANCES = [
  {
    id: 1,
    name: "LG 오브제 냉장고",
    model: "M875GBB231",
    purchased: "2025.01.20",
    warranty: "2028.01.20",
    icon: "❄️",
  },
  {
    id: 2,
    name: "삼성 그랑데 세탁기",
    model: "WF24T6500KV",
    purchased: "2024.03.15",
    warranty: "2027.03.15",
    icon: "🫧",
  },
  {
    id: 3,
    name: "LG 휘센 에어컨",
    model: "FQ18VCWWA2",
    purchased: "2023.06.10",
    warranty: "2026.06.10",
    icon: "💨",
  },
  {
    id: 4,
    name: "LG 올레드 TV",
    model: "OLED55C4KNA",
    purchased: "2024.11.05",
    warranty: "2027.11.05",
    icon: "📺",
  },
];

/* symptom_code — expected_repair_costs 테이블 기준 (category_id + symptom_code) */
const SYMPTOMS = {
  /* 냉장고 category_id=11 */
  "❄️": [
    {
      code: "COOL-FAIL",
      label: "냉각 불량",
      desc: "냉장·냉동이 잘 안돼요",
      avgCost: 112000,
    },
    {
      code: "TEMP-ERR",
      label: "냉장 온도 이상",
      desc: "온도가 제대로 유지되지 않아요",
      avgCost: 112000,
    },
    {
      code: "FROST-ERR",
      label: "냉동실 성에",
      desc: "성에가 너무 많이 끼어요",
      avgCost: 112000,
    },
    {
      code: "TEMP-HIGH",
      label: "냉장실 온도 높음",
      desc: "냉장실이 충분히 차갑지 않아요",
      avgCost: 90000,
    },
    {
      code: "FAN-NOISE",
      label: "냉각팬 소음",
      desc: "팬에서 이상한 소리가 나요",
      avgCost: 122000,
    },
    {
      code: "SMELL-ERR",
      label: "냄새 이상",
      desc: "냉장고에서 냄새가 나요",
      avgCost: 88000,
    },
    {
      code: "FROZ-ERR",
      label: "냉동 기능 이상",
      desc: "냉동 기능이 작동하지 않아요",
      avgCost: 92000,
    },
  ],
  /* 세탁기 category_id=21 */
  "🫧": [
    {
      code: "STOP-MID",
      label: "세탁 중 멈춤",
      desc: "세탁 도중 갑자기 멈춰요",
      avgCost: 113000,
    },
    {
      code: "SPIN-FAIL",
      label: "탈수 미작동",
      desc: "탈수가 전혀 안 돼요",
      avgCost: 115000,
    },
    {
      code: "SMELL-WM",
      label: "세탁물 냄새",
      desc: "세탁 후에도 냄새가 나요",
      avgCost: 95000,
    },
    {
      code: "RINSE-FAIL",
      label: "헹굼 불량",
      desc: "헹굼이 제대로 안 돼요",
      avgCost: 105000,
    },
    {
      code: "LEAK-WM",
      label: "세탁조 누수",
      desc: "물이 새고 있어요",
      avgCost: null,
    },
    {
      code: "VIBRATE",
      label: "진동 과다",
      desc: "진동이나 소음이 너무 심해요",
      avgCost: null,
    },
  ],
  /* 에어컨 category_id=23 */
  "💨": [
    {
      code: "COOL-FAIL",
      label: "냉방 불량",
      desc: "냉방이 전혀 안 돼요",
      avgCost: 80000,
    },
    {
      code: "COOL-WEAK",
      label: "냉방 성능 저하",
      desc: "예전보다 덜 시원해요",
      avgCost: 135000,
    },
    {
      code: "NO-COOL",
      label: "냉방 안됨",
      desc: "차갑게 안 나와요",
      avgCost: 108000,
    },
    {
      code: "OUT-NOISE",
      label: "실외기 소음",
      desc: "실외기에서 이상한 소리가 나요",
      avgCost: 145000,
    },
    {
      code: "WIND-WEAK",
      label: "바람 약함",
      desc: "바람이 너무 약해요",
      avgCost: 68000,
    },
    {
      code: "COOL-CUT",
      label: "냉방 중단 반복",
      desc: "켜졌다 꺼졌다를 반복해요",
      avgCost: 90000,
    },
    {
      code: "POWER-OFF",
      label: "전원 꺼짐",
      desc: "갑자기 전원이 꺼져요",
      avgCost: 250000,
    },
    {
      code: "RC-ERR",
      label: "리모컨 오류",
      desc: "리모컨이 작동하지 않아요",
      avgCost: 135000,
    },
    { code: "LEAK-AC", label: "누수", desc: "물이 새고 있어요", avgCost: null },
  ],
  /* TV category_id=31 */
  "📺": [
    {
      code: "SCREEN-BL",
      label: "화면 깜빡임",
      desc: "화면이 깜빡거려요",
      avgCost: 178000,
    },
    {
      code: "HDMI-FAIL",
      label: "HDMI 연결 안됨",
      desc: "HDMI 기기가 인식되지 않아요",
      avgCost: 112000,
    },
    {
      code: "RC-FAIL",
      label: "리모컨 반응 없음",
      desc: "리모컨이 작동하지 않아요",
      avgCost: 68000,
    },
    {
      code: "VIDEO-LAG",
      label: "영상 지연",
      desc: "영상이 끊기거나 느려요",
      avgCost: 195000,
    },
    {
      code: "SCREEN-OFF",
      label: "화면 먹통",
      desc: "화면이 전혀 안 나와요",
      avgCost: 195000,
    },
    {
      code: "LINE-ERR",
      label: "화면 줄 생김",
      desc: "화면에 세로·가로 줄이 생겼어요",
      avgCost: null,
    },
    {
      code: "NO-SOUND",
      label: "소리 안남",
      desc: "소리가 전혀 안 나요",
      avgCost: null,
    },
  ],
  /* 기타 가전 (fallback) */
  default: [
    {
      code: "POWER-OFF",
      label: "전원 꺼짐",
      desc: "전원이 안 켜져요",
      avgCost: null,
    },
    {
      code: "FUNC-FAIL",
      label: "기능 오작동",
      desc: "특정 기능이 작동하지 않아요",
      avgCost: null,
    },
    {
      code: "NOISE",
      label: "소음 발생",
      desc: "이상한 소리가 나요",
      avgCost: null,
    },
  ],
};

/* regions — depth=1(시·도) → depth=2(구·시), visit_region_id는 depth=2 ID */
const REGIONS = {
  서울특별시: [
    "강남구",
    "강서구",
    "노원구",
    "마포구",
    "서초구",
    "송파구",
    "용산구",
    "종로구",
  ],
  경기도: [
    "부천시",
    "성남시",
    "수원시",
    "시흥시",
    "안양시",
    "의정부시",
    "화성시",
  ],
  인천광역시: ["남동구", "부평구", "서구", "연수구", "중구"],
  부산광역시: ["동래구", "부산진구", "사상구", "수영구", "해운대구"],
  대구광역시: ["달서구", "동구", "북구", "수성구", "중구"],
  대전광역시: ["대덕구", "서구", "유성구", "중구"],
};

/* 방문 시간 슬롯 (scheduled_time = 시작 시각 HH:MM) */
const TIME_SLOTS = [
  { value: "09:00", label: "오전 9시 ~ 11시" },
  { value: "11:00", label: "오전 11시 ~ 오후 1시" },
  { value: "14:00", label: "오후 2시 ~ 4시" },
  { value: "16:00", label: "오후 4시 ~ 6시" },
];

const TIME_LABEL = Object.fromEntries(
  TIME_SLOTS.map((t) => [t.value, t.label]),
);

/* 수동 배정 — 기사 목록 (mock) */
const MOCK_ENGINEERS = [
  {
    id: 1,
    name: "김민준",
    rating: 4.9,
    reviewCount: 128,
    brands: ["LG", "삼성"],
    skills: ["냉장고", "에어컨", "세탁기"],
    experience: "8년",
    tags: ["친절함", "신속", "정확"],
    available: {
      "2026-06-28": ["09:00", "14:00"],
      "2026-06-30": ["11:00", "16:00"],
      "2026-07-01": ["09:00", "11:00", "14:00"],
      "2026-07-03": ["14:00", "16:00"],
    },
  },
  {
    id: 2,
    name: "이재훈",
    rating: 4.8,
    reviewCount: 97,
    brands: ["삼성", "위니아"],
    skills: ["세탁기", "건조기", "에어컨"],
    experience: "6년",
    tags: ["꼼꼼함", "친절함"],
    available: {
      "2026-06-27": ["11:00", "14:00"],
      "2026-06-28": ["16:00"],
      "2026-07-02": ["09:00", "11:00"],
      "2026-07-04": ["14:00", "16:00"],
    },
  },
  {
    id: 3,
    name: "박현우",
    rating: 4.7,
    reviewCount: 214,
    brands: ["LG"],
    skills: ["냉장고", "TV", "공기청정기"],
    experience: "11년",
    tags: ["경력 풍부", "신속"],
    available: {
      "2026-06-29": ["09:00", "11:00"],
      "2026-06-30": ["14:00"],
      "2026-07-01": ["16:00"],
      "2026-07-05": ["09:00", "14:00"],
    },
  },
  {
    id: 4,
    name: "최지훈",
    rating: 4.9,
    reviewCount: 73,
    brands: ["LG", "삼성", "위니아"],
    skills: ["에어컨", "냉장고", "세탁기", "건조기"],
    experience: "5년",
    tags: ["다기종", "정확"],
    available: {
      "2026-06-27": ["09:00", "16:00"],
      "2026-06-29": ["11:00", "14:00"],
      "2026-07-02": ["09:00"],
      "2026-07-03": ["11:00", "14:00", "16:00"],
    },
  },
  {
    id: 5,
    name: "정수빈",
    rating: 4.8,
    reviewCount: 56,
    brands: ["삼성"],
    skills: ["TV", "세탁기", "건조기"],
    experience: "4년",
    tags: ["친절함", "꼼꼼함"],
    available: {
      "2026-06-28": ["11:00"],
      "2026-07-01": ["09:00", "14:00"],
      "2026-07-04": ["09:00", "11:00"],
      "2026-07-05": ["16:00"],
    },
  },
];

const ALL_BRANDS = ["LG", "삼성", "위니아", "대우"];
const ALL_SKILLS = ["냉장고", "세탁기", "에어컨", "건조기", "TV", "공기청정기"];

const AS_STEPS = ["가전 & 증상", "방문 일정", "최종 확인", "접수 완료"];

/* ── 스텝 바 ── */
function ASSteps({ step }) {
  return (
    <div className="cas-stepper">
      {AS_STEPS.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={n} className="cas-stepper__item">
            <div
              className={`cas-stepper__circle ${active ? "cas-stepper__circle--active" : ""} ${done ? "cas-stepper__circle--done" : ""}`}
            >
              {done ? <Check size={12} /> : n}
            </div>
            <span
              className={`cas-stepper__label ${active ? "cas-stepper__label--active" : ""} ${done ? "cas-stepper__label--done" : ""}`}
            >
              {label}
            </span>
            {i < AS_STEPS.length - 1 && (
              <div
                className={`cas-stepper__line-bar ${done ? "cas-stepper__line-bar--done" : ""}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── A/S 신청 플로우 ── */
function ASRequestFlow({ onClose }) {
  const [step, setStep] = useState(1);
  const [appliance, setAppliance] = useState(null);
  const [symptomCode, setSymptomCode] = useState("");
  const [symptomDesc, setSymptomDesc] = useState("");
  const [images, setImages] = useState([]); // { file, url }[]
  const [regionParent, setRegionParent] = useState("");
  const [regionSub, setRegionSub] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  /* 배정 방식 */
  const [assignType, setAssignType] = useState(""); // "AUTO" | "MANUAL"
  /* 수동 배정 */
  const [engBrand, setEngBrand] = useState("");
  const [engSkill, setEngSkill] = useState("");
  const [selectedEng, setSelectedEng] = useState(null);
  /* 날짜·시간 (기사 선택 후 → 기사 가능 일정 기반) */
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const imgRef = useRef(null);

  const symptoms = appliance
    ? (SYMPTOMS[appliance.icon] ?? SYMPTOMS.default)
    : [];
  const subRegions = regionParent ? REGIONS[regionParent] : [];
  const selectedSym = symptoms.find((s) => s.code === symptomCode);

  /* 수동: 필터 적용 기사 목록 */
  const filteredEngs = MOCK_ENGINEERS.filter(
    (e) =>
      (!engBrand || e.brands.includes(engBrand)) &&
      (!engSkill || e.skills.includes(engSkill)),
  );

  /* 수동: 선택된 기사의 가능 날짜 목록 */
  const availableDates = selectedEng
    ? Object.keys(selectedEng.available).sort()
    : [];
  /* 수동: 선택된 날짜의 가능 시간 슬롯 */
  const availableTimes =
    selectedEng && schedDate ? (selectedEng.available[schedDate] ?? []) : [];

  /* 유효성 */
  const step1Valid = appliance && symptomCode;
  const baseStep2 = regionSub && addressDetail.trim() && schedDate && schedTime;
  const step2Valid =
    assignType === "AUTO"
      ? baseStep2
      : assignType === "MANUAL"
        ? regionSub &&
          addressDetail.trim() &&
          selectedEng &&
          schedDate &&
          schedTime
        : false;

  function addImages(files) {
    const remaining = 5 - images.length;
    const added = Array.from(files)
      .slice(0, remaining)
      .map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setImages((prev) => [...prev, ...added]);
  }
  function removeImage(i) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }
  function handleRegionParent(v) {
    setRegionParent(v);
    setRegionSub("");
  }
  function handleSelectEng(eng) {
    setSelectedEng(eng === selectedEng ? null : eng);
    setSchedDate("");
    setSchedTime("");
  }
  function handleSchedDate(d) {
    setSchedDate(d);
    setSchedTime("");
  }

  /* 확인 화면용 요약 행 */
  const confirmRows = [
    {
      label: "신청 가전",
      value: appliance ? `${appliance.name} (${appliance.model})` : "",
    },
    {
      label: "증상",
      value: selectedSym ? `${selectedSym.label} (${symptomCode})` : "",
    },
    { label: "증상 상세", value: symptomDesc || "—" },
    {
      label: "예상 수리 비용",
      value:
        selectedSym?.avgCost != null
          ? `${selectedSym.avgCost.toLocaleString()} 원`
          : "데이터 수집 중",
      highlight: true,
    },
    {
      label: "배정 방식",
      value: assignType === "AUTO" ? "자동 배정" : "수동 배정",
    },
    ...(assignType === "MANUAL" && selectedEng
      ? [
          {
            label: "선택 기사",
            value: `${selectedEng.name} 기사 (⭐ ${selectedEng.rating})`,
          },
        ]
      : []),
    {
      label: "방문 지역",
      value: regionSub ? `${regionParent} ${regionSub}` : "",
    },
    { label: "상세 주소", value: addressDetail },
    { label: "방문 날짜", value: schedDate },
    { label: "방문 시간", value: TIME_LABEL[schedTime] ?? "" },
  ];

  return (
    <div className="cas-flow-wrap">
      <ASSteps step={step} />

      {/* ── Step 1: 가전 선택 + 증상 입력 ── */}
      {step === 1 && (
        <div className="cas-req-body">
          {/* 가전 선택 */}
          <div className="cas-flow-card">
            <h3 className="cas-flow-card__title">
              문제가 발생한 가전을 선택해주세요{" "}
              <span className="cas-req-required">*</span>
            </h3>
            <div className="cas-product-grid">
              {MY_APPLIANCES.map((a) => (
                <button
                  key={a.id}
                  className={`cas-product-card ${appliance?.id === a.id ? "cas-product-card--selected" : ""}`}
                  onClick={() => {
                    setAppliance(a);
                    setSymptomCode("");
                  }}
                >
                  {appliance?.id === a.id && (
                    <span className="cas-product-card__check">
                      <Check size={12} />
                    </span>
                  )}
                  <div className="cas-product-card__img">{a.icon}</div>
                  <p className="cas-product-card__name">{a.name}</p>
                  <p className="cas-product-card__model">{a.model}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 증상 선택 */}
          {appliance && (
            <div className="cas-flow-card">
              <h3 className="cas-flow-card__title">
                증상을 선택해주세요 <span className="cas-req-required">*</span>
              </h3>
              <div className="cas-symptom-grid">
                {symptoms.map((s) => (
                  <button
                    key={s.code}
                    className={`cas-symptom-chip ${symptomCode === s.code ? "cas-symptom-chip--active" : ""}`}
                    onClick={() => setSymptomCode(s.code)}
                  >
                    <span className="cas-symptom-chip__label">{s.label}</span>
                    <span className="cas-symptom-chip__desc">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 증상 상세 + 사진 */}
          {symptomCode && (
            <div className="cas-flow-card">
              <h3 className="cas-flow-card__title">
                증상을 더 자세히 알려주세요{" "}
                <span className="cas-req-optional">(선택)</span>
              </h3>

              <textarea
                className="cas-symptom-textarea"
                placeholder="예: 냉장고 아래 칸이 설정 온도보다 2~3도 높게 유지됩니다. 밤에 소리가 심해집니다."
                value={symptomDesc}
                onChange={(e) => setSymptomDesc(e.target.value)}
                rows={3}
              />

              {/* 사진 첨부 (image_urls → JSON) */}
              <p className="cas-upload-label">
                사진 첨부{" "}
                <span className="cas-req-optional">(선택, 최대 5장)</span>
              </p>
              <div className="cas-img-row">
                {images.map((img, i) => (
                  <div key={i} className="cas-img-thumb">
                    <img src={img.url} alt={`첨부${i + 1}`} />
                    <button
                      className="cas-img-remove"
                      onClick={() => removeImage(i)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <div
                    className="cas-img-add"
                    onClick={() => imgRef.current?.click()}
                  >
                    <Upload size={18} />
                    <span>추가</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      ref={imgRef}
                      style={{ display: "none" }}
                      onChange={(e) => addImages(e.target.files)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="cas-req-footer">
            <button className="cas-req-btn-secondary" onClick={onClose}>
              취소
            </button>
            <button
              className="cas-req-btn-primary"
              disabled={!step1Valid}
              onClick={() => setStep(2)}
            >
              다음 — 방문 일정 <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: 방문 일정 ── */}
      {step === 2 && (
        <div className="cas-req-body">
          {/* 배정 방식 선택 */}
          <div className="cas-flow-card">
            <h3 className="cas-flow-card__title">
              기사 배정 방식을 선택해주세요{" "}
              <span className="cas-req-required">*</span>
            </h3>
            <div className="cas-assign-row">
              <button
                className={`cas-assign-card ${assignType === "AUTO" ? "cas-assign-card--active" : ""}`}
                onClick={() => {
                  setAssignType("AUTO");
                  setSelectedEng(null);
                  setSchedDate("");
                  setSchedTime("");
                }}
              >
                {assignType === "AUTO" && (
                  <span className="cas-assign-check">
                    <Check size={11} />
                  </span>
                )}
                <div className="cas-assign-icon">🤖</div>
                <p className="cas-assign-title">자동 배정</p>
                <p className="cas-assign-desc">
                  지역·브랜드·보유 기술 기반 우선순위 점수로 최적의 기사를
                  자동으로 배정해 드립니다.
                </p>
                <div className="cas-assign-tags">
                  <span>빠른 접수</span>
                  <span>최적 매칭</span>
                </div>
              </button>
              <button
                className={`cas-assign-card ${assignType === "MANUAL" ? "cas-assign-card--active" : ""}`}
                onClick={() => {
                  setAssignType("MANUAL");
                  setSchedDate("");
                  setSchedTime("");
                }}
              >
                {assignType === "MANUAL" && (
                  <span className="cas-assign-check">
                    <Check size={11} />
                  </span>
                )}
                <div className="cas-assign-icon">👷</div>
                <p className="cas-assign-title">수동 배정</p>
                <p className="cas-assign-desc">
                  지역·브랜드·보유 기술 필터로 기사를 직접 검색하고 선택할 수
                  있습니다.
                </p>
                <div className="cas-assign-tags">
                  <span>직접 선택</span>
                  <span>일정 조율</span>
                </div>
              </button>
            </div>
          </div>

          {/* 방문 지역 + 상세 주소 (공통) */}
          {assignType && (
            <div className="cas-flow-card">
              <h3 className="cas-flow-card__title">
                <MapPin size={15} style={{ verticalAlign: "middle" }} /> 방문
                지역 <span className="cas-req-required">*</span>
              </h3>
              <div className="cas-region-row">
                <select
                  className="cas-region-select"
                  value={regionParent}
                  onChange={(e) => handleRegionParent(e.target.value)}
                >
                  <option value="">시·도 선택</option>
                  {Object.keys(REGIONS).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <select
                  className="cas-region-select"
                  value={regionSub}
                  onChange={(e) => setRegionSub(e.target.value)}
                  disabled={!regionParent}
                >
                  <option value="">구·시 선택</option>
                  {subRegions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <label className="cas-field-label" style={{ marginTop: 14 }}>
                상세 주소 <span className="cas-req-required">*</span>
                <span className="cas-field-hint"> (동·호수·번지 등)</span>
              </label>
              <input
                className="cas-addr-input"
                placeholder="예: 역삼동 123-45, 101동 502호"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
              />
            </div>
          )}

          {/* ── 자동 배정: 날짜·시간 자유 선택 ── */}
          {assignType === "AUTO" && (
            <div className="cas-flow-card">
              <h3 className="cas-flow-card__title">
                <Calendar size={15} style={{ verticalAlign: "middle" }} /> 희망
                방문 날짜 <span className="cas-req-required">*</span>
              </h3>
              <p className="cas-req-sub">
                배정된 기사의 일정에 따라 실제 방문 날짜가 조정될 수 있습니다.
              </p>
              <input
                type="date"
                className="cas-date-input"
                value={schedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setSchedDate(e.target.value);
                  setSchedTime("");
                }}
              />
              {schedDate && (
                <>
                  <h3
                    className="cas-flow-card__title"
                    style={{ marginTop: 18 }}
                  >
                    희망 시간대 <span className="cas-req-required">*</span>
                  </h3>
                  <div className="cas-time-slots">
                    {TIME_SLOTS.map((t) => (
                      <button
                        key={t.value}
                        className={`cas-time-chip ${schedTime === t.value ? "cas-time-chip--active" : ""}`}
                        onClick={() => setSchedTime(t.value)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── 수동 배정: 기사 검색 + 선택 + 일정 ── */}
          {assignType === "MANUAL" && (
            <>
              {/* 기사 필터 */}
              <div className="cas-flow-card">
                <h3 className="cas-flow-card__title">기사 필터</h3>
                <div className="cas-eng-filter-section">
                  <div className="cas-eng-filter-group">
                    <p className="cas-eng-filter-label">브랜드</p>
                    <div className="cas-filter-chips">
                      <button
                        className={`cas-filter-chip ${engBrand === "" ? "cas-filter-chip--active" : ""}`}
                        onClick={() => setEngBrand("")}
                      >
                        전체
                      </button>
                      {ALL_BRANDS.map((b) => (
                        <button
                          key={b}
                          className={`cas-filter-chip ${engBrand === b ? "cas-filter-chip--active" : ""}`}
                          onClick={() => setEngBrand(engBrand === b ? "" : b)}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="cas-eng-filter-group">
                    <p className="cas-eng-filter-label">보유 기술</p>
                    <div className="cas-filter-chips">
                      <button
                        className={`cas-filter-chip ${engSkill === "" ? "cas-filter-chip--active" : ""}`}
                        onClick={() => setEngSkill("")}
                      >
                        전체
                      </button>
                      {ALL_SKILLS.map((s) => (
                        <button
                          key={s}
                          className={`cas-filter-chip ${engSkill === s ? "cas-filter-chip--active" : ""}`}
                          onClick={() => setEngSkill(engSkill === s ? "" : s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 기사 목록 */}
              <div className="cas-flow-card">
                <h3 className="cas-flow-card__title">
                  기사 선택 <span className="cas-req-required">*</span>
                  <span className="cas-req-optional">
                    {" "}
                    — {filteredEngs.length}명
                  </span>
                </h3>
                {filteredEngs.length === 0 ? (
                  <p className="cas-eng-empty">
                    필터 조건에 맞는 기사가 없습니다.
                  </p>
                ) : (
                  <div className="cas-eng-grid">
                    {filteredEngs.map((eng) => (
                      <button
                        key={eng.id}
                        className={`cas-eng-card ${selectedEng?.id === eng.id ? "cas-eng-card--selected" : ""}`}
                        onClick={() => handleSelectEng(eng)}
                      >
                        {selectedEng?.id === eng.id && (
                          <span className="cas-assign-check">
                            <Check size={11} />
                          </span>
                        )}
                        <div className="cas-eng-card__avatar">
                          {eng.name[0]}
                        </div>
                        <p className="cas-eng-card__name">{eng.name} 기사</p>
                        <p className="cas-eng-card__rating">
                          ⭐ {eng.rating} <span>({eng.reviewCount}건)</span>
                        </p>
                        <p className="cas-eng-card__exp">
                          경력 {eng.experience}
                        </p>
                        <div className="cas-eng-card__brands">
                          {eng.brands.map((b) => (
                            <span key={b}>{b}</span>
                          ))}
                        </div>
                        <div className="cas-eng-card__skills">
                          {eng.skills.map((s) => (
                            <span key={s}>{s}</span>
                          ))}
                        </div>
                        <div className="cas-eng-card__tags">
                          {eng.tags.map((t) => (
                            <span key={t} className="cas-eng-card__tag">
                              {t}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 선택 기사 가능 날짜 */}
              {selectedEng && (
                <div className="cas-flow-card">
                  <h3 className="cas-flow-card__title">
                    <Calendar size={15} style={{ verticalAlign: "middle" }} />{" "}
                    {selectedEng.name} 기사 가능 날짜{" "}
                    <span className="cas-req-required">*</span>
                  </h3>
                  <p className="cas-req-sub">
                    기사님의 스케줄 기반으로 예약 가능한 날짜입니다.
                  </p>
                  <div className="cas-avail-dates">
                    {availableDates.map((d) => {
                      const dt = new Date(d);
                      const weekday = [
                        "일",
                        "월",
                        "화",
                        "수",
                        "목",
                        "금",
                        "토",
                      ][dt.getDay()];
                      const label = `${dt.getMonth() + 1}/${dt.getDate()} (${weekday})`;
                      return (
                        <button
                          key={d}
                          className={`cas-avail-date ${schedDate === d ? "cas-avail-date--active" : ""} ${weekday === "토" ? "cas-avail-date--sat" : ""} ${weekday === "일" ? "cas-avail-date--sun" : ""}`}
                          onClick={() => handleSchedDate(d)}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* 선택된 날짜의 가능 시간 */}
                  {schedDate && (
                    <>
                      <h3
                        className="cas-flow-card__title"
                        style={{ marginTop: 18 }}
                      >
                        가능 시간대 <span className="cas-req-required">*</span>
                      </h3>
                      <div className="cas-time-slots">
                        {availableTimes.map((t) => (
                          <button
                            key={t}
                            className={`cas-time-chip ${schedTime === t ? "cas-time-chip--active" : ""}`}
                            onClick={() => setSchedTime(t)}
                          >
                            {TIME_LABEL[t]}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          <div className="cas-req-footer">
            <button
              className="cas-req-btn-secondary"
              onClick={() => setStep(1)}
            >
              <ArrowLeft size={14} /> 이전
            </button>
            <button
              className="cas-req-btn-primary"
              disabled={!step2Valid}
              onClick={() => setStep(3)}
            >
              다음 — 최종 확인 <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: 최종 확인 ── */}
      {step === 3 && (
        <div className="cas-req-body">
          <div className="cas-flow-card">
            <h3 className="cas-flow-card__title">신청 내용을 확인해주세요</h3>
            <p className="cas-req-sub">
              접수 후 대행사 배정 → 기사 확정 순으로 진행됩니다. 초기 상태:{" "}
              <strong>접수 대기(PENDING)</strong>
            </p>

            {images.length > 0 && (
              <div className="cas-img-row" style={{ marginBottom: 16 }}>
                {images.map((img, i) => (
                  <div key={i} className="cas-img-thumb cas-img-thumb--confirm">
                    <img src={img.url} alt={`첨부${i + 1}`} />
                  </div>
                ))}
              </div>
            )}

            <div className="cas-confirm-table">
              {confirmRows.map(({ label, value, highlight }) => (
                <div
                  key={label}
                  className={`cas-confirm-row${highlight ? " cas-confirm-row--highlight" : ""}`}
                >
                  <span className="cas-confirm-row__label">{label}</span>
                  <span className="cas-confirm-row__value">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="cas-req-footer">
            <button
              className="cas-req-btn-secondary"
              onClick={() => setStep(2)}
            >
              <ArrowLeft size={14} /> 이전
            </button>
            <button className="cas-req-btn-primary" onClick={() => setStep(4)}>
              A/S 신청 접수 <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: 접수 완료 ── */}
      {step === 4 && (
        <div className="cas-req-body cas-req-body--complete">
          <div className="cas-complete-icon">📋</div>
          <h2 className="cas-complete-title">A/S 신청이 접수되었어요!</h2>
          <p className="cas-complete-sub">
            {assignType === "AUTO"
              ? "대행사에서 최적 기사를 배정하면 알림으로 안내해 드립니다."
              : `${selectedEng?.name} 기사님과 방문 일정이 확정되었습니다.`}
          </p>

          <div className="cas-complete-card">
            <div className="cas-complete-card__appliance">
              <span style={{ fontSize: 32 }}>{appliance?.icon}</span>
              <div>
                <p className="cas-complete-card__name">{appliance?.name}</p>
                <p className="cas-complete-card__model">{appliance?.model}</p>
              </div>
            </div>
            <div className="cas-confirm-table" style={{ marginTop: 12 }}>
              {confirmRows.slice(1).map(({ label, value, highlight }) => (
                <div
                  key={label}
                  className={`cas-confirm-row${highlight ? " cas-confirm-row--highlight" : ""}`}
                >
                  <span className="cas-confirm-row__label">{label}</span>
                  <span className="cas-confirm-row__value">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="cas-req-footer cas-req-footer--center">
            <button className="cas-req-btn-primary" onClick={onClose}>
              신청 내역으로 돌아가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const FILTER_TABS = [
  { key: "전체", label: "전체" },
  { key: "PENDING", label: "접수 대기" },
  { key: "AGENCY_RECEIVED", label: "대행사 접수" },
  { key: "ASSIGNED", label: "기사 배정" },
  { key: "ACCEPTED", label: "예약 확정" },
  { key: "ENGINEER_DEPARTED", label: "기사 출발" },
  { key: "ENGINEER_ARRIVED", label: "기사 도착" },
  { key: "IN_PROGRESS", label: "수리 진행 중" },
  { key: "COMPLETED", label: "결제 대기" },
  { key: "PAID", label: "A/S 완료" },
  { key: "CANCELLED", label: "취소" },
];

const STATUS_META = {
  PENDING: { style: "gray", label: "접수 대기", actions: ["예약 취소"] },
  AGENCY_RECEIVED: { style: "gray", label: "대행사 접수" },
  ASSIGNED: { style: "purple", label: "기사 배정 완료" },
  ACCEPTED: { style: "purple", label: "예약 확정" },
  ENGINEER_DEPARTED: { style: "blue", label: "기사 출발" },
  ENGINEER_ARRIVED: { style: "blue", label: "기사 도착" },
  IN_PROGRESS: { style: "blue", label: "수리 진행 중" },
  COMPLETED: {
    style: "red",
    label: "결제 대기",
    actions: ["수리 보고서 보기", "결제하기"],
  },
  PAID: {
    style: "green",
    label: "A/S 완료",
    actions: ["수리 보고서 보기", "기사님 리뷰 남기기"],
  },
  CANCELLED: { style: "gray", label: "취소" },
};

const ACTION_STYLE = {
  상세보기: "outline",
  "예약 취소": "outline",
  "수리 보고서 보기": "outline",
  "기사님 리뷰 남기기": "primary",
  "작성한 리뷰 보기": "outline",
  결제하기: "danger",
};

function getActionsByStatus(status, hasReview) {
  switch (status) {
    case "PENDING":
    case "AGENCY_RECEIVED":
      return ["예약 취소"];
    case "ASSIGNED":
    case "ACCEPTED":
      return ["상세보기"];
    case "ENGINEER_DEPARTED":
    case "ENGINEER_ARRIVED":
    case "IN_PROGRESS":
      return ["상세보기"];
    case "COMPLETED":
      return ["수리 보고서 보기"];
    case "PAID":
      return hasReview
        ? ["수리 보고서 보기", "작성한 리뷰 보기"]
        : ["수리 보고서 보기", "기사님 리뷰 남기기"];
    case "CANCELLED":
      return [];
    default:
      return [];
  }
}

/* ── 수리 보고서 모달 ── */
function ReportModal({ item, report, onApprove, onClose }) {
  if (!report) return null;

  function fmt(dt) {
    return dt ? dt.slice(0, 16).replace("T", " ") : "—";
  }

  function fmtDuration(min) {
    if (!min) return "—";
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}시간 ${m > 0 ? m + "분" : ""}` : `${m}분`;
  }

  const imageList = report.imageUrls
    ? report.imageUrls
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="cas-report-overlay" onClick={onClose}>
      <div className="cas-report-modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="cas-report-modal__header">
          <div className="cas-report-modal__header-left">
            <FileText size={17} color="#7c5cf7" />
            <div>
              <p className="cas-report-modal__sup">수리 보고서</p>
              <h3 className="cas-report-modal__title">
                {item.appliance ?? `가전 #${report.requestId}`}
              </h3>
            </div>
          </div>
          <button className="cas-report-modal__close" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        {/* 기사 + 작업 시간 */}
        <div className="cas-report-modal__meta">
          <div className="cas-report-meta-item">
            <span className="cas-report-meta-item__label">담당 기사</span>
            <span className="cas-report-meta-item__value">
              {report.engineerName ?? "—"}
            </span>
          </div>
          <div className="cas-report-meta-item">
            <Timer size={13} color="#7c5cf7" />
            <span className="cas-report-meta-item__label">작업 시간</span>
            <span className="cas-report-meta-item__value">
              {fmtDuration(report.workDurationMin)}
            </span>
          </div>
          <div className="cas-report-meta-item">
            <span className="cas-report-meta-item__label">제출일</span>
            <span className="cas-report-meta-item__value">
              {fmt(report.submittedAt)}
            </span>
          </div>
        </div>

        <div className="cas-report-modal__body">
          {/* A/S 결과 */}
          <div className="cas-report-section">
            <div className="cas-report-section__head">
              <FileText size={14} color="#7c5cf7" />
              <h4>A/S 결과</h4>
            </div>
            <p className="cas-report-diagnosis">
              {report.diagnosisResult ?? "—"}
            </p>
          </div>

          {/* 청구 금액 */}
          <div className="cas-report-section">
            <div className="cas-report-section__head">
              <Receipt size={14} color="#7c5cf7" />
              <h4>청구 금액</h4>
            </div>
            <div className="cas-report-cost">
              <div className="cas-report-cost__row cas-report-cost__row--total">
                <span>최종 청구 금액</span>
                <span>
                  {report.finalAmount != null
                    ? report.finalAmount.toLocaleString() + "원"
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* 기사 메모 */}
          {report.memo && (
            <div className="cas-report-section">
              <div className="cas-report-section__head">
                <Wrench size={14} color="#7c5cf7" />
                <h4>기사 메모</h4>
              </div>
              <p className="cas-report-note">{report.memo}</p>
            </div>
          )}

          {/* 사진 */}
          {imageList.length > 0 && (
            <div className="cas-report-section">
              <div className="cas-report-section__head">
                <Package size={14} color="#7c5cf7" />
                <h4>첨부 사진</h4>
              </div>
              <div className="cas-report-images">
                {imageList.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`수리 사진 ${i + 1}`}
                    className="cas-report-image"
                  />
                ))}
              </div>
            </div>
          )}

          {/* 승인 정보 (이미 승인된 경우) */}
          {report.customerApproved && report.approvedAt && (
            <div className="cas-report-section">
              <div className="cas-report-section__head">
                <FileText size={14} color="#10b981" />
                <h4 style={{ color: "#10b981" }}>승인 완료</h4>
              </div>
              <p className="cas-report-note">{fmt(report.approvedAt)} 승인됨</p>
            </div>
          )}
        </div>

        <div className="cas-report-modal__footer">
          <button
            className="cas-report-modal__btn cas-report-modal__btn--outline"
            onClick={onClose}
          >
            닫기
          </button>
          {onApprove && (
            <button
              className="cas-report-modal__btn cas-report-modal__btn--primary"
              onClick={onApprove}
            >
              보고서 승인 및 결제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


/* ── 리뷰 모달 ── */
function ReviewModal({ item, existingReview, onSubmit, onClose }) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const readOnly = !!existingReview;

  const STAR_LABELS = [
    "",
    "별로예요",
    "그저 그래요",
    "보통이에요",
    "좋아요",
    "최고예요!",
  ];
  const displayRating = hovered || rating;

  return (
    <div className="cas-review-overlay" onClick={onClose}>
      <div className="cas-review-modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="cas-review-modal__header">
          <div className="cas-review-modal__header-left">
            <Star size={17} fill="#f59e0b" color="#f59e0b" />
            <div>
              <p className="cas-review-modal__sup">
                {readOnly ? "작성한 리뷰" : "기사님 리뷰 남기기"}
              </p>
              <h3 className="cas-review-modal__title">{item.brand} {item.modelName}</h3>
            </div>
          </div>
          <button className="cas-review-modal__close" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        {/* 기사 정보 */}
        <div className="cas-review-modal__engineer">
          <div className="cas-review-eng-avatar">
            {(item.engineerName ?? existingReview?.engineerName ?? "?")[0]}
          </div>
          <div>
            <p className="cas-review-eng-name">
              {item.engineerName ?? existingReview?.engineerName ?? "담당 기사"}
            </p>
            <p className="cas-review-eng-sub">
              담당 기사 · {item.scheduledDate ?? ""}
            </p>
          </div>
        </div>

        <div className="cas-review-modal__body">
          {/* 별점 */}
          <div className="cas-review-section">
            <p className="cas-review-section__label">
              종합 평점<span className="cas-review-required">*</span>
            </p>
            <div className="cas-review-stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className="cas-review-star-btn"
                  onMouseEnter={() => !readOnly && setHovered(n)}
                  onMouseLeave={() => !readOnly && setHovered(0)}
                  onClick={() => !readOnly && setRating(n)}
                  disabled={readOnly}
                >
                  <Star
                    size={34}
                    fill={n <= displayRating ? "#f59e0b" : "none"}
                    color={n <= displayRating ? "#f59e0b" : "#d1d5db"}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
            {displayRating > 0 && (
              <p className="cas-review-rating-label">
                {STAR_LABELS[displayRating]}
              </p>
            )}
          </div>

          {/* 상세 후기 */}
          <div className="cas-review-section">
            <p className="cas-review-section__label">
              상세 후기
              <span className="cas-review-optional"> (선택)</span>
            </p>
            {readOnly ? (
              <p className="cas-review-comment-view">
                {comment || "작성된 후기가 없습니다."}
              </p>
            ) : (
              <textarea
                className="cas-review-textarea"
                placeholder="기사님의 서비스는 어떠셨나요? 다른 고객에게 도움이 될 수 있는 솔직한 후기를 남겨주세요."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={4}
              />
            )}
            {!readOnly && (
              <p className="cas-review-char-count">{comment.length} / 500</p>
            )}
          </div>

          {readOnly && (
            <p className="cas-review-date">
              작성일: {existingReview.createdAt}
            </p>
          )}
        </div>

        <div className="cas-review-modal__footer">
          <button
            className="cas-review-modal__btn cas-review-modal__btn--outline"
            onClick={onClose}
          >
            {readOnly ? "닫기" : "취소"}
          </button>
          {!readOnly && (
            <button
              className="cas-review-modal__btn cas-review-modal__btn--primary"
              disabled={rating === 0}
              onClick={() => onSubmit({ rating, comment })}
            >
              리뷰 등록하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 예약 취소 모달 ── */
function CancelModal({ item, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const canConfirm = reason.trim().length > 0;

  return (
    <div className="cas-cancel-overlay" onClick={onClose}>
      <div className="cas-cancel-modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="cas-cancel-modal__header">
          <div className="cas-cancel-modal__header-left">
            <AlertTriangle size={18} color="#ef4444" />
            <h3>예약 취소</h3>
          </div>
          <button className="cas-cancel-modal__close" onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        {/* 대상 A/S 정보 */}
        <div className="cas-cancel-modal__target">
          <p className="cas-cancel-modal__target-name">{item.appliance}</p>
          <p className="cas-cancel-modal__target-info">
            {item.brand} {item.modelName} · {item.scheduledDate}{" "}
            {item.scheduledTime}
          </p>
        </div>

        {/* 본문 */}
        <div className="cas-cancel-modal__body">
          <p className="cas-cancel-modal__label">
            취소 사유 <span style={{ color: "#ef4444" }}>*</span>
            <span className="cas-cancel-modal__label-hint"> (최대 255자)</span>
          </p>
          <textarea
            className="cas-cancel-textarea"
            placeholder="취소 사유를 입력해주세요."
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 255))}
            rows={4}
            autoFocus
          />
          <p className="cas-cancel-char-count">{reason.length} / 255</p>

          <div className="cas-cancel-modal__notice">
            <AlertTriangle size={12} />
            <span>
              대행사 배차 확정 이전에만 취소가 가능합니다. 취소 후에는 되돌릴 수
              없습니다.
            </span>
          </div>
        </div>

        {/* 버튼 */}
        <div className="cas-cancel-modal__footer">
          <button
            className="cas-cancel-modal__btn cas-cancel-modal__btn--outline"
            onClick={onClose}
          >
            닫기
          </button>
          <button
            className="cas-cancel-modal__btn cas-cancel-modal__btn--danger"
            disabled={!canConfirm}
            onClick={() => onConfirm(reason.trim())}
          >
            취소 확정
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CustomerAS() {
  const [activeFilter, setActiveFilter] = useState("전체");
  const [showReserve, setShowReserve] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [asList, setAsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (searchParams.get("reserve") === "true") {
      setShowReserve(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    getMyAS()
      .then((res) => setAsList(res.data))
      .catch((err) => console.error("A/S 목록 조회 실패:", err))
      .finally(() => setLoading(false));
  }, []);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [reportTarget, setReportTarget] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null); // { item, existingReview? }
  const [reviews, setReviews] = useState({});

  function handlePayment(requestId) {
    setAsList((prev) =>
      prev.map((item) =>
        item.requestId === requestId ? { ...item, status: "PAID" } : item,
      ),
    );
  }

  async function handleReviewSubmit({ rating, content }) {
    const item = reviewTarget.item;
    try {
      await review(item.requestId, rating, content);
      // API 성공 후 로컬 상태 업데이트 → 버튼이 "작성한 리뷰 보기"로 전환됨
      setReviews((prev) => ({
        ...prev,
        [item.requestId]: {
          rating,
          content,
          createdAt: new Date().toISOString().slice(0, 10),
        },
      }));
      setReviewTarget(null);
    } catch (error) {
      alert(error.response?.data?.message || "리뷰 작성에 실패했습니다.");
    }
  }

  async function handleCancelConfirm(reason) {
    try {
      await cancelAsRequest(cancelTarget.requestId, reason);
      setAsList((prev) =>
        prev.map((item) =>
          item.requestId === cancelTarget.requestId
            ? { ...item, status: "CANCELLED", cancelReason: reason }
            : item,
        ),
      );
    } catch (error) {
      alert(error.response?.data?.message || "예약 취소에 실패했습니다.");
    }
    setCancelTarget(null);
  }

  async function handleReportView(item) {
    try {
      const res = await getReport(item.reportId);
      setReportTarget({ item, report: res.data });
    } catch (error) {
      alert(error.response?.data?.message || "보고서를 불러오지 못했습니다.");
    }
  }

  async function handleReviewOpen(item) {
    try {
      const res = await getAsRequestDetail(item.requestId);
      const detail = res.data;
      setReviewTarget({ item: { ...item, engineerName: detail.engineerName } });
    } catch (error) {
      alert(error.response?.data?.message || "기사 정보를 불러오지 못했습니다.");
    }
  }

  const filtered =
    activeFilter === "전체"
      ? asList
      : asList.filter((item) => item.status === activeFilter);

  if (showReserve) {
    return (
      <div className="cas-wrap">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 0 0",
          }}
        >
          <button
            className="cas-back-btn"
            onClick={() => setShowReserve(false)}
          >
            <ArrowLeft size={18} /> 뒤로
          </button>
        </div>
        <ASRequestFlow onClose={() => setShowReserve(false)} />
      </div>
    );
  }

  return (
    <div className="cas-wrap">
      {/* 수리 보고서 모달 */}
      {reportTarget && (
        <ReportModal
          item={reportTarget.item}
          report={reportTarget.report}
          onApprove={
            reportTarget.item.status === "COMPLETED"
              ? async () => {
                  try {
                    await approveReport(reportTarget.report.reportId);
                    setAsList((prev) =>
                      prev.map((i) =>
                        i.requestId === reportTarget.item.requestId
                          ? { ...i, status: "PAID" }
                          : i,
                      ),
                    );
                    setReportTarget(null);
                  } catch (error) {
                    alert(
                      error.response?.data?.message || "승인에 실패했습니다.",
                    );
                  }
                }
              : undefined
          }
          onClose={() => setReportTarget(null)}
        />
      )}

      {/* 리뷰 모달 */}
      {reviewTarget && (
        <ReviewModal
          item={reviewTarget.item}
          existingReview={reviewTarget.existingReview}
          onSubmit={handleReviewSubmit}
          onClose={() => setReviewTarget(null)}
        />
      )}

      {/* 예약 취소 모달 */}
      {cancelTarget && (
        <CancelModal
          item={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
        />
      )}

      {/* KPI */}
      <div className="cas-kpi-grid">
        {[
          {
            label: "전체 신청",
            num: asList.length,
            unit: "건",
            Icon: ClipboardList,
            alert: false,
          },
          {
            label: "진행 중",
            num: asList.filter((i) =>
              [
                "AGENCY_RECEIVED",
                "ASSIGNED",
                "ACCEPTED",
                "ENGINEER_DEPARTED",
                "ENGINEER_ARRIVED",
                "IN_PROGRESS",
              ].includes(i.status),
            ).length,
            unit: "건",
            Icon: Loader,
            alert: false,
          },
          {
            label: "결제 대기 중",
            num: asList.filter((i) => i.status === "COMPLETED").length,
            unit: "건",
            Icon: CreditCard,
            alert: asList.some((i) => i.status === "COMPLETED"),
          },
          {
            label: "이번 달 방문 예정",
            num: asList.filter((i) =>
              i.scheduledDate?.startsWith(new Date().toISOString().slice(0, 7)),
            ).length,
            unit: "건",
            Icon: CalendarCheck,
            alert: false,
          },
        ].map(({ label, num, unit, Icon, alert }) => (
          <div
            key={label}
            className={`cas-kpi${alert ? " cas-kpi--alert" : ""}`}
          >
            <div className="cas-kpi__text">
              <p className="cas-kpi__value">
                {num}
                <span>{unit}</span>
              </p>
              <p className="cas-kpi__label">{label}</p>
            </div>
            <Icon className="cas-kpi__watermark" strokeWidth={1} />
          </div>
        ))}
      </div>

      {/* 바디: 메인 컨텐츠 */}
      <div className="cas-body">
        <div className="cas-main">
          {/* 목록 헤더 */}
          <div className="cas-list-header">
            <h2>내 신청 내역</h2>
            <button
              className="cas-reserve-btn"
              onClick={() => setShowReserve(true)}
            >
              + A/S 신청하기
            </button>
          </div>

          {/* 필터 탭 */}
          <div className="cas-filters">
            {FILTER_TABS.map(({ key, label }) => (
              <button
                key={key}
                className={`cas-filter ${activeFilter === key ? "cas-filter--active" : ""}`}
                onClick={() => setActiveFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 신청 목록 */}
          <div className="cas-list">
            {loading ? (
              <div className="cas-empty">불러오는 중...</div>
            ) : filtered.length === 0 ? (
              <div className="cas-empty">해당 상태의 신청 내역이 없습니다.</div>
            ) : (
              filtered.map((item, idx) => {
                const st = STATUS_META[item.status] ?? {
                  style: "gray",
                  label: item.status ?? "알 수 없음",
                };
                console.log(item);

                return (
                  <div
                    key={item.requestId ?? idx}
                    className={`cas-item ${item.status === "COMPLETED" ? "cas-item--payment" : ""}`}
                  >
                    <ApplianceIcon
                      name={item.symptomCode}
                      size={68}
                      radius={10}
                    />
                    <div className="cas-item__info">
                      <div className="cas-item__title-row">
                        <span className="cas-item__name">
                          {item.brand} {item.modelName}
                        </span>
                        <span className="cas-item__model">
                          {item.symptomCode}
                        </span>
                      </div>
                      <p className="cas-item__desc">
                        {item.symptomDesc ?? "—"}
                      </p>
                      <div className="cas-item__meta">
                        <span className="cas-item__datetime">
                          <Clock size={11} /> {item.scheduledDate}{" "}
                          {item.scheduledTime}
                        </span>
                        <span className="cas-item__engineer">
                          {item.visitAddressDetail}
                        </span>
                      </div>
                    </div>
                    <div className="cas-item__center">
                      <span className={`cas-badge cas-badge--${st.style}`}>
                        {st.label}
                      </span>
                      <div className="cas-item__engineer-info">
                        <div className="cas-item__eng-avatar">?</div>
                        <div>
                          <p className="cas-item__eng-name">배정 대기 중</p>
                          <p className="cas-item__eng-rating">
                            <Star size={10} fill="#f59e0b" color="#f59e0b" /> -
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="cas-item__actions">
                      {getActionsByStatus(
                        item.status,
                        !!reviews[item.requestId],
                      ).map((action) => (
                        <button
                          key={action}
                          disabled={
                            action === "수리 보고서 보기" && !item.reportId
                          }
                          className={`cas-action-btn cas-action-btn--${ACTION_STYLE[action]}`}
                          onClick={
                            action === "예약 취소"
                              ? () => setCancelTarget(item)
                              : action === "수리 보고서 보기"
                                ? () => handleReportView(item)
                                : action === "결제하기"
                                  ? () => handlePayment(item.requestId)
                                  : action === "기사님 리뷰 남기기"
                                    ? () => handleReviewOpen(item)
                                    : action === "작성한 리뷰 보기"
                                      ? () =>
                                          setReviewTarget({
                                            item,
                                            existingReview:
                                              reviews[item.requestId],
                                          })
                                      : undefined
                          }
                        >
                          {action}
                        </button>
                      ))}
                      {item.cancelReason && (
                        <p className="cas-item__cancel-reason">
                          사유: {item.cancelReason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
