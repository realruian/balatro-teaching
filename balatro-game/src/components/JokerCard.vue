<template>
  <div
    class="joker-card"
    :class="{ triggered: isTriggered, suggested: isSuggested }"
    :style="{ '--rarity-color': joker.rarityColor }"
  >
    <div class="rarity-border"></div>
    <div class="joker-art">{{ joker.art }}</div>
    <div class="joker-name">{{ joker.name }}</div>
    <div class="joker-desc">{{ joker.desc }}</div>
    <div class="joker-rarity-label" :style="{ color: joker.rarityColor }">{{ joker.rarity }}</div>
  </div>
</template>

<script setup>
defineProps({
  joker: { type: Object, required: true },
  isTriggered: { type: Boolean, default: false },
  isSuggested: { type: Boolean, default: false },
})
</script>

<style scoped>
.joker-card {
  width: 140px;
  height: 200px;
  background: linear-gradient(180deg, var(--paper-1), var(--paper-2));
  border: 2px solid var(--card-edge);
  border-radius: 10px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 8px;
  flex-shrink: 0;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 3px 8px rgba(0,0,0,.5);
  cursor: default;
}

/* 四角稀有度内描边 */
.rarity-border {
  position: absolute;
  inset: 4px;
  border: 2px solid var(--rarity-color);
  border-radius: 6px;
  pointer-events: none;
  opacity: 0.6;
}

.joker-art {
  font-size: 48px;
  line-height: 1;
  z-index: 1;
}

.joker-name {
  font-family: 'Inter', 'PingFang SC', sans-serif;
  font-weight: 800;
  font-size: 13px;
  color: #1a1a1a;
  text-align: center;
  z-index: 1;
}

.joker-desc {
  font-family: 'Inter', 'PingFang SC', sans-serif;
  font-size: 10px;
  color: #555;
  text-align: center;
  line-height: 1.3;
  padding: 0 4px;
  z-index: 1;
}

.joker-rarity-label {
  font-family: 'Inter', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  z-index: 1;
}

/* Joker 触发金光 */
.joker-card.triggered {
  transform: translateY(-18px) scale(1.15);
  box-shadow:
    0 0 16px rgba(255,200,87,.9),
    0 0 32px rgba(255,200,87,.5),
    0 8px 20px rgba(0,0,0,.6);
}

/* AI 建议高亮 */
.joker-card.suggested {
  box-shadow: 0 0 16px rgba(168,85,247,.8), 0 4px 12px rgba(0,0,0,.5);
}
</style>
