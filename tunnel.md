# N8N 回调隧道（D1 临时方案）

把云端 N8N webhook 调用打到本地 `localhost:3000/api/n8n/callback`，用于 D1 双通过验收的回调链路实测。

## 起法（cloudflared trycloudflare 临时域）

```bash
# 安装：https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
cloudflared tunnel --url http://localhost:3000
```

成功后控制台会输出形如 `https://<random>.trycloudflare.com` 的临时域名。该 URL 即为 N8N webhook 回调使用的根地址。

## N8N webhook 配置

在 N8N 子工作流末尾的 HTTP Request 节点上：

- **Method**：`POST`
- **URL**：`https://<random>.trycloudflare.com/api/n8n/callback`
- **Headers**：
  - `Content-Type: application/json`
  - `X-N8N-Token: <与 APP env.N8N_CALLBACK_TOKEN 一致的字符串>`
- **Body**：JSON，按 `src/contracts/n8n-callback.ts` Zod schema 10 字段

## 注意

- trycloudflare 每次启动 URL 都变，仅适用 D1 调试。MVP 后期切 named tunnel 或 stable URL。
- 本地 APP 必须先跑起来（`npm run dev`），隧道才能转发到。
- token 不一致会被 401；IP 白名单默认 `*`（见 `.env.example`）。

## 验收命令

```bash
# SSE Hello World
curl -N "http://localhost:3000/api/keywords/fetch?demo=hello-world" \
  -H "Cookie: <next-auth session cookie>"

# 隧道回调
curl -X POST "https://<random>.trycloudflare.com/api/n8n/callback" \
  -H "Content-Type: application/json" \
  -H "X-N8N-Token: <token>" \
  -d '{"version":"2025-01","event_id":"test-event-001","seq":1,"ts":"2026-05-02T00:00:00Z","batch_id":"BATCH-TEST-001","workflow_id":"wf-test","execution_id":"exec-001","node_name":"测试节点","node_status":"started"}'
```
