import api from './axiosInstance';

export const getAgencyRequests = () =>
    api.get('/api/account-requests/agencylist');

export const approveAgencyRequest = (accountId) =>
    api.post('/api/account-requests/agency/approval', null, { params: { accountId } });

export const rejectAgencyRequest = (accountId, rejectReson) =>
    api.post('/api/account-requests/agency/rejection', { rejectReson }, { params: { accountId } });

// 관리자 회원 KPI (총원/상태별/오늘 신규가입)
// role: 'CUSTOMER' | 'AGENCY' | 'ENGINEER' | undefined(전체)
export const getAdminUserKpi = (role) =>
    api.get('/api/admin/users/kpi', { params: role ? { role } : {} });

// 최근 7일 신규 가입자 추이
export const getAdminMemberTrend = (role) =>
    api.get('/api/admin/users/member-trend', { params: role ? { role } : {} });

// 회원 상태 변경 (status: 'ACTIVE'|'INACTIVE'|'SUSPENDED')
export const updateAdminUserStatus = (userId, status) =>
    api.patch(`/api/admin/users/${userId}/status`, { status });

// 전체 회원 조회 (role: 'CUSTOMER'|'ENGINEER'|'AGENCY'|undefined, status, keyword)
export const getAdminUsers = ({ role, status, keyword, page = 0 } = {}) => {
    const params = { page };
    if (role) params.role = role;
    if (status) params.status = status;
    if (keyword) params.keyword = keyword;
    return api.get('/api/admin/users', { params });
};

// 실시간 A/S 현황 통계 (AsStatus 10개 전부, 필터 없는 전체 누적 집계)
export const getAdminAsStats = () =>
    api.get('/api/admin/as-requests/stats');

// 기간(지역) 필터가 반영된 A/S 상태별 통계 — 목록 API의 stats 필드만 사용 (size=1로 목록은 최소화)
export const getAdminAsRequests = ({ status, region, from, to, page = 0, size = 1 } = {}) => {
    const params = { page, size };
    if (status) params.status = status;
    if (region) params.region = region;
    if (from) params.from = from;
    if (to) params.to = to;
    return api.get('/api/admin/as-requests', { params });
};
