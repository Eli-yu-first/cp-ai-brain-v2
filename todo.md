# Project TODO

- [x] 审查原仓库的目录结构、技术栈、前后端入口以及需要迁移的全部文件范围
- [x] 对比原仓库与 web-db-user 脚手架，明确保持不变的路径、模块命名与运行方式
- [x] 迁移 drizzle/schema.ts，确保数据库表结构与原仓库完全一致
- [x] 迁移并适配数据库相关代码，包括 drizzle 迁移文件、server/db.ts 与相关查询逻辑
- [x] 迁移 server/routers.ts，确保全部 tRPC 接口与原仓库能力一致
- [x] 迁移 server/platformData.ts，保持平台数据逻辑与原项目一致并联通数据库
- [x] 迁移 server/marketData.ts，保持市场数据逻辑与原项目一致并联通数据库
- [x] 迁移 server/storage.ts，保持文件存储相关逻辑与原项目一致
- [x] 迁移并保留 client/index.html 与全部前端组件，确保前端 UI 设计与交互完全不变
- [x] 迁移前端页面路由、状态管理与数据调用方式，确保前端通过 trpc.*.useQuery / useMutation 正常工作
- [x] 将原有 AI 调用替换为 Manus 内置 LLM invokeLLM，确保 AI 功能结果正确
- [x] 接入 Manus OAuth，对需要登录的页面和接口实施保护且不改变原有前端体验
- [x] 保持原有业务逻辑、文件路径与模块命名，不删减、不随意重构、不变更视觉设计
- [x] 运行并修复全部 server/*.test.ts 与相关 Vitest 测试，确保全部通过
- [x] 进行端到端验证，确认数据库、鉴权、AI、marketData、platformData、tRPC 与前端展示均无功能回归
- [ ] 保存最终检查点并整理交付说明
