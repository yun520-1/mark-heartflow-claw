/**
 * HeartFlow 做梦系统配置
 * 基于 OpenClaw 原生做梦 API 集成
 */

module.exports = {
  // ========== 基础配置 ==========
  enabled: true,
  timezone: "Asia/Shanghai",
  verboseLogging: true,
  
  // ========== 存储配置 ==========
  storage: {
    mode: "both",  // inline | separate | both
    separateReports: true
  },
  
  // ========== 执行配置 ==========
  execution: {
    defaults: {
      speed: "balanced",      // fast | balanced | slow
      thinking: "medium",     // low | medium | high
      budget: "medium",       // cheap | medium | expensive
      maxOutputTokens: 2048,
      temperature: 0.7,
      timeoutMs: 120000
    }
  },
  
  // ========== 三阶段做梦配置 ==========
  phases: {
    /**
     * Light Sleep - 轻量记忆整理
     * 每 6 小时运行一次，整理短期记忆
     */
    light: {
      enabled: true,
      cron: "0 */6 * * *",
      lookbackDays: 2,
      limit: 100,
      dedupeSimilarity: 0.9,
      sources: ["daily", "sessions", "recall"],
      execution: {
        speed: "fast",
        thinking: "low",
        budget: "cheap"
      }
    },
    
    /**
     * Deep Sleep - 深度记忆整合
     * 每天凌晨 3 点运行，深度整合长期记忆
     */
    deep: {
      enabled: true,
      cron: "0 3 * * *",
      limit: 10,
      minScore: 0.8,
      minRecallCount: 3,
      minUniqueQueries: 3,
      recencyHalfLifeDays: 14,
      maxAgeDays: 30,
      sources: ["daily", "memory", "sessions", "logs", "recall"],
      execution: {
        speed: "balanced",
        thinking: "high",
        budget: "medium"
      },
      // 记忆恢复配置
      recovery: {
        enabled: true,
        triggerBelowHealth: 0.35,
        lookbackDays: 30,
        maxRecoveredCandidates: 20,
        minRecoveryConfidence: 0.9,
        autoWriteMinConfidence: 0.97
      }
    },
    
    /**
     * REM Sleep - 快速眼动模式发现
     * 每周日凌晨 5 点运行，发现深层模式
     */
    rem: {
      enabled: true,
      cron: "0 5 * * 0",
      lookbackDays: 7,
      limit: 10,
      minPatternStrength: 0.75,
      sources: ["memory", "daily", "deep"],
      execution: {
        speed: "slow",
        thinking: "high",
        budget: "expensive"
      }
    }
  },
  
  // ========== 真善美评估 ==========
  tgbEvaluation: {
    enabled: true,
    truthThreshold: 0.85,
    goodnessThreshold: 0.85,
    beautyThreshold: 0.80
  },
  
  // ========== 六层哲学境界 ==========
  sixLevels: {
    enabled: true,
    levels: ["觉察", "自省", "无我", "彼岸", "般若", "圣人"]
  }
};
