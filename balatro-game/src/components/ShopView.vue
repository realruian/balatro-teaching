<template>
  <div class="shop-view">
    <div class="shop-header">
      <div class="shop-title">商店</div>
      <div class="shop-sub">通关奖励到账！金币 ${{ store.coins }} · Joker 槽 {{ store.jokerCount }}/5</div>
    </div>

    <div class="joker-row">
      <div
        v-for="joker in store.shopJokers"
        :key="joker.id"
        class="shop-item"
      >
        <JokerCard
          :joker="joker"
          :isSuggested="store.aiSuggestedJokerId === joker.id"
        />
        <button
          class="px-btn buy-btn"
          :class="buyBtnClass(joker)"
          :disabled="!canBuy(joker)"
          @click="handleBuy(joker)"
        >{{ buyBtnText(joker) }}</button>
      </div>
    </div>

    <div class="shop-actions">
      <!-- AI 建议按钮 -->
      <button
        class="px-btn btn-ai"
        style="min-height:44px;font-size:14px;padding:10px 20px;"
        @click="handleAiSuggest"
      >🤖 AI 建议</button>

      <!-- 跳过按钮 -->
      <button class="px-btn btn-skip skip-btn" @click="handleSkip">跳过 →</button>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '../stores/game.js'
import { suggestBestShopJoker } from '../utils/ai.js'
import JokerCard from './JokerCard.vue'

const store = useGameStore()

function canBuy(joker) {
  if (store.soldJokerIds.includes(joker.id)) return false
  if (store.jokerCount >= 5) return false
  if (store.coins < joker.price) return false
  return true
}

function buyBtnText(joker) {
  if (store.soldJokerIds.includes(joker.id)) return '已售出'
  if (store.jokerCount >= 5) return '槽满了'
  if (store.coins < joker.price) return '钱不够'
  return `购买 $${joker.price}`
}

function buyBtnClass(joker) {
  if (store.soldJokerIds.includes(joker.id)) return 'btn-sold'
  if (!canBuy(joker)) return 'btn-disabled-shop'
  return 'btn-buy-active'
}

function handleBuy(joker) {
  store.buyJoker(joker.id)
}

function handleSkip() {
  store.skipShop()
}

function handleAiSuggest() {
  // 用当前手牌（为空时用空数组）模拟，找到最高性价比 Joker
  const availableJokers = store.shopJokers.filter(j => !store.soldJokerIds.includes(j.id) && store.coins >= j.price && store.jokerCount < 5)
  if (availableJokers.length === 0) return
  const bestId = suggestBestShopJoker(availableJokers, store.handCards, store.ownedJokers)
  store.aiSuggestedJokerId = bestId
}
</script>

<style scoped>
.shop-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  padding: 32px 24px;
}

.shop-header {
  text-align: center;
}

.shop-title {
  font-family: 'Inter', 'PingFang SC', sans-serif;
  font-size: 32px;
  font-weight: 900;
  color: var(--gold);
  text-shadow: 0 0 20px rgba(255,200,87,.5);
}

.shop-sub {
  font-family: var(--sans);
  font-size: 14px;
  color: var(--text-dim);
  margin-top: 6px;
  font-weight: 500;
}

.joker-row {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.shop-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.buy-btn {
  width: 140px;
  min-height: 44px;
  font-size: 14px;
  padding: 10px 12px;
  font-family: var(--sans);
  font-weight: 800;
}

.btn-buy-active {
  background: linear-gradient(180deg, #34d399 0%, #10b981 50%, #059669 100%);
  box-shadow: 0 4px 0 #047857, inset 0 1px 0 rgba(255,255,255,.3);
  border: 2px solid rgba(0,0,0,.35);
  color: #fff;
}

.btn-sold,
.btn-disabled-shop {
  background: rgba(100,100,120,.3);
  border: 2px solid rgba(100,100,120,.3);
  color: var(--muted);
  cursor: not-allowed;
  opacity: 0.6;
}

.shop-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.skip-btn {
  min-height: 48px;
  min-width: 160px;
  font-size: 16px;
}
</style>
