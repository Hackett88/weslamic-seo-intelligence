# N8N 回调隧道（W01 真链路联调用）

把 N8N 的 callback HTTP Request 节点打到本地 `localhost:3000/api/n8n/callback`，用于本地开发期 W01 等真链路工作流的回调通路。

## 起法（cloudflared trycloudflare 临时域）

```bash
# 安装：https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
cloudflared tunnel --url http://localhost:3000
```

成功后控制台输出形如 `https://<random>.trycloudflare.com` 的临时域名。该 URL 即为 N8N callback 的根地址。

## .env.local 配置

```bash
# 关闭 mock，切到真链路
USE_MOCK=0

# 把 trycloudflare 隧道 URL 写到这里。APP 触发 W01 webhook 时会拼成
# callback_url = ${APP_PUBLIC_URL}/api/n8n/callback 显式传给 N8N。
APP_PUBLIC_URL=https://<random>.trycloudflare.com

# N8N 实例 base（本地开发用 cloudflared 公网域，受 154.44.22.223 白名单约束）
N8N_BASE_URL=https://n8n1.redfusion.studio

# APP↔N8N callback 鉴权 token（必须与 N8N 工作流 callback 节点的
# httpHeaderAuth credential 中 X-N8N-Token 的值一致）
N8N_CALLBACK_TOKEN=<与 N8N credential 一致的字符串>
```

## W01 端到端联调流程

1. 启动本地 dev：`pnpm dev`（依赖 SSH 数据库隧道，见 SOP-01）
2. 起 cloudflared 隧道：`cloudflared tunnel --url http://localhost:3000`，复制输出 URL 写入 `.env.local` 的 `APP_PUBLIC_URL`，重启 dev
3. 浏览器登录 `http://localhost:3000`，进入「关键词功能库 → 关键词指标查询」
4. 输入关键词（每行 1 词）+ 勾选 ≥1 个市场 → 点击「开始查询」
5. APP 行为：
   - 给每个市场生成独立 batch_id（`W01-<market>-<8位hex>`）
   - 并发触发 N 次 `POST {N8N_BASE_URL}/webhook/w01-phrase-these`
   - SSE 流轮询 `n8n_callback_events` 表，按 seq 把事件推到前端
   - 全部 batch 进入终态后从 N8N DataTable `semrush_keywords_staging` 拉所属 batch_id 的行
   - 推 `event: rows` + `_done` 关流
6. 验收点：
   - 状态横条：`处理中… <节点名> (seq X/6)` → `已完成 · 返回 N 行 · M 个市场`
   - 结果表格：每行一条 (market, keyword)，含搜量/KD/CPC/竞争度/Intent
   - 数据库：`SELECT * FROM n8n_callback_events WHERE batch_id LIKE 'W01-%' ORDER BY ts DESC LIMIT 20;` 看到 6 个/市场 的事件链

## 注意

- trycloudflare 每次启动 URL 都变，仅适用本地调试。生产 `APP_PUBLIC_URL` 直接用 `https://weslamic.redfusion.studio`，由闲置机 cloudflared named tunnel 提供。
- 本地 APP 必须先跑起来（`pnpm dev`），隧道才能转发到。
- token 不一致会被 401；IP 白名单默认 `*`（见 `.env.example`）。
- 单次请求超过 100u（10 词×10 市场）会触发二次密码门，前端会弹框。

## 验收命令

```bash
# SSE Hello World
curl -N "http://localhost:3000/api/keywords/fetch?demo=hello-world" \
  -H "Cookie: <next-auth session cookie>"

# 隧道回调（手测）
curl -X POST "https://<random>.trycloudflare.com/api/n8n/callback" \
  -H "Content-Type: application/json" \
  -H "X-N8N-Token: <token>" \
  -d '{"version":"2025-01","event_id":"test-event-001","seq":1,"ts":"2026-05-04T00:00:00Z","batch_id":"BATCH-TEST-001","workflow_id":"wf-test","execution_id":"exec-001","node_name":"测试节点","node_status":"started"}'
```
