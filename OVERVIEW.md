# CareFlow Frontend — Project Overview

## 프로젝트 소개

**CareFlow**는 가전제품 라이프사이클 통합 관리 플랫폼입니다.  
고객의 A/S 신청부터 수리 기사 배정, 현장 수행, 보고서 작성, 제품 건강 진단서 발급까지 전 과정을 하나의 플랫폼에서 처리합니다.

- **4개 역할**: 고객(CUSTOMER) / 기사(ENGINEER) / 대행사(AGENCY) / 관리자(ADMIN)

---

## 기술 스택

### 프론트엔드

| 분류            | 기술                           |
| --------------- | ------------------------------ |
| UI 프레임워크   | React 19.2                     |
| 빌드 툴         | Vite 8.0                       |
| 라우팅          | React Router DOM 7.18          |
| HTTP 클라이언트 | Axios 1.18 (JWT 인터셉터 포함) |
| 차트            | Recharts 3.9                   |
| 아이콘          | Lucide React                   |
| JWT 파싱        | jwt-decode 4.0                 |

### 백엔드 (연동 대상)

| 분류        | 기술                                                     |
| ----------- | -------------------------------------------------------- |
| 프레임워크  | Spring Boot                                              |
| 인증        | JWT + RBAC (역할 기반 권한)                              |
| 실시간 통신 | SSE (Phase 2)                                            |
| 스케줄링    | Spring Quartz                                            |
| 캐시        | Redis                                                    |
| 결제        | Phase 1: 모의 결제(MOCK) / 이후 카카오페이·토스페이 검토 |

**백엔드 Base URL:** `http://localhost:8080`  
**인증:** JWT를 localStorage에 저장 → Axios 인터셉터로 모든 요청에 자동 주입

---

## 폴더 구조

```
src/
├── main.jsx
├── App.jsx                   # 라우팅 설정
├── apis/
│   ├── axiosInstance.js      # Axios 공통 설정 & JWT 인터셉터
│   ├── auth.js               # 인증 (로그인, 회원가입, 프로필)
│   ├── as.js                 # A/S 요청
│   ├── appliances.js         # 가전제품 관리
│   └── lms.js                # 교육 관리 시스템
├── components/
│   ├── MainLayout.jsx        # 인증된 사용자 공통 레이아웃
│   └── sidebars/
│       ├── CustomerSidebar.jsx
│       ├── EngineerSidebar.jsx
│       ├── AgencySidebar.jsx
│       └── AdminSidebar.jsx
├── pages/
│   ├── Landing/              # 퍼블릭 랜딩 (4페이지)
│   ├── auth/                 # 로그인/회원가입/OAuth2 콜백
│   ├── customer/             # 고객 페이지 (7페이지)
│   ├── Engineer/             # 기사 페이지 (13페이지)
│   ├── Agency/               # 대행사 페이지 (11페이지 + 모달/탭)
│   └── Admin/                # 관리자 페이지 (6페이지)
└── styles/                   # 역할별 CSS (총 50개)
```

---

## 라우팅 구조

```
/                              # 랜딩 페이지
/service, /features, /guide
/auth/login, /auth/signup
/oauth2/redirect               # OAuth2 콜백

/customer/home                 # 고객 대시보드
/customer/appliances           # 가전제품 관리
/customer/as                   # A/S 내역
/customer/payment              # 결제 내역
/customer/notice               # 공지사항
/customer/mypage               # 마이페이지

/engineer/dashboard            # 기사 대시보드
/engineer/schedule             # 일정 관리
/engineer/work                 # 업무 관리
/engineer/customers/:id        # 고객 정보
/engineer/report               # 작업 보고서
/engineer/settlement           # 정산
/engineer/reviews              # 리뷰 확인
/engineer/lms                  # 교육 수강

/agency/dashboard              # 대행사 대시보드
/agency/work                   # 업무 배정 & 모니터링
/agency/reassign-alerts        # 재배정 알림
/agency/engineers              # 기사 관리
/agency/settlement             # 정산 관리
/agency/statistics             # 통계 & 리포트
/agency/lms                    # 교육 현황

/admin/dashboard               # 관리자 대시보드
/admin/members                 # 회원 관리
/admin/service                 # 서비스 관리
/admin/lms                     # LMS 관리
/admin/settlement              # 정산 관리
```

---

## 계정 유형 및 가입 방식

| 계정 유형 | 가입 방식                                                              | 활성화 시점                  |
| --------- | ---------------------------------------------------------------------- | ---------------------------- |
| CUSTOMER  | 회원가입 페이지에서 직접 가입                                          | 가입 즉시                    |
| AGENCY    | 대행사 가입 폼으로 가입 (사업자 정보 포함)                             | ADMIN 승인 후                |
| ENGINEER  | 대행사 담당자가 기사 관리 메뉴에서 직접 계정 생성 → 임시 비밀번호 발급 | 최초 로그인 후 비밀번호 변경 |
| ADMIN     | 시스템 내부에서 직접 생성                                              | -                            |

---

## A/S 처리 워크플로우

```
① 고객이 A/S 신청 (자동 배정 또는 수동 배정 선택)
   → 자동/수동 모두 기사에게 직접 가지 않고 대행사 접수 목록으로 먼저 전달

② 대행사가 소속 기사 근무표 기반으로 배차
   → LMS 필수 교육 이수 기사(is_lms_completed=1)만 배차 대상

③ 기사가 배정 알림 수신 → 30분 내 수락/거절
   → 미수락 30분 경과 시 자동 재배차

④ 기사 단계별 상태 업데이트 (as_status_logs)
   WAITING → ENGINEER_DEPARTED → ENGINEER_ARRIVED → IN_PROGRESS → COMPLETED

⑤ 기사가 작업 완료 보고서 제출 (표준 스키마 강제화)
   → 보고서 제출 시점에 A/S 이력 데이터 즉시 적재

⑥ 고객이 보고서 확인 및 승인 → 결제 처리 (Phase 1: 모의 결제)
   → settlements 자동 생성

⑦ 고객이 기사 평점·리뷰 작성
   → engineer_profiles.avg_rating 자동 갱신

⑧ 보고서 데이터 → 제품 건강 진단서 자동 갱신
```

### A/S 요청 상태값 (as_requests.status)

| 상태            | 설명             |
| --------------- | ---------------- |
| PENDING         | 접수 대기        |
| AGENCY_RECEIVED | 대행사 접수 완료 |
| ASSIGNED        | 기사 배정 완료   |
| ACCEPTED        | 기사 수락 완료   |
| IN_PROGRESS     | 작업 중          |
| COMPLETED       | 작업 완료        |
| PAID            | 결제 완료        |
| CANCELLED       | 취소             |

---

## 자동 배정 로직

```
1단계 필터링 (4개 조건 모두 충족)
  → engineer_schedules (근무 가능일)
  → engineer_expert_brands (전문 브랜드)
  → engineer_profiles.category_id (전문 가전 카테고리)
  → engineer_service_regions (서비스 지역 — visit_region_id와 직접 매칭)

2단계 우선순위
  → 조건 충족 기사 다수일 경우 avg_rating 높은 순으로 배정

3단계 Fallback (조건 충족 기사 없을 시 순차 완화)
  ① 브랜드 조건 완화
  ② 서비스 지역 조건 완화
  ③ 전문 가전 카테고리 조건 완화
  ④ 근무 가능일 조건 완화 (고객에게 일정 재협의 안내)
  → 전 단계 실패 시 '배정 가능한 기사 없음' 안내 후 수동 배정으로 전환 유도
```

---

## 역할별 주요 기능

### 고객 (CUSTOMER)

- 가전제품 등록(직접 입력) / 삭제 / 수리 이력 조회
- A/S 신청: 방문 지역은 거주 지역 자동 표시(수정 가능), regions 기반 드롭다운
- 예상 수리 비용 사전 확인 (지난 1년 동일 증상 완료 건 평균값, 데이터 없으면 '데이터 수집 중')
- A/S 진행 상태 추적 → 취소 → 완료 후 기사 평점·리뷰
- 작업 보고서 확인 및 승인 → 결제
- 제품 건강 진단서 조회·다운로드
- 마이페이지 (개인정보 수정, 결제 내역, 회원 탈퇴)

### 기사 (ENGINEER)

- 대행사 담당자가 계정 생성, 최초 로그인 시 임시 비밀번호 변경
- 경력 시작 연도 기반 기술 등급 자동 배정
  - 1~5년: BEGINNER / 6~10년: INTERMEDIATE / 11년↑: ADVANCED
- 전문 가전 카테고리 **1개만** 등록 가능 (단일 전문화)
- 월 단위 근무표 작성·제출
- LMS 필수 교육 이수 → is_lms_completed=1 → 배차 가능 상태 전환
- 배정 알림 수신 → 수락/거절
- 단계별 상태 업데이트 (WAITING → ENGINEER_DEPARTED → ENGINEER_ARRIVED → IN_PROGRESS → COMPLETED)
- 작업 완료 보고서 제출 (진단 결과·교체 부품·작업 시간·최종 금액·사진)
- 월별 수익 정산 / 고객 리뷰 확인

### 대행사 (AGENCY)

- 대행사 가입 → ADMIN 승인 후 계정 활성화
- 소속 기사 계정 직접 생성 (임시 비밀번호 발급)
- 기사 프로필·활동 지역·전문 브랜드 관리
- 접수된 A/S 건에 기사 배차 (LMS 미이수 기사 자동 제외)
- 기사 미수락 30분 경과 시 재배차 처리
- 배차 현황 모니터링 (날짜·상태 필터, 기본값: 오늘)
- 기사별 실적 리포트 (완료 건수·평점·수익)
- 정산 합산 내역 및 월별 리포트 다운로드

### 관리자 (ADMIN)

- 대행사 사업자 인증 승인/반려
- 전체 회원(고객·기사·대행사) 검색·조회 및 계정 상태 변경
- 플랫폼 KPI 대시보드 (신규 가입, A/S 처리 건수, 평균 평점, 정산 대기)
- A/S 처리 현황 통계 (상태·지역·기간별 집계)
- LMS 교육 콘텐츠 등록·수정·활성화·비활성화 / 기사별 이수 현황 조회
- 대행사 단위 정산 합산 내역 조회 및 지급 승인

---

## 제품 건강 진단서

작업 완료 보고서 고객 승인 시 자동 갱신됩니다.

### 등급 산정 (각 25점 만점, 총 100점)

| 항목               | 조건                                             | 점수                 |
| ------------------ | ------------------------------------------------ | -------------------- |
| ① 수리 횟수        | 0회 / 1회 / 2회 / 3회 / 4회 이상                 | 25 / 20 / 15 / 8 / 0 |
| ② 사용 기간        | 1년 미만 / 1~3년 / 3~5년 / 5~8년 / 8년 이상      | 25 / 20 / 15 / 8 / 0 |
| ③ 교체 부품 중요도 | 없음 / MINOR / NORMAL / MAJOR / CRITICAL         | 25 / 20 / 15 / 8 / 0 |
| ④ 최근 수리 일시   | 없음 / 2년 이전 / 1~2년 / 6개월~1년 / 6개월 이내 | 25 / 20 / 15 / 8 / 0 |

### 등급 기준

| 등급 | 점수      | 의미      |
| ---- | --------- | --------- |
| A    | 90점 이상 | 최상 상태 |
| B    | 75~89점   | 양호      |
| C    | 60~74점   | 보통      |
| D    | 40~59점   | 주의 필요 |
| E    | 39점 이하 | 불량      |

B등급(75점) 이상 → **CareFlow 인증 뱃지** 자동 발급

---

## 정산 수수료 구조

- CareFlow 플랫폼 수수료: **10% 고정**
- 대행사 수수료: 대행사별 자체 설정 (`agencies.agency_fee_rate`)
- 결제 시점 수수료율 스냅샷 저장 → 수수료율 변경 후에도 과거 정산 보존

```
gross_amount × 10%             = platform_fee
gross_amount × agency_fee_rate = agency_fee
gross_amount - platform_fee - agency_fee = engineer_net_amount
```

---

## LMS 교육 시스템

기사의 전문 카테고리 + 기술 등급에 해당하는 필수 콘텐츠 이수 후 배차 가능 상태 전환.

```
기사 로그인
  → 필수 콘텐츠 목록 확인 (카테고리 × 기술 등급 기준)
  → 콘텐츠 열람 → 이수 완료 처리
  → 당해 연도 전체 이수 시 is_lms_completed=1 자동 갱신
  → 배차 가능 상태 전환

매년 1월 1일: Quartz 스케줄러로 is_lms_completed=0 초기화 → 연간 재이수 사이클 시작
```

---

## 상태값 정의

### 결제 상태 (payments.status)

| 상태      | 설명      |
| --------- | --------- |
| READY     | 결제 준비 |
| SUCCESS   | 결제 성공 |
| FAILED    | 결제 실패 |
| CANCELLED | 결제 취소 |
| REFUNDED  | 환불 완료 |

### 정산 상태 (settlements.status)

| 상태     | 설명             |
| -------- | ---------------- |
| PENDING  | 정산 대기        |
| APPROVED | 관리자 승인 완료 |
| PAID     | 지급 완료        |
| DISPUTED | 이의 제기        |

---

## Redis Key 설계

| Key 패턴                           | TTL          | 용도                       |
| ---------------------------------- | ------------ | -------------------------- |
| `sse:user:{user_id}`               | 연결 유지 중 | SSE 연결 상태 관리         |
| `assignment:timer:{assignment_id}` | 30분         | 기사 배정 수락 대기 타이머 |
| `as:status:{request_id}`           | 24시간       | A/S 최신 상태 캐시         |
| `refresh:token:{user_id}`          | 7일          | Refresh Token 저장         |

---

## 단계별 로드맵

| Phase         | 내용                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Phase 1 (MVP) | A/S 접수·수리 완료 핵심 워크플로우, 제품 건강 진단서, LMS 이수 및 배차 조건 연동, 모의 결제       |
| Phase 2       | SSE 실시간 트래킹, 소모품·무상 A/S 만료 알림(Quartz), 결함별 평균 수리 견적, 관리자 통계 대시보드 |
| Phase 3       | OCR 자동 등록, ETA 산정(Google Maps), 인증 중고 마켓, OEM Insight 리포트, AI 챗봇                 |

---

## 개발 스크립트

```bash
npm run dev      # 개발 서버 시작 (Vite HMR)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사
npm run preview  # 빌드 결과 미리보기
```
