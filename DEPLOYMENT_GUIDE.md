# CP-AI Brain V2 部署指南

## 项目概述

**CP-AI Brain V2** 是一个功能完整的 AI 驱动的知识管理和分析平台，采用现代化的技术栈构建。该项目已从原始仓库迁移到 Manus web-db-user 框架，并进行了全面的增强和优化。

### 核心特性

- **本地认证系统**：支持用户名/密码登录（当 Manus OAuth 不可用时）
- **Manus OAuth 集成**：完全支持 Manus 平台认证
- **AI 功能**：支持 Manus Forge API（推荐）或 OpenAI API（备用）
- **数据库集成**：完整的 MySQL 数据库支持，包含 22 个数据表
- **会话管理**：支持 Token 和 Cookie 两种会话方式
- **响应式设计**：保留原始 UI 设计，完全兼容各种设备

### 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | Vite, React, TypeScript, TailwindCSS |
| **后端** | Express, tRPC, Node.js |
| **数据库** | MySQL, Drizzle ORM |
| **AI** | Manus Forge API / OpenAI API |
| **部署** | Manus Platform / Docker / 自托管 |

---

## 环境变量配置

### 必需的环境变量

#### Manus 平台集成

```env
# Manus OAuth 配置（可选，如果不配置将使用本地认证）
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
VITE_APP_ID=<your-app-id>
VITE_FRONTEND_FORGE_API_KEY=<your-frontend-forge-api-key>
VITE_FRONTEND_FORGE_API_URL=https://api.manus.ai

# 后端 Manus 配置
BUILT_IN_FORGE_API_KEY=<your-backend-forge-api-key>
BUILT_IN_FORGE_API_URL=https://api.manus.ai
JWT_SECRET=<your-jwt-secret>
OAUTH_SERVER_URL=https://oauth.manus.im
```

#### 数据库配置

```env
DATABASE_URL=mysql://user:password@host:3306/cpbrain
```

#### 本地认证配置（可选）

```env
LOCAL_ADMIN_PASSWORD=cpbrain2024  # 默认值，建议修改
```

#### 应用配置

```env
VITE_APP_TITLE=CP-AI Brain V2
VITE_APP_LOGO=https://your-logo-url.png
NODE_ENV=production
PORT=3000
```

### 环境变量优先级

1. **Manus 平台**：自动注入 `BUILT_IN_FORGE_API_KEY` 等内置变量
2. **自定义 OpenAI**：如果 `OPENAI_API_KEY` 已配置，AI 功能将使用 OpenAI
3. **本地认证**：如果 OAuth 变量未配置，系统自动使用本地认证

---

## 部署方案

### 方案 1：Manus 平台部署（推荐）

#### 前置条件

- Manus 账户和项目空间
- 访问 Manus 管理面板

#### 部署步骤

1. **克隆项目**

```bash
git clone https://github.com/Eli-yu-first/cp-ai-brain-v2.git
cd cp-ai-brain-v2
```

2. **安装依赖**

```bash
pnpm install
```

3. **执行数据库迁移**

```bash
# 使用 Manus 提供的 DATABASE_URL
pnpm run db:migrate
```

4. **构建项目**

```bash
pnpm run build
```

5. **通过 Manus 管理面板发布**

- 登录 Manus 平台
- 点击项目的 "Publish" 按钮
- 系统将自动部署到 Manus 托管环境

#### 自动注入的环境变量

Manus 平台会自动提供以下变量：

- `BUILT_IN_FORGE_API_KEY`：后端 AI API 密钥
- `BUILT_IN_FORGE_API_URL`：后端 AI API 端点
- `JWT_SECRET`：JWT 签名密钥
- `OAUTH_SERVER_URL`：OAuth 服务器地址
- `VITE_ANALYTICS_ENDPOINT`：分析端点
- `VITE_ANALYTICS_WEBSITE_ID`：分析网站 ID

### 方案 2：Docker 部署

#### Dockerfile

```dockerfile
FROM node:22-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建
RUN pnpm run build

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["node", "dist/server/_core/index.js"]
```

#### 部署命令

```bash
# 构建镜像
docker build -t cp-ai-brain-v2:latest .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="mysql://user:password@host:3306/cpbrain" \
  -e BUILT_IN_FORGE_API_KEY="your-key" \
  -e BUILT_IN_FORGE_API_URL="https://api.manus.ai" \
  -e JWT_SECRET="your-secret" \
  cp-ai-brain-v2:latest
```

### 方案 3：自托管部署

#### 前置条件

- Node.js 22+
- MySQL 8.0+
- Linux/macOS/Windows 服务器

#### 部署步骤

1. **克隆项目**

```bash
git clone https://github.com/Eli-yu-first/cp-ai-brain-v2.git
cd cp-ai-brain-v2
```

2. **安装依赖**

```bash
pnpm install
```

3. **配置环境变量**

```bash
cp .env.example .env
# 编辑 .env 文件，填入实际的配置值
nano .env
```

4. **创建数据库**

```bash
mysql -u root -p -e "CREATE DATABASE cpbrain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

5. **执行数据库迁移**

```bash
pnpm run db:migrate
```

6. **构建项目**

```bash
pnpm run build
```

7. **启动服务**

```bash
# 开发模式
pnpm run dev

# 生产模式
NODE_ENV=production node dist/server/_core/index.js
```

#### 使用 PM2 管理进程

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start dist/server/_core/index.js --name "cp-ai-brain-v2"

# 保存配置
pm2 save

# 设置开机自启
pm2 startup
```

---

## 数据库迁移

### 迁移文件位置

所有迁移文件位于 `drizzle/` 目录：

- `0001_initial_schema.sql`：初始数据库架构
- `0002_additional_tables.sql`：附加表
- `0003_indexes_and_constraints.sql`：索引和约束
- `0004_extended_tables.sql`：扩展表（新增）

### 手动执行迁移

```bash
# 使用 MySQL 客户端
mysql -u user -p cpbrain < drizzle/0001_initial_schema.sql
mysql -u user -p cpbrain < drizzle/0002_additional_tables.sql
mysql -u user -p cpbrain < drizzle/0003_indexes_and_constraints.sql
mysql -u user -p cpbrain < drizzle/0004_extended_tables.sql

# 或使用 pnpm 脚本
pnpm run db:migrate
```

### 数据库表清单

| 表名 | 描述 |
|------|------|
| `users` | 用户账户信息 |
| `sessions` | 会话管理 |
| `projects` | 项目/工作区 |
| `documents` | 文档存储 |
| `conversations` | AI 对话历史 |
| `knowledge_bases` | 知识库 |
| `ai_models` | AI 模型配置 |
| `api_keys` | API 密钥管理 |
| `audit_logs` | 审计日志 |
| ... | 其他 22 个表 |

---

## 认证系统

### 本地认证（默认）

当 Manus OAuth 不可用时，系统自动启用本地认证。

**登录端点**

```bash
POST /api/auth/local-login
Content-Type: application/json

{
  "password": "cpbrain2024"
}
```

**响应**

```json
{
  "success": true,
  "name": "管理员",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**配置**

```env
LOCAL_ADMIN_PASSWORD=cpbrain2024  # 修改默认密码
```

### Manus OAuth 认证

当配置了 OAuth 环境变量时，系统自动启用 Manus OAuth。

**检查认证配置**

```bash
GET /api/auth/config
```

**响应**

```json
{
  "hasOAuth": true,
  "hasLocalAuth": true
}
```

---

## AI 功能集成

### Manus Forge API（推荐）

项目已预配置支持 Manus Forge API。

**配置**

```env
# 前端
VITE_FRONTEND_FORGE_API_KEY=your-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.ai

# 后端
BUILT_IN_FORGE_API_KEY=your-key
BUILT_IN_FORGE_API_URL=https://api.manus.ai
```

**使用示例**

```typescript
// 在 AI War Room 中使用
const response = await fetch('https://api.manus.ai/v2/task.create', {
  method: 'POST',
  headers: {
    'x-manus-api-key': process.env.BUILT_IN_FORGE_API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: { content: [{ type: 'text', text: 'Your prompt' }] },
    title: 'Task Title',
  }),
});
```

### OpenAI API（备用）

如果配置了 `OPENAI_API_KEY`，系统将自动使用 OpenAI。

**配置**

```env
OPENAI_API_KEY=sk-...
OPENAI_API_BASE=https://api.openai.com/v1
```

---

## 会话管理

### Cookie 会话

- **名称**：`app_session_id`
- **过期时间**：1 年
- **安全属性**：HttpOnly, Secure, SameSite=Strict

### Token 会话

- **格式**：JWT
- **存储**：localStorage（客户端）或请求头（API）
- **过期时间**：可配置

### 跨代理兼容性

项目支持在代理环境中通过请求头传递 Token：

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/trpc/...
```

---

## 开发指南

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 构建
pnpm run build

# 测试
pnpm run test

# 代码检查
pnpm run lint
```

### 项目结构

```
cp-ai-brain-v2/
├── client/                 # 前端代码
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # 可复用组件
│   │   ├── hooks/         # 自定义 hooks
│   │   └── main.tsx       # 入口文件
│   └── index.html
├── server/                 # 后端代码
│   ├── _core/             # 核心服务
│   │   ├── index.ts       # 服务器入口
│   │   ├── sdk.ts         # SDK 和认证
│   │   ├── env.ts         # 环境变量
│   │   └── oauth.ts       # OAuth 路由
│   ├── routers/           # tRPC 路由
│   ├── db/                # 数据库操作
│   └── middleware/        # 中间件
├── drizzle/               # 数据库迁移
├── shared/                # 共享代码
└── package.json
```

### 添加新功能

1. **定义数据库表**

在 `drizzle/` 中创建新的迁移文件

2. **创建 tRPC 路由**

在 `server/routers/` 中添加新的路由

3. **实现前端组件**

在 `client/src/` 中添加新的组件和页面

4. **执行迁移**

```bash
pnpm run db:migrate
```

---

## 故障排查

### 常见问题

#### 1. 数据库连接失败

**症状**：`Error: connect ECONNREFUSED`

**解决方案**

```bash
# 检查数据库是否运行
mysql -u user -p -e "SELECT 1;"

# 验证 DATABASE_URL
echo $DATABASE_URL

# 检查网络连接
telnet host 3306
```

#### 2. OAuth 配置错误

**症状**：`OAuth portal URL not configured`

**解决方案**

```bash
# 检查环境变量
echo $VITE_OAUTH_PORTAL_URL
echo $VITE_APP_ID

# 使用本地认证
curl -X POST http://localhost:3000/api/auth/local-login \
  -H "Content-Type: application/json" \
  -d '{"password":"cpbrain2024"}'
```

#### 3. AI 功能不可用

**症状**：`AI API key not configured`

**解决方案**

```bash
# 检查 Manus 密钥
echo $BUILT_IN_FORGE_API_KEY

# 检查 OpenAI 密钥
echo $OPENAI_API_KEY

# 测试 API 连接
curl -H "x-manus-api-key: $BUILT_IN_FORGE_API_KEY" \
  https://api.manus.ai/v2/task.create
```

#### 4. 端口已被占用

**症状**：`Error: listen EADDRINUSE :::3000`

**解决方案**

```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或使用其他端口
PORT=3001 pnpm run dev
```

### 日志查看

```bash
# 查看应用日志
tail -f .manus-logs/devserver.log

# 查看浏览器控制台日志
tail -f .manus-logs/browserConsole.log

# 查看网络请求日志
tail -f .manus-logs/networkRequests.log
```

---

## 性能优化

### 前端优化

- **代码分割**：使用动态导入分割大型模块
- **图片优化**：使用 WebP 格式和懒加载
- **缓存策略**：配置适当的 HTTP 缓存头

### 后端优化

- **数据库索引**：已在迁移文件中配置
- **连接池**：使用 MySQL 连接池管理
- **API 缓存**：实现 Redis 缓存层（可选）

### 构建优化

```bash
# 分析构建大小
pnpm run build --analyze

# 启用生产优化
NODE_ENV=production pnpm run build
```

---

## 安全建议

### 必须执行

1. **修改默认密码**

```env
LOCAL_ADMIN_PASSWORD=<strong-password>
```

2. **设置 JWT 密钥**

```env
JWT_SECRET=<random-64-char-string>
```

3. **启用 HTTPS**

在生产环境中必须使用 HTTPS

4. **设置 CORS 策略**

```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
}));
```

5. **定期更新依赖**

```bash
pnpm update
```

### 可选加固

- 启用 WAF（Web Application Firewall）
- 配置 DDoS 防护
- 实施速率限制
- 启用审计日志

---

## 监控和维护

### 健康检查

```bash
# 检查服务器状态
curl http://localhost:3000/api/health

# 检查数据库连接
curl http://localhost:3000/api/db/health

# 检查 AI 服务
curl http://localhost:3000/api/ai/health
```

### 备份策略

```bash
# 备份数据库
mysqldump -u user -p cpbrain > backup_$(date +%Y%m%d).sql

# 备份应用文件
tar -czf backup_app_$(date +%Y%m%d).tar.gz .
```

### 更新流程

```bash
# 1. 创建备份
mysqldump -u user -p cpbrain > backup_pre_update.sql

# 2. 拉取最新代码
git pull origin main

# 3. 安装依赖
pnpm install

# 4. 执行迁移
pnpm run db:migrate

# 5. 构建
pnpm run build

# 6. 重启服务
pm2 restart cp-ai-brain-v2
```

---

## 支持和反馈

- **GitHub Issues**：https://github.com/Eli-yu-first/cp-ai-brain-v2/issues
- **文档**：https://github.com/Eli-yu-first/cp-ai-brain-v2/wiki
- **Manus 支持**：https://help.manus.im

---

## 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。

---

## 更新日志

### v2.0.0（当前版本）

- ✅ 迁移到 Manus web-db-user 框架
- ✅ 实现本地认证系统
- ✅ 创建登录页面
- ✅ 添加数据库迁移脚本
- ✅ 支持 Manus Forge API 和 OpenAI API
- ✅ 修复会话管理
- ✅ 保留原始 UI 设计

### 后续计划

- [ ] 实现高级权限管理
- [ ] 添加实时协作功能
- [ ] 集成更多 AI 模型
- [ ] 性能优化和扩展
