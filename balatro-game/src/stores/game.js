/**
 * game.js · Pinia 游戏状态机
 * 状态：playing / shop / won / lost
 */
import { defineStore } from 'pinia'
import { createDeck, shuffle, identifyHand, cardValue, applyJokers } from '../utils/poker.js'
import { playSfx } from '../utils/audio.js'

// 盲注定义（3 关）
export const BLINDS = [
  { name: '小盲注', target: 300, icon: '🔵', reward: 5 },
  { name: '中盲注', target: 500, icon: '🟡', reward: 6 },
  { name: '大盲注', target: 800, icon: '🔴', reward: 7 },
]

// 6 张 Joker 候选库
export const JOKER_LIBRARY = [
  {
    id: 'jester',
    name: '小丑',
    rarity: '普通',
    price: 3,
    art: '🃏',
    desc: '每手 +4 倍率',
    rarityColor: '#6cb4d3',
    effect: ({ chips, mult }) => ({ chips, mult: mult + 4 }),
  },
  {
    id: 'scholar',
    name: '学者',
    rarity: '普通',
    price: 3,
    art: '📖',
    desc: '打出的牌每张 A：+4 倍率',
    rarityColor: '#6cb4d3',
    effect: ({ cards, chips, mult }) => {
      const aces = cards.filter(c => c.rank === 'A').length
      return { chips, mult: mult + aces * 4 }
    },
  },
  {
    id: 'heart-collector',
    name: '红心收藏家',
    rarity: '稀有',
    price: 5,
    art: '❤️',
    desc: '打出含 ♥ 时，倍率 ×4',
    rarityColor: '#e34b6f',
    effect: ({ cards, chips, mult }) => {
      const hasHeart = cards.some(c => c.suit === '♥')
      return { chips, mult: hasHeart ? mult * 4 : mult }
    },
  },
  {
    id: 'club-lover',
    name: '梅花爱好者',
    rarity: '稀有',
    price: 5,
    art: '♣',
    desc: '打出含 ♣ 时，倍率 ×4',
    rarityColor: '#e34b6f',
    effect: ({ cards, chips, mult }) => {
      const hasClub = cards.some(c => c.suit === '♣')
      return { chips, mult: hasClub ? mult * 4 : mult }
    },
  },
  {
    id: 'royal-face',
    name: '皇家头牌',
    rarity: '稀有',
    price: 5,
    art: '👑',
    desc: '打出含 J/Q/K 时，倍率 ×10',
    rarityColor: '#e34b6f',
    effect: ({ cards, chips, mult }) => {
      const hasFace = cards.some(c => ['J', 'Q', 'K'].includes(c.rank))
      return { chips, mult: hasFace ? mult * 10 : mult }
    },
  },
  {
    id: 'sf-master',
    name: '同花顺大师',
    rarity: '传说',
    price: 8,
    art: '🔥',
    desc: '打出同花顺时 +50 倍率',
    rarityColor: '#b577ff',
    effect: ({ cards, chips, mult }) => {
      const hand = identifyHand(cards)
      return { chips, mult: hand && hand.name === '同花顺' ? mult + 50 : mult }
    },
  },
]

// 从 localStorage 读取设置
function loadSettings() {
  try {
    const raw = localStorage.getItem('balatro.settings')
    if (raw) return JSON.parse(raw)
  } catch {}
  return { bgmVolume: 50, sfxVolume: 70, animSpeed: 'normal', showFormula: true }
}

export const useGameStore = defineStore('game', {
  state: () => ({
    // 状态机
    gameState: 'playing', // playing / shop / won / lost

    // 牌组
    deck: [],
    handCards: [],
    playedCards: [],

    // 分数
    blindScore: 0,

    // 回合计数
    handsLeft: 4,
    discardsLeft: 3,
    currentBlindIndex: 0,
    roundNumber: 1,

    // 金币
    coins: 0,

    // Joker 系统
    ownedJokers: [],

    // 选中的手牌 id 集合
    selectedCardIds: [],

    // 商店状态
    shopJokers: [],
    soldJokerIds: [],

    // 动效控制
    animatingPlay: false,

    // 当前出牌显示（出牌区 UI）
    currentPlayedCards: [],
    currentHandType: null,
    currentChips: 0,
    currentMult: 0,

    // Joker 触发标记
    jokerTriggeredIndex: -1, // 高亮哪张 Joker

    // 高亮中的牌索引（逐张高亮用）
    highlightCardIndex: -1,

    // 设置
    settings: loadSettings(),

    // AI 思考中
    aiThinking: false,

    // AI 建议商店 Joker id
    aiSuggestedJokerId: null,
  }),

  getters: {
    currentBlind: (state) => BLINDS[state.currentBlindIndex],
    selectedCards: (state) => state.handCards.filter(c => state.selectedCardIds.includes(c.id)),
    canPlay: (state) => state.selectedCardIds.length > 0 && !state.animatingPlay,
    canDiscard: (state) => state.selectedCardIds.length > 0 && state.discardsLeft > 0 && !state.animatingPlay,
    jokerCount: (state) => state.ownedJokers.length,
    animSpeedMultiplier: (state) => {
      const m = { slow: 1.5, normal: 1, fast: 0.6 }
      return m[state.settings.animSpeed] ?? 1
    },
  },

  actions: {
    // 初始化 / 重开
    initGame() {
      this.deck = createDeck()
      this.handCards = []
      this.playedCards = []
      this.blindScore = 0
      this.handsLeft = 4
      this.discardsLeft = 3
      this.currentBlindIndex = 0
      this.roundNumber = 1
      this.coins = 0
      this.ownedJokers = []
      this.selectedCardIds = []
      this.shopJokers = []
      this.soldJokerIds = []
      this.animatingPlay = false
      this.currentPlayedCards = []
      this.currentHandType = null
      this.currentChips = 0
      this.currentMult = 0
      this.jokerTriggeredIndex = -1
      this.highlightCardIndex = -1
      this.aiThinking = false
      this.aiSuggestedJokerId = null
      this.gameState = 'playing'
    },

    // 抽取顶部 n 张牌到手牌
    drawCards(n) {
      const drawn = []
      for (let i = 0; i < n && this.deck.length > 0; i++) {
        const card = this.deck.pop()
        this.handCards.push(card)
        drawn.push(card)
      }
      return drawn
    },

    // 切换选中
    toggleCard(id) {
      if (this.animatingPlay) return
      const idx = this.selectedCardIds.indexOf(id)
      if (idx >= 0) {
        this.selectedCardIds.splice(idx, 1)
      } else {
        if (this.selectedCardIds.length >= 5) return
        this.selectedCardIds.push(id)
      }
      // 每次点击手牌（选中或取消）都触发 card-select 音效（PRD §M3）
      playSfx('card-select')
    },

    // 取消全选
    clearSelection() {
      this.selectedCardIds = []
    },

    // 按点数排序
    sortByRank() {
      const rankOrder = { 'A': 14, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 }
      this.handCards.sort((a, b) => rankOrder[b.rank] - rankOrder[a.rank])
    },

    // 按花色排序
    sortBySuit() {
      const suitOrder = { '♠': 0, '♥': 1, '♦': 2, '♣': 3 }
      this.handCards.sort((a, b) => suitOrder[a.suit] - suitOrder[b.suit])
    },

    // 弃牌
    discardCards() {
      if (this.selectedCardIds.length === 0 || this.discardsLeft <= 0) return []
      this.discardsLeft--
      const discarded = this.handCards.filter(c => this.selectedCardIds.includes(c.id))
      this.handCards = this.handCards.filter(c => !this.selectedCardIds.includes(c.id))
      this.clearSelection()
      return discarded
    },

    // 出牌 - 计算得分（供动效流程调用）
    computePlayScore() {
      const cards = this.selectedCards
      const hand = identifyHand(cards)
      if (!hand) return null
      const cardChips = cards.reduce((sum, c) => sum + cardValue(c.rank), 0)
      const baseChips = hand.chips + cardChips
      const { chips, mult, triggered } = applyJokers(cards, baseChips, hand.mult, this.ownedJokers)
      return { cards, hand, baseChips, baseMult: hand.mult, chips, mult, score: chips * mult, triggered }
    },

    // 完成出牌（动效结束后调用）
    finalizePlay(score) {
      const cards = this.selectedCards
      // 从手牌移除
      this.handCards = this.handCards.filter(c => !this.selectedCardIds.includes(c.id))
      this.clearSelection()

      // 累加分数
      this.blindScore += score
      this.handsLeft--
      this.currentPlayedCards = cards
    },

    // 判断本关结果
    checkBlindResult() {
      const blind = BLINDS[this.currentBlindIndex]
      if (this.blindScore >= blind.target) {
        // 通关：奖金到账播 coin 音效（PRD §M3）
        const reward = blind.reward + this.handsLeft
        this.coins += reward
        playSfx('coin')
        // 最后一关直接 won，播胜利音效
        if (this.currentBlindIndex >= BLINDS.length - 1) {
          this.gameState = 'won'
          playSfx('win')
        } else {
          this.enterShop()
        }
        return 'pass'
      } else if (this.handsLeft <= 0) {
        // 失败：播 lose 音效（PRD §M3）
        this.gameState = 'lost'
        playSfx('lose')
        return 'fail'
      }
      return 'continue'
    },

    // 进商店
    enterShop() {
      this.gameState = 'shop'
      this.soldJokerIds = []
      // 从剩余未购的 Joker 库中随机取 3 张不重复
      const available = JOKER_LIBRARY.filter(j => !this.ownedJokers.some(o => o.id === j.id))
      this.shopJokers = shuffle(available).slice(0, 3)
      this.aiSuggestedJokerId = null
    },

    // 购买 Joker
    buyJoker(jokerId) {
      if (this.ownedJokers.length >= 5) return 'full'
      const joker = this.shopJokers.find(j => j.id === jokerId)
      if (!joker) return 'notfound'
      if (this.coins < joker.price) return 'poor'
      if (this.soldJokerIds.includes(jokerId)) return 'sold'
      this.coins -= joker.price
      this.ownedJokers.push(joker)
      this.soldJokerIds.push(jokerId)
      // 购买扣金币时播 coin 音效（PRD §M3）
      playSfx('coin')
      return 'ok'
    },

    // 跳过商店 → 下一关
    skipShop() {
      this.currentBlindIndex++
      this.roundNumber++
      this.blindScore = 0
      this.handsLeft = 4
      this.discardsLeft = 3
      this.currentPlayedCards = []
      this.currentHandType = null
      this.currentChips = 0
      this.currentMult = 0
      this.deck = createDeck()
      this.handCards = []
      this.gameState = 'playing'
    },

    // 更新设置
    updateSettings(partial) {
      Object.assign(this.settings, partial)
      try {
        localStorage.setItem('balatro.settings', JSON.stringify(this.settings))
      } catch {}
    },
  }
})
