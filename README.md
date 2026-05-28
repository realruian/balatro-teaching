# 小丑牌教学项目

Balatro 风格扑克 Roguelike 游戏的教学实现。6 轮迭代课程的产物，第 1 轮聚焦核心循环 + 设置 + 动效 + AI 出牌。

技术栈：Vue 3 + Vite + Pinia + GSAP。

## 目录结构

```
.
├── docs/             # 每轮的 PRD / DESIGN / 实施指引（HTML）
└── balatro-game/     # 游戏项目（Vue 3 + Vite）
    └── src/
        ├── App.vue           # 主画布 + 动效编排
        ├── stores/game.js    # Pinia 游戏状态机
        ├── utils/            # poker.js 牌型识别 + ai.js 枚举
        └── components/       # SideBar / JokerCard / PokerCard / ShopView / EndView / SettingsModal
```

## 安装

需要 Node ≥ 18。

```bash
cd balatro-game
npm install
```

## 使用

```bash
# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 生产构建（产物在 balatro-game/dist/）
npm run build

# 本地预览构建产物
npm run preview
```

打开浏览器即可游玩：选 1-5 张手牌组成牌型 → 出牌计分 → 通关进商店 → 买 Joker 变强 → 打完 3 关。右上角齿轮 ⚙️ 可调动画速度，手牌区紫色 🤖 按钮一键 AI 出牌。
