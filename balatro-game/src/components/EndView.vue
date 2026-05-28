<template>
  <div class="end-view">
    <div class="end-card">
      <div class="end-title" :class="isWon ? 'title-won' : 'title-lost'">
        {{ isWon ? '🎉 通关全部' : '💀 失败' }}
      </div>
      <div class="end-coins">最终金币：${{ store.coins }}</div>

      <div v-if="store.ownedJokers.length > 0" class="jokers-summary">
        <div class="jokers-label">持有的 Joker</div>
        <div class="jokers-row">
          <JokerCard v-for="j in store.ownedJokers" :key="j.id" :joker="j" />
        </div>
      </div>
      <div v-else class="no-jokers">本局未购买任何 Joker</div>

      <button class="px-btn btn-discard restart-btn" @click="store.initGame()">重新开始</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/game.js'
import JokerCard from './JokerCard.vue'

const store = useGameStore()
const isWon = computed(() => store.gameState === 'won')
</script>

<style scoped>
.end-view {
  flex: 1;
  display: grid;
  place-items: center;
  padding: 32px;
}

.end-card {
  background: linear-gradient(180deg, #1e3068, #0a1438);
  border: 2px solid rgba(74,107,255,.5);
  border-radius: 18px;
  padding: 40px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  box-shadow: 0 12px 32px rgba(0,0,0,.6);
  min-width: 400px;
}

.end-title {
  font-family: 'Inter', 'PingFang SC', sans-serif;
  font-size: 36px;
  font-weight: 900;
  text-align: center;
}

.title-won {
  color: var(--gold);
  text-shadow: 0 0 30px rgba(255,200,87,.6);
}

.title-lost {
  color: #ef4444;
  text-shadow: 0 0 30px rgba(239,68,68,.5);
}

.end-coins {
  font-family: var(--sans);
  font-size: 18px;
  font-weight: 700;
  color: var(--gold);
}

.jokers-label {
  font-family: var(--sans);
  font-size: 13px;
  color: var(--muted);
  text-align: center;
  margin-bottom: 8px;
}

.jokers-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.jokers-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.no-jokers {
  font-family: var(--sans);
  font-size: 13px;
  color: var(--muted);
}

.restart-btn {
  min-width: 200px;
  font-size: 16px;
}
</style>
