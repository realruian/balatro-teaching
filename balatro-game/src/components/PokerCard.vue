<template>
  <div
    class="poker-card"
    :class="{
      selected: isSelected,
      highlighted: isHighlighted,
      'card-hearts':   card.suit === '♥',
      'card-diamonds': card.suit === '♦',
    }"
    @click="$emit('click', card.id)"
  >
    <div class="card-corner top-left">
      <span class="rank">{{ card.rank }}</span>
      <span class="suit">{{ card.suit }}</span>
    </div>
    <div class="card-center-suit">{{ card.suit }}</div>
    <div class="card-corner bottom-right">
      <span class="rank">{{ card.rank }}</span>
      <span class="suit">{{ card.suit }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  card: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
  isHighlighted: { type: Boolean, default: false },
})
defineEmits(['click'])
</script>

<style scoped>
.poker-card {
  width: 100px;
  height: 145px;
  background: linear-gradient(180deg, var(--paper-1), var(--paper-2));
  border: 2px solid var(--card-edge);
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  flex-shrink: 0;
  user-select: none;
  box-shadow: 0 3px 6px rgba(0,0,0,.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.poker-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0,0,0,.5);
}

.poker-card.selected {
  transform: translateY(-24px);
  box-shadow: 0 8px 20px rgba(74,107,255,.6), 0 4px 8px rgba(0,0,0,.4);
}

.poker-card.highlighted {
  transform: translateY(-18px);
  box-shadow: 0 6px 20px rgba(77,214,255,.8), 0 4px 8px rgba(0,0,0,.4);
  filter: brightness(1.15);
}

/* 红色花色 */
.card-hearts .rank,
.card-hearts .suit,
.card-hearts .card-center-suit,
.card-diamonds .rank,
.card-diamonds .suit,
.card-diamonds .card-center-suit {
  color: #cc1111;
}

.card-corner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.1;
}

.card-corner.top-left {
  top: 6px;
  left: 8px;
}

.card-corner.bottom-right {
  bottom: 6px;
  right: 8px;
  transform: rotate(180deg);
}

.rank {
  font-family: 'Inter', 'PingFang SC', sans-serif;
  font-weight: 900;
  font-size: 18px;
  color: #1a1a1a;
  line-height: 1;
}

.suit {
  font-size: 14px;
  color: #1a1a1a;
  line-height: 1;
}

.card-center-suit {
  font-size: 32px;
  color: #1a1a1a;
  line-height: 1;
}
</style>
