/**
 * poker.js · 牌型识别 + 计分工具
 * 点数映射：A=11, J/Q/K=10, 其他=数字本身
 */

// 牌型定义（按基础筹码降序）
export const HAND_TYPES = [
  { name: '同花顺', chips: 100, mult: 8 },
  { name: '四条',   chips: 60,  mult: 7 },
  { name: '葫芦',   chips: 40,  mult: 4 },
  { name: '同花',   chips: 35,  mult: 4 },
  { name: '顺子',   chips: 30,  mult: 4 },
  { name: '三条',   chips: 30,  mult: 3 },
  { name: '两对',   chips: 20,  mult: 2 },
  { name: '对子',   chips: 10,  mult: 2 },
  { name: '高牌',   chips: 5,   mult: 1 },
]

export const SUITS = ['♠', '♥', '♦', '♣']
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

// 点数面值
export function cardValue(rank) {
  if (rank === 'A') return 11
  if (['J', 'Q', 'K'].includes(rank)) return 10
  return parseInt(rank)
}

// 生成完整 52 张牌组
export function createDeck() {
  const deck = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit, id: `${rank}${suit}` })
    }
  }
  return shuffle(deck)
}

// Fisher-Yates 洗牌
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 识别牌型（输入 1-5 张）
export function identifyHand(cards) {
  const n = cards.length
  if (n === 0) return null

  const ranks = cards.map(c => c.rank)
  const suits = cards.map(c => c.suit)

  const rankCount = {}
  for (const r of ranks) rankCount[r] = (rankCount[r] || 0) + 1
  const counts = Object.values(rankCount).sort((a, b) => b - a)

  const isFlush = n === 5 && suits.every(s => s === suits[0])
  const isStraight = n === 5 && checkStraight(ranks)

  if (isFlush && isStraight) return HAND_TYPES[0] // 同花顺
  if (counts[0] === 4) return HAND_TYPES[1] // 四条
  if (counts[0] === 3 && counts[1] === 2) return HAND_TYPES[2] // 葫芦
  if (isFlush) return HAND_TYPES[3] // 同花
  if (isStraight) return HAND_TYPES[4] // 顺子
  if (counts[0] === 3) return HAND_TYPES[5] // 三条
  if (counts[0] === 2 && counts[1] === 2) return HAND_TYPES[6] // 两对
  if (counts[0] === 2) return HAND_TYPES[7] // 对子
  return HAND_TYPES[8] // 高牌
}

// 顺子检测（含 A-2-3-4-5 和 10-J-Q-K-A）
function checkStraight(ranks) {
  const rankOrder = { 'A': 14, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 }
  const vals = ranks.map(r => rankOrder[r]).sort((a, b) => a - b)
  // 普通顺子
  const isNormalStraight = vals[4] - vals[0] === 4 && new Set(vals).size === 5
  // A-2-3-4-5（低顺）
  const isLowAce = vals[4] === 14 && vals[0] === 2 && vals[1] === 3 && vals[2] === 4 && vals[3] === 5
  return isNormalStraight || isLowAce
}

// 计算基础分（不含 Joker）：chips = 牌型基础筹码 + 所有出牌点数之和
export function calcBaseScore(cards) {
  const hand = identifyHand(cards)
  if (!hand) return { hand: null, chips: 0, mult: 0 }
  const cardChips = cards.reduce((sum, c) => sum + cardValue(c.rank), 0)
  const chips = hand.chips + cardChips
  return { hand, chips, mult: hand.mult }
}

// 应用 Joker 效果，返回最终 { chips, mult }
export function applyJokers(cards, baseChips, baseMult, jokers) {
  let chips = baseChips
  let mult = baseMult
  const triggered = []

  for (const joker of jokers) {
    const before = { chips, mult }
    const result = joker.effect({ cards, chips, mult })
    chips = result.chips
    mult = result.mult
    // 记录是否触发
    if (chips !== before.chips || mult !== before.mult) {
      triggered.push({ joker, deltaChips: chips - before.chips, deltaMult: mult / (before.mult || 1), newMult: mult, newChips: chips })
    } else {
      triggered.push(null)
    }
  }
  return { chips, mult, triggered }
}

// 枚举所有 k 张子集（用于 AI）
export function combinations(arr, k) {
  const result = []
  function helper(start, current) {
    if (current.length === k) { result.push([...current]); return }
    for (let i = start; i < arr.length; i++) {
      current.push(arr[i])
      helper(i + 1, current)
      current.pop()
    }
  }
  helper(0, [])
  return result
}
