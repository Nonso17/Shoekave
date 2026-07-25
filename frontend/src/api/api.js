import axios from "axios";

export const MEDIA_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: `${MEDIA_URL}/api/`,
});


api.interceptors.request.use((config) => {

  const token = localStorage.getItem("access");

  console.log("ACCESS TOKEN:", token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log("HEADERS:", config.headers);

  return config;

});


export default api;