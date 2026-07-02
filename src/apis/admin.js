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
