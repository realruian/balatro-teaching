<template>
  <div class="game-root">
    <!-- 右上角设置按钮 -->
    <button class="settings-btn" @click="showSettings = true" title="设置">⚙️</button>

    <!-- 左 Sidebar（playing / shop / won / lost 都显示）-->
    <SideBar />

    <!-- 右主区 -->
    <main class="main-area">

      <!-- ======= playing 状态 ======= -->
      <template v-if="store.gameState === 'playing'">

        <!-- 第 1 段：Joker 区 -->
        <section class="area joker-area">
          <div class="area-label-row">
            <span class="joker-label">JOKERS · {{ store.jokerCount }}/5</span>
          </div>
          <div class="joker-row">
            <div v-for="i in 5" :key="i" class="joker-slot-wrap">
              <JokerCard
                v-if="store.ownedJokers[i-1]"
                :joker="store.ownedJokers[i-1]"
                :isTriggered="store.jokerTriggeredIndex === i - 1"
                class="joker-card-item"
              />
              <div v-else class="joker-empty">
                <span class="empty-plus">+</span>
                <span class="empty-label">空槽</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 第 2 段：出牌区 -->
        <section class="area play-area" ref="playAreaRef">
          <div class="play-area-header">
            <span class="play-area-title">出牌区</span>
            <span v-if="store.currentHandType" class="play-area-hand-name">
              {{ store.currentHandType.name }}
            </span>
          </div>

          <!-- 出牌区内容 -->
          <div class="played-cards-wrap">
            <div v-if="store.currentPlayedCards.length > 0" class="played-cards-row">
              <PokerCard
                v-for="(card, idx) in store.currentPlayedCards"
                :key="card.id"
                :card="card"
                :isHighlighted="store.highlightCardIndex === idx"
              />
            </div>
            <div v-else class="play-empty-hint">
              <template v-if="store.settings.showFormula && store.selectedCardIds.length > 0">
                <span class="formula-preview">
                  {{ previewFormulaText }}
                </span>
              </template>
              <template v-else>
                <span>选择手牌组成牌型（1-5 张）</span>
              </template>
            </div>
          </div>

          <!-- 牌堆（absolute 内嵌出牌区右下角）-->
          <div class="deck-pile" ref="deckPileRef">
            <div class="deck-layer deck-l3"></div>
            <div class="deck-layer deck-l2"></div>
            <div class="deck-layer deck-l1"></div>
            <div class="deck-count">{{ store.deck.length }}/52</div>
          </div>
        </section>

        <!-- 第 3 段：手牌 + 操作 -->
        <section class="area hand-area">
          <div class="hand-header">
            <span class="hand-label">手牌</span>
            <span class="hand-count">已选 {{ store.selectedCardIds.length }} / 5 张</span>
          </div>

          <div class="hand-cards-row" ref="handAreaRef">
            <PokerCard
              v-for="card in store.handCards"
              :key="card.id"
              :card="card"
              :isSelected="store.selectedCardIds.includes(card.id)"
              :data-card-id="card.id"
              class="hand-card"
              @click="store.toggleCard(card.id)"
            />
          </div>

          <div class="action-row">
            <button
              class="px-btn btn-play"
              :disabled="!store.canPlay"
              @click="handlePlay"
            >出牌 ({{ store.selectedCardIds.length }})</button>

            <button
              class="px-btn btn-discard"
              :disabled="!store.canDiscard"
              @click="handleDiscard"
            >弃牌 ({{ store.discardsLeft }})</button>

            <button class="px-btn btn-sort" @click="store.sortByRank()">按点排序</button>
            <button class="px-btn btn-sort" @click="store.sortBySuit()">按花排序</button>

            <button
              class="px-btn btn-ai"
              :class="{ thinking: store.aiThinking }"
              :disabled="store.aiThinking || !store.canPlay && store.handCards.length === 0"
              @click="handleAiPlay"
              style="margin-left: auto;"
            >{{ store.aiThinking ? '🤔 AI 思考中…' : '🤖 AI 出牌' }}</button>
          </div>
        </section>

      </template>

      <!-- ======= shop 状态 ======= -->
      <ShopView v-else-if="store.gameState === 'shop'" />

      <!-- ======= won / lost 状态 ======= -->
      <EndView v-else-if="store.gameState === 'won' || store.gameState === 'lost'" />

    </main>

    <!-- 设置 Modal -->
    <SettingsModal
      v-if="showSettings"
      :settings="store.settings"
      @close="showSettings = false"
      @update="(p) => store.updateSettings(p)"
    />

    <!-- 公式爆出大字 -->
    <Teleport to="body">
      <div class="final-formula" :class="{ show: showFormula }" ref="formulaEl">
        <span class="ff-chips">{{ formulaChips }}</span>
        <span class="ff-x">×</span>
        <span class="ff-mult">{{ formulaMult }}</span>
        <span class="ff-eq">=</span>
        <span class="ff-score">{{ formulaScore }}</span>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { gsap } from 'gsap'
import { useGameStore } from './stores/game.js'
import { identifyHand, cardValue } from './utils/poker.js'
import { findBestPlay } from './utils/ai.js'
import SideBar from './components/SideBar.vue'
import JokerCard from './components/JokerCard.vue'
import PokerCard from './components/PokerCard.vue'
import ShopView from './components/ShopView.vue'
import EndView from './components/EndView.vue'
import SettingsModal from './components/SettingsModal.vue'

const store = useGameStore()

// refs
const playAreaRef = ref(null)
const deckPileRef = ref(null)
const handAreaRef = ref(null)
const formulaEl = ref(null)

const showSettings = ref(false)
const showFormula = ref(false)
const formulaChips = ref(0)
const formulaMult = ref(0)
const formulaScore = ref(0)

// 公式预览（选牌但未出牌时）
const previewFormulaText = computed(() => {
  const cards = store.selectedCards
  if (cards.length === 0) return ''
  const hand = identifyHand(cards)
  if (!hand) return ''
  const cardChips = cards.reduce((s, c) => s + cardValue(c.rank), 0)
  const chips = hand.chips + cardChips
  const score = chips * hand.mult
  return `${chips} × ${hand.mult} = ${score}`
})

// 初始化游戏 + 首次发牌
onMounted(async () => {
  store.initGame()
  await nextTick()
  await dealInitialCards()
})

// ============================================================
// 发牌动画：从牌堆飞到手牌槽位
// ============================================================
async function dealCards(cardIds, speedMult) {
  const spd = speedMult ?? store.animSpeedMultiplier
  await nextTick()

  const deckEl = deckPileRef.value
  if (!deckEl) return
  const deckRect = deckEl.getBoundingClientRect()

  for (let i = 0; i < cardIds.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 60 * i * spd))
    const cardEl = handAreaRef.value?.querySelector(`[data-card-id="${cardIds[i]}"]`)
    if (!cardEl) continue

    const targetRect = cardEl.getBoundingClientRect()

    // 克隆一个飞行元素
    const clone = document.createElement('div')
    clone.style.cssText = `
      position: fixed;
      left: ${deckRect.left + deckRect.width / 2 - 50}px;
      top:  ${deckRect.top  + deckRect.height / 2 - 72}px;
      width: 100px; height: 145px;
      background: linear-gradient(180deg, #fff8e1, #f7e9c4);
      border: 2px solid #1a0f24;
      border-radius: 8px;
      box-shadow: 0 3px 6px rgba(0,0,0,.5);
      pointer-events: none;
      z-index: 1000;
    `
    document.body.appendChild(clone)

    const finalLeft = targetRect.left + targetRect.width / 2 - 50
    const finalTop  = targetRect.top  + targetRect.height / 2 - 72

    gsap.to(clone, {
      left: finalLeft,
      top: finalTop,
      duration: 0.4 * spd,
      ease: 'power2.out',
      onComplete: () => {
        clone.remove()
      }
    })
  }
  // 等全部飞完
  await new Promise(resolve => setTimeout(resolve, (60 * (cardIds.length - 1) + 400) * spd))
}

// 首次发 8 张
async function dealInitialCards() {
  const drawn = store.drawCards(8)
  await dealCards(drawn.map(c => c.id))
}

// ============================================================
// 飞字动画（chips +N / mult ×N）
// ============================================================
function flyText(text, fromEl, color, duration) {
  const rect = fromEl.getBoundingClientRect()
  const el = document.createElement('div')
  el.textContent = text
  el.style.cssText = `
    position: fixed;
    left: ${rect.left + rect.width / 2}px;
    top: ${rect.top}px;
    color: ${color};
    font-family: 'Press Start 2P', monospace;
    font-size: 18px;
    font-weight: 900;
    pointer-events: none;
    z-index: 9999;
    white-space: nowrap;
    transform: translateX(-50%);
    text-shadow: 0 2px 4px rgba(0,0,0,.6);
  `
  document.body.appendChild(el)
  gsap.to(el, {
    y: -60,
    opacity: 0,
    duration: (duration ?? 0.5) * store.animSpeedMultiplier,
    ease: 'power1.out',
    onComplete: () => el.remove()
  })
}

// ============================================================
// 出牌主流程
// ============================================================
async function handlePlay() {
  if (!store.canPlay) return
  store.animatingPlay = true

  const spd = store.animSpeedMultiplier
  const result = store.computePlayScore()
  if (!result) { store.animatingPlay = false; return }

  const { cards, hand, baseChips, baseMult, chips, mult, score, triggered } = result

  // ---- 步骤 1：选中的牌"飞向出牌区" ----
  // 把选中牌 visibility:hidden，显示克隆飞过去
  const selectedEls = []
  for (const card of cards) {
    const el = handAreaRef.value?.querySelector(`[data-card-id="${card.id}"]`)
    if (el) {
      selectedEls.push({ el, card, rect: el.getBoundingClientRect() })
      el.style.visibility = 'hidden'
    }
  }

  // 目标：出牌区中央
  const paRect = playAreaRef.value?.getBoundingClientRect()
  if (paRect) {
    const clones = selectedEls.map(({ rect, card }, idx) => {
      const clone = document.createElement('div')
      clone.style.cssText = `
        position: fixed;
        left: ${rect.left}px; top: ${rect.top}px;
        width: ${rect.width}px; height: ${rect.height}px;
        background: linear-gradient(180deg, #fff8e1, #f7e9c4);
        border: 2px solid #1a0f24;
        border-radius: 8px;
        box-shadow: 0 3px 6px rgba(0,0,0,.5);
        pointer-events: none;
        z-index: 800;
        display: flex; align-items: center; justify-content: center;
        font-size: 28px;
      `
      // 显示花色作为内容
      clone.textContent = card.suit
      document.body.appendChild(clone)

      const spacing = 108
      const totalWidth = cards.length * spacing
      const targetLeft = paRect.left + paRect.width / 2 - totalWidth / 2 + idx * spacing
      const targetTop  = paRect.top + paRect.height / 2 - 72

      gsap.to(clone, {
        left: targetLeft, top: targetTop,
        duration: 0.35 * spd,
        ease: 'power2.out',
      })
      return clone
    })

    await new Promise(r => setTimeout(r, 350 * spd))

    // 移除克隆，让真实出牌区显示
    clones.forEach(c => c.remove())
  }

  // ---- 步骤 2：设定牌型 & 初始 chips/mult ----
  store.currentHandType = hand
  store.currentChips = baseChips
  store.currentMult = baseMult
  store.currentPlayedCards = cards
  // 恢复手牌可见性（即将从手牌移除）
  selectedEls.forEach(({ el }) => { el.style.visibility = '' })

  await new Promise(r => setTimeout(r, 200 * spd))

  // ---- 步骤 3：逐张高亮 + chips 飞字 ----
  for (let i = 0; i < cards.length; i++) {
    store.highlightCardIndex = i
    const cv = cardValue(cards[i].rank)

    // chips 飞字
    const playedCardEls = playAreaRef.value?.querySelectorAll('.played-cards-row .poker-card')
    const targetEl = playedCardEls?.[i] || playAreaRef.value
    if (targetEl) {
      flyText(`+${cv}`, targetEl, '#4dd6ff')
    }

    store.currentChips += cv
    await new Promise(r => setTimeout(r, 150 * spd))
  }
  store.highlightCardIndex = -1

  // ---- 步骤 4：Joker 触发 ----
  let runningChips = store.currentChips
  let runningMult = baseMult

  for (let i = 0; i < triggered.length; i++) {
    const t = triggered[i]
    if (!t) continue

    store.jokerTriggeredIndex = i

    // Joker 上方飞出文字
    const jokerEls = document.querySelectorAll('.joker-card-item')
    const jEl = jokerEls[i]
    if (jEl) {
      if (t.newMult !== runningMult) {
        const ratio = runningMult > 0 ? t.newMult / runningMult : 1
        const delta = t.newMult - runningMult
        flyText(
          ratio > 1.5 ? `×${Math.round(ratio)}` : `+${Math.round(delta)} Mult`,
          jEl,
          '#ff8844',
          0.5
        )
      }
      if (t.newChips !== runningChips) {
        flyText(`+${t.newChips - runningChips}`, jEl, '#4dd6ff', 0.5)
      }
    }

    runningMult = t.newMult
    runningChips = t.newChips
    store.currentMult = runningMult
    store.currentChips = runningChips

    await new Promise(r => setTimeout(r, 800 * spd))
    store.jokerTriggeredIndex = -1
    await new Promise(r => setTimeout(r, 100 * spd))
  }

  // ---- 步骤 5：公式爆出 ----
  formulaChips.value = chips
  formulaMult.value = mult
  formulaScore.value = score
  showFormula.value = true

  await new Promise(r => setTimeout(r, 800 * spd + 200))

  // ---- 步骤 6：blindScore 累加（RAF 数字插值在 SideBar 里自动跑）----
  store.finalizePlay(score)

  await new Promise(r => setTimeout(r, 200 * spd))
  showFormula.value = false

  // ---- 检查通关/失败 ----
  const result2 = store.checkBlindResult()

  if (result2 === 'continue') {
    // ---- 步骤 7：补牌飞入 ----
    const need = 8 - store.handCards.length
    if (need > 0) {
      const drawn = store.drawCards(need)
      await nextTick()
      await dealCards(drawn.map(c => c.id))
    }
  }

  store.animatingPlay = false
}

// ============================================================
// 弃牌
// ============================================================
async function handleDiscard() {
  if (!store.canDiscard) return
  store.animatingPlay = true

  const discarded = store.discardCards()
  await nextTick()

  const spd = store.animSpeedMultiplier
  const need = 8 - store.handCards.length
  if (need > 0) {
    const drawn = store.drawCards(need)
    await nextTick()
    await dealCards(drawn.map(c => c.id))
  }

  store.animatingPlay = false
}

// ============================================================
// AI 出牌
// ============================================================
async function handleAiPlay() {
  if (store.aiThinking) return
  store.aiThinking = true
  store.clearSelection()

  // 思考动画 800ms
  await new Promise(r => setTimeout(r, 800 * store.animSpeedMultiplier))

  const best = findBestPlay(store.handCards, store.ownedJokers)
  // 设置选中
  for (const card of best) {
    store.selectedCardIds.push(card.id)
  }

  store.aiThinking = false

  await new Promise(r => setTimeout(r, 200 * store.animSpeedMultiplier))
  await handlePlay()
}
</script>

<style scoped>
.game-root {
  width: 100vw;
  height: 100vh;
  display: flex;
  overflow: hidden;
}

/* 右上角设置按钮 */
.settings-btn {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 100;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(180deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
  box-shadow: 0 4px 0 #92400e, 0 6px 12px rgba(245,158,11,.35), inset 0 1px 0 rgba(255,255,255,.3);
  border: 2px solid rgba(0,0,0,.35);
  color: #fff;
  font-size: 22px;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: all 0.15s ease;
}

.settings-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

/* 右主区 */
.main-area {
  flex: 1;
  display: grid;
  grid-template-rows: 230px 1fr 280px;
  overflow: hidden;
  min-width: 0;
}

/* 3 段背景微差 */
.area {
  padding: 12px 16px;
  overflow: hidden;
}

.joker-area {
  background: rgba(15,23,42,.6);
  border-bottom: 1px solid rgba(74,107,255,.1);
}

.play-area {
  background: rgba(5,8,24,.5);
  position: relative;
  border-bottom: 1px solid rgba(74,107,255,.1);
  display: flex;
  flex-direction: column;
}

.hand-area {
  /* 沿用 main 底色 */
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-top: 8px;
}

/* ===== Joker 区 ===== */
.area-label-row {
  margin-bottom: 8px;
}

.joker-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 13px;
  color: var(--gold);
  text-shadow: 2px 2px 0 #000;
  letter-spacing: 1px;
}

.joker-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.joker-slot-wrap {
  flex-shrink: 0;
}

.joker-empty {
  width: 140px;
  height: 185px;
  border: 2.5px dashed rgba(79,70,229,.4);
  border-radius: 10px;
  background: rgba(79,70,229,.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.empty-plus {
  font-family: 'Inter', sans-serif;
  font-size: 24px;
  color: var(--muted);
}

.empty-label {
  font-family: var(--sans);
  font-size: 12px;
  color: var(--muted);
}

/* ===== 出牌区 ===== */
.play-area-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.play-area-title {
  font-family: var(--sans);
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
}

.play-area-hand-name {
  font-family: var(--sans);
  font-size: 16px;
  font-weight: 800;
  color: #4dd6ff;
}

.played-cards-wrap {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 8px;
}

.played-cards-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.play-empty-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-family: var(--sans);
  font-size: 14px;
  color: var(--muted);
  opacity: 0.55;
  padding-top: 20px;
}

.formula-preview {
  font-family: 'Press Start 2P', monospace;
  font-size: 16px;
  color: #4dd6ff;
  opacity: 1;
}

/* ===== 牌堆 ===== */
.deck-pile {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 90px;
  height: 130px;
  pointer-events: none;
  z-index: 2;
}

.deck-layer {
  position: absolute;
  inset: 0;
  background-color: #1a0f24;
  background-image: url('/card-back.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border: 2px solid #1a0f24;
  border-radius: 8px;
  box-shadow: 0 2px 0 rgba(0, 0, 0, .5);
}

.deck-l3 { transform: translate(-6px, 6px); opacity: .5; }
.deck-l2 { transform: translate(-3px, 3px); opacity: .75; }
.deck-l1 { transform: translate(0, 0); }

.deck-count {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'VT323', monospace;
  font-size: 15px;
  color: var(--gold);
  white-space: nowrap;
}

/* ===== 手牌区 ===== */
.hand-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 6px;
  flex-shrink: 0;
}

.hand-label {
  font-family: var(--sans);
  font-size: 14px;
  font-weight: 800;
  color: var(--gold);
}

.hand-count {
  font-family: var(--sans);
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
}

.hand-cards-row {
  display: flex;
  gap: 8px;
  justify-content: center;
  padding: 28px 4px 8px;
  flex-shrink: 0;
  overflow-x: auto;
}

/* 操作按钮行 */
.action-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 140px 4px 4px;
  flex-shrink: 0;
}

.action-row .px-btn {
  min-height: 48px;
  font-size: 15px;
  padding: 12px 20px;
}

.action-row .btn-sort {
  min-height: 44px;
  font-size: 13px;
  padding: 8px 14px;
}
</style>
