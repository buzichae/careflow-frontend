import axios from "./axiosInstance";

export async function getAgencyMe() {
  const res = await axios.get("/api/agency/me");
  return res.data;
}