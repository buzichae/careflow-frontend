import api from './axiosInstance';

export const getAgencyRequests = () =>
    api.get('/api/account-requests/agencylist');

export const approveAgencyRequest = (accountId) =>
    api.post('/api/account-requests/agency/approval', null, { params: { accountId } });

export const rejectAgencyRequest = (accountId, rejectReson) =>
    api.post('/api/account-requests/agency/rejection', { rejectReson }, { params: { accountId } });
