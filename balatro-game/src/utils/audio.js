/**
 * audio.js · 音频管理模块（Web Audio API 程序化合成）
 *
 * 降级方案：联网下载素材受限，全部音效在浏览器内实时合成。
 * 外部接口完全符合 PRD §5.1 约定：
 *   initAudio() / playBgm() / stopBgm() / playSfx(name) / setBgmVolume(v) / setSfxVolume(v)
 * v 的单位与 PRD 一致：0.0–1.0 浮点（slider 值 / 100 后传入）
 */

let ctx = null        // 全局 AudioContext（首次交互后才创建）
let bgmGainNode = null  // BGM 总增益节点
let sfxGainNode = null  // SFX 总增益节点
let bgmStarted = false  // 防止 BGM 重复启动

// 从 localStorage 读取已存的音量设置（PRD §1.3：初始化时读回）
function loadSavedVolumes() {
  try {
    const raw = localStorage.getItem('balatro.settings')
    if (raw) {
      const s = JSON.parse(raw)
      return {
        bgm: (s.bgmVolume ?? 50) / 100,
        sfx: (s.sfxVolume ?? 70) / 100,
      }
    }
  } catch {}
  return { bgm: 0.5, sfx: 0.7 }
}

// BGM 序列：C 小调 casino-jazz 音阶，8 小节循环
// 每个元素 [频率Hz, 持续秒]
const BGM_SEQ = [
  [261.63, 0.25], [329.63, 0.25], [392.00, 0.25], [523.25, 0.25],
  [493.88, 0.25], [440.00, 0.25], [392.00, 0.25], [349.23, 0.25],
  [329.63, 0.25], [261.63, 0.25], [220.00, 0.25], [246.94, 0.25],
  [261.63, 0.25], [311.13, 0.25], [349.23, 0.25], [392.00, 0.25],
  [440.00, 0.25], [523.25, 0.25], [493.88, 0.25], [440.00, 0.25],
  [392.00, 0.25], [349.23, 0.25], [329.63, 0.25], [311.13, 0.25],
  [293.66, 0.25], [261.63, 0.25], [246.94, 0.25], [220.00, 0.25],
  [246.94, 0.25], [261.63, 0.5],  [293.66, 0.25], [261.63, 0.25],
]

// 创建 AudioContext（必须在用户交互后调用，规避 autoplay 限制）
function ensureContext() {
  if (ctx) {
    // Safari / Chrome 有时在页面重新获得焦点后会把 context 挂起，统一 resume
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }
  const vols = loadSavedVolumes()
  ctx = new (window.AudioContext || window.webkitAudioContext)()

  // BGM 增益（基准 0.6，再乘用户音量）
  bgmGainNode = ctx.createGain()
  bgmGainNode.gain.value = vols.bgm * 0.6
  bgmGainNode.connect(ctx.destination)

  // SFX 增益
  sfxGainNode = ctx.createGain()
  sfxGainNode.gain.value = vols.sfx * 0.8
  sfxGainNode.connect(ctx.destination)

  // 部分浏览器 AudioContext 创建后处于 suspended，需显式 resume
  ctx.resume()

  return ctx
}

// ============================================================
// 对外接口：音量控制（PRD §5.4，v 单位 0.0–1.0）
// ============================================================

export function setBgmVolume(v) {
  if (!bgmGainNode) return
  bgmGainNode.gain.setTargetAtTime(v * 0.6, ctx.currentTime, 0.003)
}

export function setSfxVolume(v) {
  if (!sfxGainNode) return
  sfxGainNode.gain.setTargetAtTime(v * 0.8, ctx.currentTime, 0.003)
}

// ============================================================
// BGM：chiptune 循环（PRD §M2）
// ============================================================

export function playBgm() {
  if (bgmStarted) return   // 防重复启动
  bgmStarted = true
  ensureContext()

  let stepIndex = 0
  let nextTime = ctx.currentTime + 0.05

  function scheduleNote() {
    if (!bgmGainNode) return
    const [freq, dur] = BGM_SEQ[stepIndex % BGM_SEQ.length]
    stepIndex++

    const osc = ctx.createOscillator()
    osc.type = 'square'
    osc.frequency.value = freq

    // 轻微颤音 LFO
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 5.5
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 2.5
    lfo.connect(lfoGain)
    lfoGain.connect(osc.frequency)

    // 音量包络
    const env = ctx.createGain()
    env.gain.setValueAtTime(0, nextTime)
    env.gain.linearRampToValueAtTime(0.18, nextTime + 0.02)
    env.gain.linearRampToValueAtTime(0.12, nextTime + dur * 0.6)
    env.gain.linearRampToValueAtTime(0, nextTime + dur)

    osc.connect(env)
    env.connect(bgmGainNode)

    osc.start(nextTime)
    lfo.start(nextTime)
    osc.stop(nextTime + dur + 0.01)
    lfo.stop(nextTime + dur + 0.01)

    nextTime += dur

    // 提前 0.5s 调度下一个音符，避免卡顿
    const timeToNext = (nextTime - ctx.currentTime - 0.5) * 1000
    setTimeout(scheduleNote, Math.max(0, timeToNext))
  }

  scheduleNote()
}

export function stopBgm() {
  // Web Audio 合成无法精确 stop 调度链，重置 started 标记即可
  // 若需要真正静音，把 bgmGainNode.gain.value 降到 0
  if (bgmGainNode) bgmGainNode.gain.value = 0
  bgmStarted = false
}

// ============================================================
// SFX 内部工具函数
// ============================================================

function playTone({ type = 'square', freq, dur = 0.15, vol = 1, delay = 0, ramp = false, freqEnd = null }) {
  if (!sfxGainNode) return
  const t = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  if (ramp && freqEnd !== null) {
    osc.frequency.setValueAtTime(freq, t)
    osc.frequency.linearRampToValueAtTime(freqEnd, t + dur)
  }
  env.gain.setValueAtTime(0, t)
  env.gain.linearRampToValueAtTime(vol * 0.7, t + 0.008)
  env.gain.linearRampToValueAtTime(vol * 0.5, t + dur * 0.5)
  env.gain.linearRampToValueAtTime(0, t + dur)
  osc.connect(env)
  env.connect(sfxGainNode)
  osc.start(t)
  osc.stop(t + dur + 0.01)
}

function playNoise({ dur = 0.2, vol = 0.5, delay = 0 }) {
  if (!sfxGainNode) return
  const bufSize = ctx.sampleRate * dur
  const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buffer

  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 800

  const env = ctx.createGain()
  const t = ctx.currentTime + delay
  env.gain.setValueAtTime(vol, t)
  env.gain.exponentialRampToValueAtTime(0.001, t + dur)

  src.connect(filter)
  filter.connect(env)
  env.connect(sfxGainNode)
  src.start(t)
  src.stop(t + dur + 0.01)
}

// ============================================================
// SFX 名称映射表（PRD §M3，用 playSfx(name) 统一调用）
// ============================================================

const SFX_MAP = {
  // card-select：轻 click，短促方波
  'card-select': () => {
    playTone({ type: 'square', freq: 880, dur: 0.06, vol: 0.6 })
    playTone({ type: 'square', freq: 1200, dur: 0.04, vol: 0.4, delay: 0.04 })
  },

  // card-play：whoosh，扫频上升
  'card-play': () => {
    playTone({ type: 'sawtooth', freq: 200, dur: 0.4, vol: 0.7, ramp: true, freqEnd: 600 })
    playTone({ type: 'square', freq: 400, dur: 0.25, vol: 0.5, delay: 0.1 })
  },

  // card-deal：flick，单音短促弹奏
  'card-deal': () => {
    playTone({ type: 'triangle', freq: 1047, dur: 0.12, vol: 0.55 })
  },

  // discard：sweep，快速下行扫频
  'discard': () => {
    playTone({ type: 'sawtooth', freq: 500, dur: 0.3, vol: 0.6, ramp: true, freqEnd: 120 })
    playNoise({ dur: 0.15, vol: 0.2, delay: 0.05 })
  },

  // joker-trigger：chime，上扬音阶四连音
  'joker-trigger': () => {
    const scale = [523.25, 659.25, 783.99, 1046.50]
    scale.forEach((freq, i) => {
      playTone({ type: 'sine', freq, dur: 0.18, vol: 0.7, delay: i * 0.07 })
    })
  },

  // score-explode：impact，大鼓 + cymbal
  'score-explode': () => {
    playTone({ type: 'sine', freq: 160, dur: 0.35, vol: 1.0, ramp: true, freqEnd: 40 })
    playNoise({ dur: 0.25, vol: 0.7 })
    playTone({ type: 'square', freq: 3500, dur: 0.1, vol: 0.3, delay: 0.02 })
    playTone({ type: 'square', freq: 5000, dur: 0.08, vol: 0.2, delay: 0.04 })
  },

  // coin：ka-ching，两声金属音
  'coin': () => {
    playTone({ type: 'sine', freq: 1318.51, dur: 0.15, vol: 0.8 })
    playTone({ type: 'sine', freq: 1567.98, dur: 0.2,  vol: 0.9, delay: 0.12 })
  },

  // win：胜利号角，上扬和弦
  'win': () => {
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]
    notes.forEach((freq, i) => {
      playTone({ type: 'square', freq, dur: 0.28, vol: 0.75, delay: i * 0.1 })
      playTone({ type: 'sine', freq: freq * 2, dur: 0.2, vol: 0.3, delay: i * 0.1 + 0.05 })
    })
  },

  // lose：低沉钟声，下行
  'lose': () => {
    const notes = [392.00, 329.63, 261.63, 196.00]
    notes.forEach((freq, i) => {
      playTone({ type: 'sine', freq, dur: 0.5, vol: 0.65, delay: i * 0.22 })
    })
    playNoise({ dur: 0.4, vol: 0.25, delay: 0.6 })
  },
}

// ============================================================
// 对外接口：playSfx（PRD §5.1 锁定接口）
// ============================================================

export function playSfx(name) {
  if (!ctx || !sfxGainNode) return   // AudioContext 尚未初始化，静默忽略
  const fn = SFX_MAP[name]
  if (fn) fn()
}

// ============================================================
// 初始化（在 main.js 调用，PRD §M2.2）
// 注册首次有效用户交互监听，触发后启动 BGM 并解除 autoplay 拦截
// ============================================================

export function initAudio() {
  // mousedown + touchstart 双重监听，兼容移动端 Safari
  function onFirstInteraction() {
    ensureContext()
    playBgm()
    document.removeEventListener('mousedown', onFirstInteraction)
    document.removeEventListener('touchstart', onFirstInteraction)
  }
  document.addEventListener('mousedown', onFirstInteraction, { once: true })
  document.addEventListener('touchstart', onFirstInteraction, { once: true })
}
