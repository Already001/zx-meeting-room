import http from "../http";

export const getAgentSuggestions = () => http.get("/agent/suggestions");
