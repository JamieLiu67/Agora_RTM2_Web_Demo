# Agora RTM 2.x Web Demo

## 简介
本项目是基于 Agora RTM 2.x SDK 的 Web 演示应用，支持实时消息传输、频道订阅、点对点消息、频道用户列表、消息/日志展示等功能。无需后端，纯前端静态页面，适合快速体验和二次开发。

## 功能特性
- RTM 登录/登出（AppID、UserID、Token 可自定义）
- 频道订阅/取消订阅
- 频道消息发送与接收
- 点对点消息发送与接收
- 频道在线用户列表（支持“本人”标签）
- 消息中心与日志区分区展示，均支持一键清空
- UI 美观，交互友好，移动端适配

## 快速开始
1. 克隆或下载本项目到本地。
2. 确保 `Agora_RTM_for_Web/libs/agora-rtm-2.2.2.min.js` 文件存在。
3. 启动本地静态服务器（推荐 Python）：
   ```sh
   python3 -m http.server 8080
   ```
   或直接用 VSCode Live Server 插件/双击 `index.html`。
4. 浏览器访问 `http://localhost:8080`，填写 AppID、UserID、Token，体验 RTM 功能。

## 主要文件说明
- `index.html`：主页面结构与样式，分区清晰，所有输入/按钮/展示区齐全。
- `script.js`：核心逻辑，负责 RTM 初始化、事件监听、消息/用户/日志展示、交互处理。
- `Agora_RTM_for_Web/libs/agora-rtm-2.2.2.min.js`：Agora RTM 2.x SDK（本地离线版）。

## 频道用户列表说明
- 刷新频道用户时，若某用户ID与当前登录用户一致，会在用户名后高亮显示“(本人)”标签。
- 用户列表右侧显示“在线”状态。

## 部署到 GitHub Pages
1. 推送本项目到 GitHub 仓库。
2. 在仓库设置中启用 Pages，选择主分支根目录。
3. 稍等片刻，即可通过 GitHub Pages 链接访问 Demo。

## 常见问题
- SDK 加载失败：请确保 `agora-rtm-2.2.2.min.js` 路径正确，且在 `script.js` 之前加载。
- Token 可选：测试环境可留空，生产环境需填写有效 Token。
- 频道用户列表为空：请先订阅频道并确保有用户在线。

## 参考文档
- [Agora RTM Web SDK 2.x 官方文档](https://doc.agora.io/cn/Real-time-Messaging/web-2.x/index.html)

---
如需定制功能或遇到问题，欢迎反馈或二次开发！