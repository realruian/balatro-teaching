# 项目说明（给 Claude 看）

## 仓库定位

Balatro 风格扑克 Roguelike 游戏的教学实现。6 轮迭代课程产物 —— 每轮一个 PRD/DESIGN，提示词喂给 Claude Code 即可一锅端实施。当前第 1 轮已落地，覆盖核心循环 + 设置面板 + 4 类动效 + AI 出牌。

## 目录约定

- `docs/` — 每轮的 PRD（产品需求）/ DESIGN（设计规范）/ 实施指引，是 PM/UI/Engineer 三类 AI 同事的产出，**只读**，改设计先改这里再改代码
- `balatro-game/` — 游戏代码主目录
  - `src/App.vue` — 主画布，所有跨组件的动效编排（飞牌 / 逐张高亮 / Joker 金光 / 发牌错峰）在这里
  - `src/stores/game.js` — Pinia 状态机（playing / shop / won / lost），所有游戏状态唯一来源
  - `src/utils/poker.js` — 52 张牌生成、9 种牌型识别、计分公式、Joker effect 应用
  - `src/utils/ai.js` — 218 种子集枚举找最高分组合 + 商店性价比建议
  - `src/components/` — `SideBar` / `PokerCard` / `JokerCard` / `ShopView` / `EndView` / `SettingsModal`
- `dist/` — 构建产物，gitignored

## 常用命令

所有命令都在 `balatro-game/` 子目录下跑（项目根没有 package.json）：

```bash
cd balatro-game

npm install          # 安装依赖
npm run dev          # 开发服务器（http://localhost:5173）
npm run build        # 生产构建，必须 0 error 0 warning
npm run preview      # 预览构建产物
```

## 关键硬约束（来自 PRD §10，改代码必看）

1. **布局**：`main-area` 的 grid-template-rows 必须是 `230px 1fr 280px`，不是 1fr 等分；不要给 main-area 加 padding-right
2. **牌堆**：`absolute` 内嵌出牌区右下角，**不要 fixed** —— 否则商店覆盖层会被它穿透
3. **状态机**：大盲注（第 3 关）通关直接 `gameState = 'won'`，不进商店
4. **按钮文案**：`出牌 (X)` 的 X 是选中数；`弃牌 (X)` 的 X 是**剩余弃牌数**，不是选中数
5. **字体三类分工**：中文一律 Inter + PingFang SC；数字大屏用 VT323；纯英文装饰才用 Press Start 2P —— **绝不交叉**（中文用 VT323/Press Start 2P 渲染会糊）
6. **标志位双重职责拆分**：`animatingPlay` 同时管「UI 按钮 disabled」和「防止重入」是行的，但 store 内部 action 不要再用 `canPlay/canDiscard` getter 自检（getter 包含 `!animatingPlay`，外层刚设 true 立刻把自家挡死）—— store 内部检查原始业务条件即可，UI 禁用由 getter 负责
7. **背景色**：深蓝 `#0a1438 → #1a2858 → #0a1438`，不要偏紫

## 验证规则

改完代码必须在 `balatro-game/` 下跑 `npm run build` 确认 0 error 0 warning，再交付。
