import { cors } from "hono/cors";

/** dev 期前端跑在 6273，走 vite proxy 时同源；直连调试时需要放行 */
export const corsMiddleware = cors({
  origin: ["http://localhost:6273", "http://127.0.0.1:6273"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "zxCorpId", "clientType", "version", "retrykey"],
  maxAge: 600
});
