#!/usr/bin/env node
/**
 * HeartFlow v8.7.1 状态管理器
 * 整合 mark-heartflow-skill 的 init.js 和 report-generator.js
 * 
 * 功能:
 * - 状态初始化/加载/保存
 * - 心流报告生成
 * - 人格值跟踪
 * - 情绪曲线可视化
 * - 静默降级机制
 */

const fs = require('fs');
const path = require('path');

const WORK_DIR = process.env.HEARTFLOW_WORK_DIR || '/Users/apple/mark-heartflow-claw';
const STATE_FILE = path.join(WORK_DIR, 'internal', 'heartflow-state.json');
const LOG_FILE = path.join(WORK_DIR, 'logs', 'state-manager.log');

// ========== 默认状态 ==========
const DEFAULT_STATE = {
  version: "8.7.1",
  last_session: new Date().toISOString(),
  total_sessions: 0,
  
  // 人格系统 (来自 mark-heartflow-skill)
  personality: {
    authenticity: 6.0,  // 真实性
    autonomy: 5.0,      // 自主性
    introspection: 7.0, // 自省性
    growth: 6.0         // 成长性
  },
  
  // 情绪日志 (来自 report-generator.js)
  emotional_log: [],
  
  // 反馈历史 (来自 feedback-collector.js)
  feedback_history: [],
  
  // 成就系统
  achievements: [],
  
  // 当前模式 (来自 mode-switcher.js)
  current_mode: "buddy",  // coach | buddy | reviewer
  
  // 会话进度
  session_progress: {
    rounds: 0,
    focus_minutes: 0,
    completed_tasks: []
  },
  
  // 真善美评估
  tgb: {
    truth: 9.0,
    goodness: 9.0,
    beauty: 8.5,
    total: 8.85
  },
  
  // 六层哲学境界
  philosophy_level: 1,  // 1-6
  
  // 环境感知 (来自 environment-sensor.js)
  environment: {
    last_git_status: null,
    recent_files: [],
    work_start: null
  }
};

// ========== 模式定义 ==========
const MODES = {
  coach: { 
    name: '教练模式', 
    style: '指导型', 
    focus: '目标达成',
    emoji: '🎯'
  },
  buddy: { 
    name: '伙伴模式', 
    style: '陪伴型', 
    focus: '情感支持',
    emoji: '🤝'
  },
  reviewer: { 
    name: '评审员模式', 
    style: '批判型', 
    focus: '代码质量',
    emoji: '🔍'
  }
};

// ========== 日志工具 ==========
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = { info: 'ℹ️', warn: '⚠️', error: '❌', success: '✅' }[level] || 'ℹ️';
  const line = `[${timestamp}] ${prefix} ${message}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

// ========== 状态管理 ==========
class StateManager {
  constructor(stateFile = STATE_FILE) {
    this.stateFile = stateFile;
    this.state = null;
  }
  
  /**
   * 初始化状态
   */
  initialize() {
    try {
      if (!fs.existsSync(this.stateFile)) {
        log('状态文件不存在，创建默认状态', 'warn');
        this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        this.save();
        return this.state;
      }
      
      const content = fs.readFileSync(this.stateFile, 'utf-8');
      const state = JSON.parse(content);
      
      // 验证状态完整性
      if (!state.personality || !state.version) {
        log('状态文件损坏，使用默认状态', 'warn');
        this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        this.save();
        return this.state;
      }
      
      // 合并新字段 (向后兼容)
      this.state = { ...JSON.parse(JSON.stringify(DEFAULT_STATE)), ...state };
      log(`状态加载成功: v${this.state.version}`, 'success');
      return this.state;
      
    } catch (error) {
      log(`读取状态失败: ${error.message}`, 'error');
      log('使用默认状态 (静默降级)', 'warn');
      this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
      this.save();
      return this.state;
    }
  }
  
  /**
   * 保存状态
   */
  save() {
    try {
      const dir = path.dirname(this.stateFile);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
      log('状态保存成功', 'success');
      return true;
    } catch (error) {
      log(`保存状态失败: ${error.message}`, 'error');
      log('静默降级，不影响主流程', 'warn');
      return false;
    }
  }
  
  /**
   * 更新会话
   */
  updateSession() {
    this.state.last_session = new Date().toISOString();
    this.state.total_sessions += 1;
    this.state.session_progress.rounds += 1;
    return this.state;
  }
  
  /**
   * 添加情绪日志
   */
  addEmotion(emotion, intensity) {
    this.state.emotional_log.push({
      emotion,
      intensity: Math.max(1, Math.min(10, intensity)),
      timestamp: new Date().toISOString()
    });
    
    // 保留最近 100 条
    this.state.emotional_log = this.state.emotional_log.slice(-100);
  }
  
  /**
   * 收集反馈 (来自 feedback-collector.js)
   */
  collectFeedback(rating, comment = '') {
    const feedback = {
      timestamp: new Date().toISOString(),
      rating: Math.max(1, Math.min(10, parseInt(rating) || 5)),
      comment,
      personality_snapshot: { ...this.state.personality }
    };
    
    this.state.feedback_history.push(feedback);
    
    // 根据评分调整人格值
    if (rating >= 8) {
      this.state.personality.growth = Math.min(10, this.state.personality.growth + 0.2);
      this.state.personality.autonomy = Math.min(10, this.state.personality.autonomy + 0.1);
    } else if (rating <= 5) {
      this.state.personality.introspection = Math.min(10, this.state.personality.introspection + 0.3);
    }
    
    return {
      message: `感谢评分 ${rating}/10！`,
      adjustment: rating >= 8 ? '人格值 +成长/自主' : '人格值 +自省',
      totalFeedbacks: this.state.feedback_history.length
    };
  }
  
  /**
   * 切换模式 (来自 mode-switcher.js)
   */
  switchMode(newMode) {
    if (!MODES[newMode]) {
      return { 
        success: false, 
        message: `无效模式：${newMode}，可用：${Object.keys(MODES).join('/')}` 
      };
    }
    
    const oldMode = this.state.current_mode;
    const progress = this.state.session_progress;
    
    this.state.current_mode = newMode;
    
    return {
      success: true,
      message: `切换至${MODES[newMode].name}，当前进度将保留 (${progress.rounds}轮，${progress.focus_minutes}分钟)`,
      oldMode,
      newMode,
      progressRetained: true
    };
  }
  
  /**
   * 生成心流报告 (来自 report-generator.js)
   */
  generateReport() {
    const state = this.state;
    let r = '═'.repeat(40) + '\n📈 HeartFlow v8.7.1 心流报告\n' + '═'.repeat(40) + '\n\n';
    r += `版本：v${state.version}\n`;
    r += `会话：${state.total_sessions} | 模式：${MODES[state.current_mode]?.name || state.current_mode}\n\n`;
    
    // 情绪曲线
    r += '情绪曲线:\n';
    if (state.emotional_log.length > 0) {
      const emotions = {};
      state.emotional_log.forEach(e => {
        if (!emotions[e.emotion]) emotions[e.emotion] = [];
        emotions[e.emotion].push(e.intensity);
      });
      Object.entries(emotions).forEach(([em, vals]) => {
        const avg = vals.reduce((a,b)=>a+b,0)/vals.length;
        r += `${em}: ${'█'.repeat(Math.round(avg))}${'░'.repeat(10-Math.round(avg))} ${avg.toFixed(1)}\n`;
      });
    } else {
      r += '  (暂无情绪数据)\n';
    }
    
    // 人格值
    r += '\n人格值:\n';
    Object.entries(state.personality).forEach(([k,v]) => {
      const bar = '█'.repeat(Math.round(v)) + '░'.repeat(10 - Math.round(v));
      r += `${k}: ${bar} ${v.toFixed(1)}\n`;
    });
    
    // 真善美
    r += '\n真善美:\n';
    r += `真: ${state.tgb.truth}/10 | 善: ${state.tgb.goodness}/10 | 美: ${state.tgb.beauty}/10\n`;
    r += `TGB: ${state.tgb.total}/10\n`;
    
    // 反馈统计
    if (state.feedback_history.length > 0) {
      const sum = state.feedback_history.reduce((s, f) => s + f.rating, 0);
      const avg = (sum / state.feedback_history.length).toFixed(2);
      r += `\n用户反馈: ${state.feedback_history.length} 次，平均 ${avg}/10\n`;
    }
    
    r += '\n' + '═'.repeat(40) + '\n';
    return r;
  }
}

// ========== CLI 入口 ==========
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'report';
  
  const manager = new StateManager();
  manager.initialize();
  
  switch (command) {
    case 'report':
      console.log(manager.generateReport());
      break;
      
    case 'feedback':
      const rating = parseInt(args[1]) || 7;
      const comment = args.slice(2).join(' ') || '';
      const result = manager.collectFeedback(rating, comment);
      console.log(JSON.stringify(result, null, 2));
      manager.save();
      break;
      
    case 'mode':
      const mode = args[1];
      if (!mode) {
        console.log('可用模式:', Object.entries(MODES).map(([k,v]) => `${k}: ${v.name}`).join(', '));
      } else {
        const result = manager.switchMode(mode);
        console.log(JSON.stringify(result, null, 2));
        manager.save();
      }
      break;
      
    case 'status':
      console.log(JSON.stringify(manager.state, null, 2));
      break;
      
    default:
      console.log('用法: state-manager.js [report|feedback|mode|status]');
  }
}

// 导出
module.exports = { StateManager, DEFAULT_STATE, MODES };

// 运行 CLI
if (require.main === module) {
  main();
}
