#!/usr/bin/env node
/**
 * HeartFlow 短期记忆提升系统
 * 基于 OpenClaw Short-term Promotion API
 * 
 * 功能:
 * - 读取短期记忆条目
 * - 排名提升候选
 * - 应用到长期记忆 (MEMORY.md)
 * - 记录提升信号
 */

const fs = require('fs').promises;
const path = require('path');

const WORK_DIR = process.env.HEARTFLOW_WORK_DIR || '/Users/apple/mark-heartflow-claw';
const MEMORY_DIR = path.join(WORK_DIR, 'memory');
const MEMORY_FILE = path.join(WORK_DIR, 'MEMORY.md');
const LOG_FILE = path.join(WORK_DIR, 'logs', 'promotion.log');

// ========== 配置 ==========
const CONFIG = {
  lookbackDays: 2,           // 回顾天数
  limit: 50,                 // 处理限制
  promotionThreshold: 0.7,   // 提升阈值
  decayFactor: 0.9,          // 时间衰减因子
  frequencyWeight: 0.4,      // 频率权重
  recencyWeight: 0.3,        // 新近度权重
  relevanceWeight: 0.3       // 相关性权重
};

// ========== 日志工具 ==========
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    success: '✅'
  }[level] || 'ℹ️';
  
  const line = `[${timestamp}] ${prefix} ${message}`;
  console.log(line);
  
  fs.appendFile(LOG_FILE, line + '\n').catch(() => {});
}

// ========== 日期工具 ==========
function formatMemoryDay(epochMs) {
  const date = new Date(epochMs);
  return date.toISOString().split('T')[0];
}

function getRecentDays(days) {
  const result = [];
  const now = Date.now();
  for (let i = 0; i < days; i++) {
    result.push(formatMemoryDay(now - i * 24 * 60 * 60 * 1000));
  }
  return result;
}

// ========== 读取短期记忆 ==========
class ShortTermPromotionManager {
  constructor(workspaceDir = WORK_DIR) {
    this.workspaceDir = workspaceDir;
    this.memoryDir = path.join(workspaceDir, 'memory');
  }
  
  /**
   * 读取短期记忆条目
   */
  async readRecallEntries(days = CONFIG.lookbackDays) {
    log(`读取最近 ${days} 天的记忆...`);
    
    const entries = [];
    const recentDays = getRecentDays(days);
    
    for (const day of recentDays) {
      const filePath = path.join(this.memoryDir, `${day}.md`);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const parsedEntries = this.parseDailyMemory(content, day);
        entries.push(...parsedEntries);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          log(`读取 ${day}.md 失败：${err.message}`, 'warn');
        }
      }
    }
    
    log(`找到 ${entries.length} 个短期记忆条目`, 'success');
    return entries;
  }
  
  /**
   * 解析每日记忆文件
   */
  parseDailyMemory(content, date) {
    const entries = [];
    const lines = content.split('\n');
    
    let currentSection = '';
    let currentEntry = null;
    
    for (const line of lines) {
      // 检测章节标题
      if (line.startsWith('## ')) {
        currentSection = line.replace('## ', '').trim();
      }
      
      // 检测列表项 (短期记忆条目)
      if (line.startsWith('- [') || line.startsWith('- ')) {
        const entryText = line.replace(/^- \[[ x]\] /, '').replace(/^- /, '').trim();
        
        if (entryText && !entryText.startsWith('<!--')) {
          entries.push({
            id: `${date}-${entries.length}`,
            date,
            section: currentSection,
            text: entryText,
            timestamp: new Date(date).getTime(),
            frequency: 1,
            recallCount: 1
          });
        }
      }
    }
    
    return entries;
  }
  
  /**
   * 排名提升候选
   */
  async rankCandidates(entries) {
    log(`排名 ${entries.length} 个候选...`);
    
    // 1. 聚合相似条目
    const aggregated = this.aggregateSimilarEntries(entries);
    
    // 2. 计算每个条目的得分
    const scored = aggregated.map(entry => ({
      ...entry,
      score: this.calculatePromotionScore(entry)
    }));
    
    // 3. 排序
    scored.sort((a, b) => b.score - a.score);
    
    // 4. 过滤达到阈值的
    const qualified = scored.filter(e => e.score >= CONFIG.promotionThreshold);
    
    log(`找到 ${qualified.length} 个符合提升条件的候选`, 'success');
    return qualified.slice(0, CONFIG.limit);
  }
  
  /**
   * 聚合相似条目
   */
  aggregateSimilarEntries(entries) {
    const map = new Map();
    
    for (const entry of entries) {
      // 简化文本作为 key
      const key = entry.text.toLowerCase().substring(0, 50);
      
      if (map.has(key)) {
        const existing = map.get(key);
        existing.frequency += 1;
        existing.recallCount += 1;
      } else {
        map.set(key, { ...entry });
      }
    }
    
    return Array.from(map.values());
  }
  
  /**
   * 计算提升得分
   */
  calculatePromotionScore(entry) {
    const now = Date.now();
    const age = now - entry.timestamp;
    const ageInDays = age / (24 * 60 * 60 * 1000);
    
    // 频率得分
    const frequencyScore = Math.min(entry.frequency / 5, 1);
    
    // 新近度得分 (时间衰减)
    const recencyScore = Math.pow(CONFIG.decayFactor, ageInDays);
    
    // 相关性得分 (基于召回次数)
    const relevanceScore = Math.min(entry.recallCount / 3, 1);
    
    // 加权总分
    const totalScore = 
      CONFIG.frequencyWeight * frequencyScore +
      CONFIG.recencyWeight * recencyScore +
      CONFIG.relevanceWeight * relevanceScore;
    
    return totalScore;
  }
  
  /**
   * 应用提升到长期记忆
   */
  async applyPromotions(candidates) {
    log(`应用 ${candidates.length} 个提升到长期记忆...`);
    
    // 读取或创建 MEMORY.md
    let memoryContent = '';
    try {
      memoryContent = await fs.readFile(MEMORY_FILE, 'utf-8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        memoryContent = `# MEMORY.md - 长期记忆\n\n_此文件存储重要的长期记忆、决策和上下文。_\n\n`;
      }
    }
    
    // 找到或创建"短期提升"部分
    const sectionMarker = '## 短期记忆提升';
    let updatedContent = memoryContent;
    
    if (!updatedContent.includes(sectionMarker)) {
      // 添加新章节
      updatedContent += `\n${sectionMarker}\n\n`;
    }
    
    // 添加提升的条目
    const timestamp = new Date().toISOString();
    const additions = candidates.map(c => 
      `- [${c.text}] (得分：${c.score.toFixed(3)}, 频率：${c.frequency}, 日期：${c.date})`
    ).join('\n');
    
    // 插入到章节后面
    const sectionIndex = updatedContent.indexOf(sectionMarker);
    if (sectionIndex !== -1) {
      const insertPos = updatedContent.indexOf('\n', sectionIndex + sectionMarker.length) + 1;
      updatedContent = 
        updatedContent.substring(0, insertPos) +
        `\n_提升时间：${timestamp}_\n\n${additions}\n` +
        updatedContent.substring(insertPos);
    }
    
    // 写入文件
    await fs.writeFile(MEMORY_FILE, updatedContent, 'utf-8');
    log(`已更新 MEMORY.md`, 'success');
    
    return { updated: true, count: candidates.length };
  }
  
  /**
   * 记录做梦阶段信号
   */
  async recordDreamingPhaseSignals(phase, result) {
    const signalFile = path.join(this.memoryDir, 'dreaming', 'signals.json');
    
    let signals = [];
    try {
      const content = await fs.readFile(signalFile, 'utf-8');
      signals = JSON.parse(content);
    } catch (err) {
      // 文件不存在，创建新数组
    }
    
    signals.push({
      timestamp: new Date().toISOString(),
      phase,
      ...result
    });
    
    // 保留最近 100 条信号
    signals = signals.slice(-100);
    
    await fs.mkdir(path.dirname(signalFile), { recursive: true });
    await fs.writeFile(signalFile, JSON.stringify(signals, null, 2), 'utf-8');
    
    log(`已记录 ${phase} 阶段信号`, 'success');
  }
}

// ========== 主执行函数 ==========
async function runPromotion() {
  log('\n' + '='.repeat(50), 'info');
  log('🧠 HeartFlow 短期记忆提升系统', 'info');
  log('='.repeat(50) + '\n', 'info');
  
  try {
    const manager = new ShortTermPromotionManager();
    
    // 1. 读取短期记忆
    const entries = await manager.readRecallEntries(CONFIG.lookbackDays);
    
    if (entries.length === 0) {
      log('没有短期记忆条目可提升', 'warn');
      return { success: true, promoted: 0 };
    }
    
    // 2. 排名候选
    const candidates = await manager.rankCandidates(entries);
    
    if (candidates.length === 0) {
      log('没有符合提升阈值的候选', 'warn');
      return { success: true, promoted: 0 };
    }
    
    // 3. 应用提升
    const result = await manager.applyPromotions(candidates);
    
    // 4. 记录信号
    await manager.recordDreamingPhaseSignals('promotion', result);
    
    log('\n✅ 短期记忆提升完成', 'success');
    log(`  提升数量：${result.count}`, 'info');
    
    return { success: true, promoted: result.count };
    
  } catch (error) {
    log(`❌ 提升失败：${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// ========== CLI 入口 ==========
async function main() {
  const result = await runPromotion();
  process.exit(result.success ? 0 : 1);
}

// 导出模块
module.exports = {
  ShortTermPromotionManager,
  runPromotion,
  CONFIG
};

// 运行 CLI
if (require.main === module) {
  main();
}
