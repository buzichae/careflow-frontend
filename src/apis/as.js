import api from "./axiosInstace";

export const getMyAS = () => {
    return api.get("/api/as-requests/me");
}

export const cancelAsRequest = async(requestId, cancelReason) => {
    const response = await api.patch(
        `/api/as-requests/${requestId}/cancel`,
        null,
        {
            params:{
                cancelReason,
            },
        }
    );
    return response.data;
}