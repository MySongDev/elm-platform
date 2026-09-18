# GitHub Copilot 仓库指令

## 测试决策

在创建、修改或删除任何自动化测试之前，必须阅读并遵守根目录 [`AI_TEST_POLICY.md`](../AI_TEST_POLICY.md)。

默认不要新增或修改测试。仅当该政策列出的必要场景成立，或用户明确要求测试时，才可调整测试；无法确定时先不写测试，并改用与改动匹配的最小验证（type-check、lint、build 或 smoke check）。

不要为了测试覆盖率、样式细节、简单 UI、普通 CRUD、配置、路由或类型调整而补测。
