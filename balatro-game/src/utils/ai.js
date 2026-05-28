/**
 * ai.js · 本地启发式 AI 出牌枚举
 * 枚举 C(n,1..5) 所有组合，取得分最高的一组
 */
import { identifyHand, cardValue, combinations } from './poker.js'

// 模拟一次出牌的最终得分（含 Joker）
function simulateScore(cards, jokers) {
  const hand = identifyHand(cards)
  if (!hand) return 0
  const cardChips = cards.reduce((sum, c) => sum + cardValue(c.rank), 0)
  let chips = hand.chips + cardChips
  let mult = hand.mult

  for (const joker of jokers) {
    const result = joker.effect({ cards, chips, mult })
    chips = result.chips
    mult = result.mult
  }
  return chips * mult
}

// 找出当前手牌中得分最高的出牌组合
export function findBestPlay(handCards, jokers) {
  if (handCards.length === 0) return []
  // 手牌 ≤5 张直接全打
  if (handCards.length <= 5) return handCards

  let bestCards = []
  let bestScore = -1

  for (let k = 5; k >= 1; k--) {
    const combos = combinations(handCards, k)
    for (const combo of combos) {
      const score = simulateScore(combo, jokers)
      if (score > bestScore) {
        bestScore = score
        bestCards = combo
      }
    }
  }
  return bestCards
}

// 商店阶段：估算每张 Joker 的性价比（期望分/价格），返回最高性价比的 Joker id
export function suggestBestShopJoker(shopJokers, handCards, currentJokers) {
  if (shopJokers.length === 0) return null

  // 没有手牌时直接推荐价格最低那张（省钱优先）
  if (handCards.length === 0) {
    const cheapest = [...shopJokers].sort((a, b) => a.price - b.price)[0]
    return cheapest.id
  }

  let bestId = null
  let bestRatio = -1
  const sampleCards = handCards.slice(0, Math.min(5, handCards.length))

  // 计算没有新 Joker 时的基础分
  const baseHand = identifyHand(sampleCards)
  if (!baseHand) return shopJokers[0]?.id ?? null

  const baseCardChips = sampleCards.reduce((s, c) => s + cardValue(c.rank), 0)
  let baseChips = baseHand.chips + baseCardChips
  let baseMult  = baseHand.mult
  for (const j of currentJokers) {
    const r = j.effect({ cards: sampleCards, chips: baseChips, mult: baseMult })
    baseChips = r.chips
    baseMult  = r.mult
  }
  const scoreWithout = baseChips * baseMult

  for (const joker of shopJokers) {
    // 假设买了这张 Joker 后的分
    const mockJokers = [...currentJokers, joker]
    let simChips = baseHand.chips + baseCardChips
    let simMult  = baseHand.mult
    for (const j of mockJokers) {
      const r = j.effect({ cards: sampleCards, chips: simChips, mult: simMult })
      simChips = r.chips
      simMult  = r.mult
    }
    const scoreWithNew = simChips * simMult

    const gain = scoreWithNew - scoreWithout
    const ratio = joker.price > 0 ? gain / joker.price : 0

    if (ratio > bestRatio) {
      bestRatio = ratio
      bestId = joker.id
    }
  }
  return bestId
}
