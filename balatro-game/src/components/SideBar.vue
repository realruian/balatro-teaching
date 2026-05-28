<template>
  <aside class="sidebar">
    <!-- Logo -->
    <div class="logo">🃏 小丑牌</div>

    <!-- 盲注大面板 -->
    <div class="sb-panel blind-panel">
      <div class="panel-label">盲注 {{ store.currentBlindIndex + 1 }}/3</div>
      <div class="blind-info">
        <span class="blind-icon">{{ store.currentBlind.icon }}</span>
        <span class="blind-name">{{ store.currentBlind.name }}</span>
      </div>
      <div class="inset-box">
        <div class="inset-label">目标至少</div>
        <div class="inset-big">{{ store.currentBlind.target }}</div>
        <div class="inset-sub">通关奖励 +${{ store.currentBlind.reward + store.handsLeft }}</div>
      </div>
    </div>

    <!-- Round Score -->
    <div class="sb-panel score-panel">
      <div class="panel-label">Round Score</div>
      <div class="inset-box score-box">
        <div class="score-big" ref="scoreEl">{{ displayScore }}</div>
      </div>
      <!-- 进度条 -->
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" :style="{ width: progressPct + '%' }"></div>
      </div>
    </div>

    <!-- HAND 计分块 -->
    <div class="sb-panel hand-panel">
      <div class="hand-type-name" :class="{ empty: !store.currentHandType }">
        {{ store.currentHandType ? store.currentHandType.name : '— 选牌出牌 —' }}
      </div>
      <div class="score-row">
        <div class="chips-block">
          <span class="score-num">{{ store.currentChips }}</span>
          <span class="score-unit">筹码</span>
        </div>
        <span class="score-x">×</span>
        <div class="mult-block">
          <span class="score-num">{{ store.currentMult }}</span>
          <span class="score-unit">倍率</span>
        </div>
      </div>
    </div>

    <!-- Hands / Discards -->
    <div class="sb-panel hands-row">
      <div class="hand-block">
        <div class="hb-label">手数</div>
        <div class="hb-val green">{{ store.handsLeft }}</div>
      </div>
      <div class="hand-block">
        <div class="hb-label">弃牌</div>
        <div class="hb-val red">{{ store.discardsLeft }}</div>
      </div>
    </div>

    <!-- 金币 -->
    <div class="sb-panel money-panel">
      <span class="money-sign">$</span>
      <span class="money-val">{{ store.coins }}</span>
    </div>

    <!-- Ante / Round -->
    <div class="ante-info">
      <span class="ante-gold">底注 1/3</span>
      <span class="ante-dot">·</span>
      <span class="ante-blue">回合 {{ store.roundNumber }}</span>
    </div>

    <!-- 重新开始 -->
    <button class="px-btn btn-discard restart-btn" @click="store.initGame()">重新开始</button>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useGameStore } from '../stores/game.js'
import { gsap } from 'gsap'

const store = useGameStore()

// 进度条百分比
const progressPct = computed(() => {
  const pct = (store.blindScore / store.currentBlind.target) * 100
  return Math.min(pct, 100)
})

// 数字插值跳动（RAF）
const displayScore = ref(0)
let rafTarget = 0
let rafRunning = false

function animateScore(target) {
  rafTarget = target
  if (!rafRunning) {
    rafRunning = true
    requestAnimationFrame(step)
  }
}

function step() {
  const diff = rafTarget - displayScore.value
  if (Math.abs(diff) < 1) {
    displayScore.value = rafTarget
    rafRunning = false
    return
  }
  displayScore.value = Math.round(displayScore.value + diff * 0.12)
  requestAnimationFrame(step)
}

watch(() => store.blindScore, (newVal) => {
  animateScore(newVal)
})

const scoreEl = ref(null)
</script>

<style scoped>
.sidebar {
  width: min(28vw, 480px);
  min-width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, #1a2a5a, #111e44);
  border-right: 2px solid rgba(74,107,255,.4);
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 8px 10px;
  overflow-y: auto;
  overflow-x: hidden;
  flex-shrink: 0;
}

.logo {
  font-family: 'Press Start 2P', monospace;
  font-size: 15px;
  color: var(--gold);
  text-shadow: 2px 2px 0 #000;
  text-align: center;
  padding: 8px 0 4px;
  letter-spacing: 1px;
  flex-shrink: 0;
}

.sb-panel {
  border-radius: 10px;
  border: 2px solid rgba(74,107,255,.5);
  background: linear-gradient(180deg, #1e3068, #152050);
  padding: 8px 10px;
  flex-shrink: 0;
}

.panel-label {
  font-family: var(--sans);
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.blind-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.blind-icon { font-size: 22px; }
.blind-name {
  font-family: var(--sans);
  font-weight: 800;
  font-size: 16px;
  color: #fff;
}

.inset-box {
  background: var(--inset);
  border-radius: 8px;
  border: 1px solid rgba(74,107,255,.3);
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.inset-label {
  font-size: 11px;
  color: var(--muted);
  letter-spacing: 1px;
}

.inset-big {
  font-family: 'VT323', monospace;
  font-size: 30px;
  color: var(--gold);
  line-height: 1;
}

.inset-sub {
  font-family: var(--sans);
  font-size: 11px;
  color: var(--gold);
  font-weight: 600;
}

.score-box {
  gap: 0;
}

.score-big {
  font-family: 'VT323', monospace;
  font-size: 44px;
  color: #4dd6ff;
  line-height: 1;
}

.progress-bar-wrap {
  margin-top: 6px;
  height: 8px;
  background: rgba(0,0,0,.4);
  border: 1px solid rgba(74,107,255,.3);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4dd6ff, #2196f3);
  border-radius: 4px;
  transition: width 0.5s ease;
}

/* HAND 计分块 */
.hand-type-name {
  font-family: var(--sans);
  font-size: 14px;
  font-weight: 800;
  color: #4dd6ff;
  text-align: center;
  margin-bottom: 6px;
  letter-spacing: 1px;
}

.hand-type-name.empty {
  color: var(--muted);
  font-weight: 500;
}

.score-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.chips-block {
  flex: 1;
  background: linear-gradient(135deg, var(--chips-from), var(--chips-to));
  border-radius: 10px;
  padding: 10px 6px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.3), 0 4px 0 #0d4a80;
  border: 2px solid #1a7bd4;
}

.mult-block {
  flex: 1;
  background: linear-gradient(135deg, var(--mult-from), var(--mult-to));
  border-radius: 10px;
  padding: 10px 6px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.25), 0 4px 0 #8b1a1a;
  border: 2px solid #cc2233;
}

.score-num {
  font-family: 'Press Start 2P', monospace;
  font-size: 22px;
  font-weight: 900;
  color: rgba(0,5,20,.9);
  line-height: 1;
}

.score-unit {
  font-family: var(--sans);
  font-size: 9px;
  color: rgba(0,0,0,.5);
  margin-top: 3px;
  letter-spacing: 1px;
  font-weight: 600;
}

.score-x {
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  color: var(--text-dim);
  flex-shrink: 0;
}

/* Hands / Discards */
.hands-row {
  display: flex;
  gap: 6px;
  padding: 6px 8px;
}

.hand-block {
  flex: 1;
  text-align: center;
}

.hb-label {
  font-family: var(--sans);
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
}

.hb-val {
  font-family: 'VT323', monospace;
  font-size: 36px;
  line-height: 1;
  font-weight: 900;
}

.hb-val.green { color: #62d18b; }
.hb-val.red   { color: #ff5544; }

/* 金币 */
.money-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
}

.money-sign {
  font-family: 'Press Start 2P', monospace;
  font-size: 16px;
  color: var(--gold);
}

.money-val {
  font-family: 'VT323', monospace;
  font-size: 48px;
  color: var(--money);
  line-height: 1;
}

/* Ante 信息 */
.ante-info {
  text-align: center;
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 600;
  padding: 2px 0;
}

.ante-gold { color: var(--gold); }
.ante-dot  { color: var(--muted); margin: 0 4px; }
.ante-blue { color: #4dd6ff; }

/* 重新开始按钮 */
.restart-btn {
  width: 100%;
  min-height: 44px;
  font-size: 14px;
  padding: 10px 16px;
  margin-top: auto;
}
</style>
