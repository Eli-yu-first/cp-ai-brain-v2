# CP-AI Brain V2 快速开始指南

## 5 分钟快速部署

### 前置条件

- Node.js 22+
- pnpm 或 npm
- MySQL 8.0+（可选，开发时可使用本地认证）

### 本地开发（最快）

```bash
# 1. 克隆项目
git clone https://github.com/Eli-yu-first/cp-ai-brain-v2.git
cd cp-ai-brain-v2

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器
pnpm run dev

# 4. 打开浏览器
# 访问 http://localhost:5173
# 或 http://localhost:3000（如果使用不同端口）

# 5. 使用本地认证登录
# 密码：cpbrain2024
```

**预期结果**：应用在 ~30 秒内启动，无需配置任何环境变量。

### Manus 平台部署

```bash
# 1. 在 Manus 平台创建新项目
# 访问 https://manus.im/app

# 2. 选择 "web-db-user" 模板

# 3. 连接 GitHub 仓库
# Repository: https://github.com/Eli-yu-first/cp-ai-brain-v2

# 4. 配置环境变量（可选）
# VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
# VITE_APP_ID=your-app-id
# LOCAL_ADMIN_PASSWORD=your-password

# 5. 点击 "Publish" 按钮

# 6. 等待部署完成（~2-3 分钟）

# 7. 获得公共 URL
# https://your-project.manus.space
```

### Docker 快速部署

```bash
# 1. 构建镜像
docker build -t cp-ai-brain-v2 .

# 2. 运行容器
docker run -d \
  -p 3000:3000 \
  -e LOCAL_ADMIN_PASSWORD=cpbrain2024 \
  cp-ai-brain-v2

# 3. 访问应用
# http://localhost:3000
```

---

## 登录方式

### 本地认证（默认）

**用户名**：不需要  
**密码**：`cpbrain2024`

```bash
# 使用 API 登录
curl -X POST http://localhost:3000/api/auth/local-login \
  -H "Content-Type: application/json" \
  -d '{"password":"cpbrain2024"}'
```

### Manus OAuth（可选）

当配置了 OAuth 环境变量时，自动启用：

```env
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
VITE_APP_ID=your-app-id
```

---

## 常用命令

```bash
# 开发
pnpm run dev          # 启动开发服务器

# 构建
pnpm run build        # 生产构建
pnpm run preview      # 预览构建结果

# 数据库
pnpm run db:migrate   # 执行数据库迁移
pnpm run db:seed      # 填充示例数据（如果可用）

# 代码质量
pnpm run lint         # 代码检查
pnpm run type-check   # TypeScript 类型检查
pnpm run test         # 运行测试

# 清理
pnpm run clean        # 清理构建产物
```

---

## 项目结构速览

```
cp-ai-brain-v2/
├── client/              # React 前端
│   └── src/
│       ├── pages/       # 页面（AI War Room、文档等）
│       ├── components/  # 可复用组件
│       └── main.tsx     # 入口
├── server/              # Express 后端
│   ├── _core/           # 核心（认证、OAuth）
│   ├── routers/         # tRPC API 路由
│   └── db/              # 数据库操作
├── drizzle/             # 数据库迁移
├── shared/              # 共享代码
└── DEPLOYMENT_GUIDE.md  # 详细部署指南
```

---

## 功能概览

| 功能 | 说明 |
|------|------|
| **AI War Room** | 与 AI 进行对话和分析 |
| **文档管理** | 上传和管理文档 |
| **知识库** | 构建和查询知识库 |
| **用户认证** | 本地或 OAuth 认证 |
| **数据导入** | 导入外部数据源 |
| **实时搜索** | 全文搜索和过滤 |

---

## 配置 AI 功能

### 使用 Manus Forge API（推荐）

```env
# 前端
VITE_FRONTEND_FORGE_API_KEY=your-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.ai

# 后端
BUILT_IN_FORGE_API_KEY=your-key
BUILT_IN_FORGE_API_URL=https://api.manus.ai
```

### 使用 OpenAI API

```env
OPENAI_API_KEY=sk-...
OPENAI_API_BASE=https://api.openai.com/v1
```

---

## 故障排查

### 问题：无法连接数据库

```bash
# 检查数据库是否运行
mysql -u root -p -e "SELECT 1;"

# 验证 DATABASE_URL
echo $DATABASE_URL

# 执行迁移
pnpm run db:migrate
```

### 问题：端口已被占用

```bash
# 查找占用的进程
lsof -i :3000

# 使用其他端口
PORT=3001 pnpm run dev
```

### 问题：OAuth 配置错误

```bash
# 检查环境变量
echo $VITE_OAUTH_PORTAL_URL
echo $VITE_APP_ID

# 使用本地认证（无需配置）
# 密码：cpbrain2024
```

---

## 下一步

1. **部署到 Manus**
   - 按照上面的 Manus 平台部署步骤操作

2. **配置数据库**
   - 执行 `pnpm run db:migrate`

3. **启用 AI**
   - 配置 Manus 或 OpenAI API 密钥

4. **自定义应用**
   - 修改 `VITE_APP_TITLE` 和 `VITE_APP_LOGO`

---

## 获取帮助

- **文档**：见 DEPLOYMENT_GUIDE.md
- **状态**：见 PROJECT_STATUS.md
- **GitHub**：https://github.com/Eli-yu-first/cp-ai-brain-v2
- **Manus 支持**：https://help.manus.im

---

## 许可证

MIT

---

**准备好了？** 选择上面的任何部署方式开始吧！
