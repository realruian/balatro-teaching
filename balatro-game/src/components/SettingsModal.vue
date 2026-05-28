<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-card">
        <div class="modal-title">设置</div>

        <div class="settings-list">
          <!-- BGM 音量 -->
          <div class="settings-row">
            <span class="settings-label">BGM 音量</span>
            <input
              type="range" min="0" max="100"
              :value="settings.bgmVolume"
              @input="onBgmInput"
              class="slider slider-blue"
            />
          </div>

          <!-- SFX 音量 -->
          <div class="settings-row">
            <span class="settings-label">SFX 音量</span>
            <input
              type="range" min="0" max="100"
              :value="settings.sfxVolume"
              @input="onSfxInput"
              class="slider slider-orange"
            />
          </div>

          <!-- 动画速度 -->
          <div class="settings-row">
            <span class="settings-label">动画速度</span>
            <div class="radio-group">
              <button
                v-for="opt in speedOpts"
                :key="opt.value"
                class="radio-btn"
                :class="{ active: settings.animSpeed === opt.value }"
                @click="$emit('update', { animSpeed: opt.value })"
              >{{ opt.label }}</button>
            </div>
          </div>

          <!-- 显示出牌公式预览 -->
          <div class="settings-row">
            <span class="settings-label">显示出牌公式预览</span>
            <div
              class="toggle"
              :class="{ on: settings.showFormula }"
              @click="$emit('update', { showFormula: !settings.showFormula })"
            >
              <div class="toggle-knob"></div>
            </div>
          </div>
        </div>

        <button class="px-btn btn-skip close-btn" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { setBgmVolume, setSfxVolume } from '../utils/audio.js'

defineProps({ settings: { type: Object, required: true } })
const emit = defineEmits(['close', 'update'])

const speedOpts = [
  { label: '慢', value: 'slow' },
  { label: '普通', value: 'normal' },
  { label: '快', value: 'fast' },
]

// BGM 滑块实时接线（PRD §M4，@input 不是 @change）
function onBgmInput(e) {
  const v = Number(e.target.value)
  emit('update', { bgmVolume: v })
  setBgmVolume(v / 100)  // 实时更新 Howler/合成音量
}

// SFX 滑块实时接线
function onSfxInput(e) {
  const v = Number(e.target.value)
  emit('update', { sfxVolume: v })
  setSfxVolume(v / 100)  // 实时更新 Howler/合成音量
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.55);
  display: grid;
  place-items: center;
  z-index: 300;
}

.modal-card {
  width: 420px;
  background: linear-gradient(180deg, #1e3068 0%, #0a1438 100%);
  border: 2px solid #4a6bff;
  border-radius: 14px;
  padding: 24px 26px;
  box-shadow: 0 12px 32px rgba(0,0,0,.6);
}

.modal-title {
  font-family: 'Inter', 'PingFang SC', sans-serif;
  font-size: 24px;
  font-weight: 800;
  color: var(--gold);
  text-align: center;
  margin-bottom: 20px;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 22px;
}

.settings-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.settings-label {
  font-family: var(--sans);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dim);
  flex-shrink: 0;
}

.slider {
  width: 150px;
  height: 4px;
  appearance: none;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
}

.slider-blue {
  background: linear-gradient(90deg, #4dd6ff, #2196f3);
  accent-color: #4dd6ff;
}

.slider-orange {
  background: linear-gradient(90deg, #ff8844, #ff3344);
  accent-color: #ff8844;
}

.radio-group {
  display: flex;
  gap: 4px;
}

.radio-btn {
  padding: 5px 14px;
  border-radius: 6px;
  border: 1px solid rgba(74,107,255,.4);
  background: rgba(74,107,255,.1);
  color: var(--muted);
  font-family: var(--sans);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.radio-btn.active {
  background: #4a6bff;
  color: #fff;
  border-color: #4a6bff;
}

.radio-btn:hover:not(.active) {
  background: rgba(74,107,255,.2);
  color: var(--text-dim);
}

.toggle {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: rgba(74,107,255,.2);
  border: 1px solid rgba(74,107,255,.4);
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle.on {
  background: #4a6bff;
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,.4);
}

.toggle.on .toggle-knob {
  transform: translateX(20px);
}

.close-btn {
  width: 100%;
  min-height: 44px;
  font-size: 15px;
}
</style>
