#!/usr/bin/env node
/**
 * HeartFlow 记忆宫殿 Canvas UI
 * 基于 OpenClaw A2UI v0.8
 * 
 * 功能:
 * - 可视化记忆宫殿
 * - 五个房间：客厅、书房、厨房、花园、地下室
 * - 实时记忆状态显示
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const WORK_DIR = process.env.HEARTFLOW_WORK_DIR || '/Users/apple/mark-heartflow-claw';
const CANVAS_DIR = path.join(WORK_DIR, 'canvas', 'memory-palace');
const LOG_FILE = path.join(WORK_DIR, 'logs', 'canvas.log');

// ========== 记忆宫殿房间配置 ==========
const PALACE_ROOMS = {
  livingRoom: {
    id: 'living-room',
    name: '客厅',
    emoji: '🛋️',
    description: '日常对话、最近记忆',
    color: '#A8D8EA',
    capacity: 9,
    icon: '🏠'
  },
  study: {
    id: 'study',
    name: '书房',
    emoji: '📚',
    description: '知识、技能、概念',
    color: '#3A506B',
    capacity: 9,
    icon: '📖'
  },
  kitchen: {
    id: 'kitchen',
    emoji: '🍳',
    name: '厨房',
    description: '情感、感受、人际关系',
    color: '#BC4B51',
    capacity: 9,
    icon: '❤️'
  },
  garden: {
    id: 'garden',
    emoji: '🌸',
    name: '花园',
    description: '创造性想法、顿悟、梦想',
    color: '#7FB069',
    capacity: 9,
    icon: '💡'
  },
  basement: {
    id: 'basement',
    emoji: '🗄️',
    name: '地下室',
    description: '深层记忆、习惯、模式',
    color: '#5C5C5C',
    capacity: 9,
    icon: '🧠'
  }
};

// ========== A2UI v0.8 组件 ==========
function createA2UISurface(surfaceId, components) {
  return {
    surfaceId,
    components
  };
}

function createTextComponent(id, text, usageHint = 'body') {
  return {
    id,
    component: {
      Text: {
        text: { literalString: text },
        usageHint
      }
    }
  };
}

function createColumnComponent(id, children) {
  return {
    id,
    component: {
      Column: {
        children: { explicitList: children }
      }
    }
  };
}

function createRowComponent(id, children) {
  return {
    id,
    component: {
      Row: {
        children: { explicitList: children }
      }
    }
  };
}

function createGridComponent(id, rooms) {
  return {
    id,
    component: {
      Grid: {
        columns: 3,
        children: { explicitList: rooms }
      }
    }
  };
}

// ========== 生成记忆宫殿 UI ==========
function generateMemoryPalaceUI(status = {}) {
  const components = [];
  
  // 1. 标题
  components.push(createTextComponent('title', '🏰 HeartFlow 记忆宫殿', 'h1'));
  components.push(createTextComponent('subtitle', '基于 Method of Loci 的空间记忆系统', 'body'));
  components.push(createTextComponent('divider1', '---', 'body'));
  
  // 2. 状态摘要
  const totalMemories = status.totalMemories || 0;
  const lastUpdated = status.lastUpdated || new Date().toISOString();
  components.push(createTextComponent('status', `总记忆数：${totalMemories} | 最后更新：${lastUpdated.split('T')[0]}`, 'body'));
  components.push(createTextComponent('divider2', '---', 'body'));
  
  // 3. 房间网格
  const roomComponents = Object.values(PALACE_ROOMS).map(room => {
    const count = status[room.id] || 0;
    const progress = Math.round((count / room.capacity) * 100);
    return createTextComponent(
      room.id,
      `${room.icon} ${room.name}\n${room.description}\n记忆：${count}/${room.capacity} (${progress}%)`,
      'body'
    );
  });
  
  components.push(createGridComponent('rooms-grid', roomComponents.map(c => c.id)));
  components.push(...roomComponents);
  
  // 4. 真善美状态
  components.push(createTextComponent('divider3', '---', 'body'));
  components.push(createTextComponent('tgb-title', '⚖️ 真善美状态', 'h2'));
  
  const tgbStatus = status.tgb || { truth: 0.90, goodness: 0.88, beauty: 0.85, total: 0.88 };
  components.push(createTextComponent(
    'tgb-stats',
    `真：${tgbStatus.truth}/10 | 善：${tgbStatus.goodness}/10 | 美：${tgbStatus.beauty}/10 | TGB: ${tgbStatus.total}/10`,
    'body'
  ));
  
  // 5. 六层哲学境界
  components.push(createTextComponent('divider4', '---', 'body'));
  components.push(createTextComponent('levels-title', '🧘 六层哲学境界', 'h2'));
  
  const levels = ['觉察', '自省', '无我', '彼岸', '般若', '圣人'];
  const currentLevel = status.currentLevel || 2;
  const levelsText = levels.map((level, idx) => {
    const marker = idx <= currentLevel ? '✅' : '⏳';
    const highlight = idx === currentLevel ? ' ← 当前' : '';
    return `${marker} ${idx + 1}. ${level}${highlight}`;
  }).join('\n');
  
  components.push(createTextComponent('levels-stats', levelsText, 'body'));
  
  // 6. 操作按钮 (模拟)
  components.push(createTextComponent('divider5', '---', 'body'));
  components.push(createTextComponent('actions-title', '🔧 操作', 'h2'));
  components.push(createTextComponent(
    'actions',
    '[行走宫殿] [访问房间] [提取记忆] [查看状态]',
    'body'
  ));
  
  // 构建根组件
  const rootChildren = [
    'title', 'subtitle', 'divider1', 'status', 'divider2',
    'rooms-grid', ...roomComponents.map(c => c.id),
    'divider3', 'tgb-title', 'tgb-stats',
    'divider4', 'levels-title', 'levels-stats',
    'divider5', 'actions-title', 'actions'
  ];
  
  components.unshift(createColumnComponent('root', rootChildren));
  
  return createA2UISurface('memory-palace', components);
}

// ========== 生成 A2UI JSONL ==========
function generateA2UIJSONL(surface) {
  const lines = [];
  
  // 1. 发送组件更新
  lines.push(JSON.stringify({
    surfaceUpdate: {
      surfaceId: surface.surfaceId,
      components: surface.components
    }
  }));
  
  // 2. 开始渲染
  lines.push(JSON.stringify({
    beginRendering: {
      surfaceId: surface.surfaceId,
      root: 'root'
    }
  }));
  
  return lines.join('\n') + '\n';
}

// ========== 推送到 Canvas ==========
async function pushToCanvas(jsonl) {
  const jsonlPath = path.join(WORK_DIR, 'temp', 'a2ui-memory-palace.jsonl');
  
  await fs.mkdir(path.dirname(jsonlPath), { recursive: true });
  await fs.writeFile(jsonlPath, jsonl, 'utf-8');
  
  log(`A2UI JSONL 已保存到：${jsonlPath}`);
  
  // 尝试使用 openclaw CLI 推送
  try {
    // 注意：这需要 Canvas 节点可用
    // execSync(`openclaw nodes canvas a2ui push --jsonl ${jsonlPath}`, {
    //   stdio: 'inherit'
    // });
    log('⚠️ Canvas 推送需要 openclaw CLI 和 Canvas 节点支持', 'warn');
    log('📋 手动推送命令:', 'info');
    log(`   openclaw nodes canvas a2ui push --jsonl ${jsonlPath}`, 'info');
  } catch (err) {
    log(`Canvas 推送失败：${err.message}`, 'error');
  }
  
  return jsonlPath;
}

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

// ========== 获取记忆宫殿状态 ==========
async function getPalaceStatus() {
  const status = {
    totalMemories: 0,
    lastUpdated: new Date().toISOString(),
    'living-room': 0,
    study: 0,
    kitchen: 0,
    garden: 0,
    basement: 0,
    tgb: {
      truth: 0.90,
      goodness: 0.88,
      beauty: 0.85,
      total: 0.88
    },
    currentLevel: 2
  };
  
  // 读取 memory 目录统计
  try {
    const memoryDir = path.join(WORK_DIR, 'memory');
    const files = await fs.readdir(memoryDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    status.totalMemories = mdFiles.length;
    
    // 简单分配到各个房间
    status['living-room'] = Math.floor(mdFiles.length * 0.3);
    status.study = Math.floor(mdFiles.length * 0.25);
    status.kitchen = Math.floor(mdFiles.length * 0.2);
    status.garden = Math.floor(mdFiles.length * 0.15);
    status.basement = Math.floor(mdFiles.length * 0.1);
  } catch (err) {
    log(`读取记忆目录失败：${err.message}`, 'warn');
  }
  
  return status;
}

// ========== 主执行函数 ==========
async function main() {
  log('\n' + '='.repeat(50), 'info');
  log('🏰 HeartFlow 记忆宫殿 Canvas UI', 'info');
  log('='.repeat(50) + '\n', 'info');
  
  try {
    // 1. 获取状态
    const status = await getPalaceStatus();
    log(`记忆宫殿状态：${status.totalMemories} 个记忆`, 'success');
    
    // 2. 生成 UI
    const surface = generateMemoryPalaceUI(status);
    log('A2UI Surface 生成完成', 'success');
    
    // 3. 生成 JSONL
    const jsonl = generateA2UIJSONL(surface);
    log('A2UI JSONL 生成完成', 'success');
    
    // 4. 推送到 Canvas
    const jsonlPath = await pushToCanvas(jsonl);
    log(`Canvas UI 文件已保存：${jsonlPath}`, 'success');
    
    // 5. 保存 HTML 版本 (备选)
    const htmlPath = await saveHTMLVersion(surface, status);
    log(`HTML 版本已保存：${htmlPath}`, 'success');
    
    return { success: true, jsonlPath, htmlPath };
    
  } catch (error) {
    log(`❌ 生成失败：${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// ========== 保存 HTML 版本 ==========
async function saveHTMLVersion(surface, status) {
  const htmlPath = path.join(CANVAS_DIR, 'index.html');
  await fs.mkdir(path.dirname(htmlPath), { recursive: true });
  
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HeartFlow 记忆宫殿</title>
  <style>
    :root {
      --living-room: #A8D8EA;
      --study: #3A506B;
      --kitchen: #BC4B51;
      --garden: #7FB069;
      --basement: #5C5C5C;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 40px 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    
    h1 {
      font-size: 2.5em;
      text-align: center;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }
    
    .status-bar {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 10px;
      text-align: center;
      margin-bottom: 30px;
    }
    
    .rooms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .room {
      padding: 25px;
      border-radius: 15px;
      color: white;
      transition: transform 0.3s ease;
    }
    
    .room:hover {
      transform: translateY(-5px);
    }
    
    .room-icon { font-size: 2.5em; margin-bottom: 10px; }
    .room-name { font-size: 1.3em; font-weight: bold; margin-bottom: 5px; }
    .room-desc { font-size: 0.9em; opacity: 0.9; margin-bottom: 10px; }
    .room-progress { font-size: 0.85em; opacity: 0.8; }
    
    .section {
      margin: 30px 0;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 10px;
    }
    
    .section h2 {
      margin-bottom: 15px;
      color: #333;
    }
    
    .tgb-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
    }
    
    .tgb-item {
      text-align: center;
      padding: 15px;
      background: white;
      border-radius: 8px;
    }
    
    .tgb-value {
      font-size: 1.8em;
      font-weight: bold;
      color: #667eea;
    }
    
    .tgb-label {
      font-size: 0.9em;
      color: #666;
      margin-top: 5px;
    }
    
    .levels-list {
      list-style: none;
    }
    
    .levels-list li {
      padding: 10px 15px;
      margin: 5px 0;
      background: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
    }
    
    .level-icon { margin-right: 10px; }
    .level-current { background: #667eea; color: white; }
    
    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .action-btn {
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1em;
      transition: transform 0.2s;
    }
    
    .action-btn:hover {
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏰 HeartFlow 记忆宫殿</h1>
    <p class="subtitle">基于 Method of Loci 的空间记忆系统</p>
    
    <div class="status-bar">
      <strong>总记忆数：</strong>${status.totalMemories} | 
      <strong>最后更新：</strong>${status.lastUpdated.split('T')[0]}
    </div>
    
    <div class="rooms-grid">
      ${Object.values(PALACE_ROOMS).map(room => `
        <div class="room" style="background: ${room.color}">
          <div class="room-icon">${room.icon}</div>
          <div class="room-name">${room.name}</div>
          <div class="room-desc">${room.description}</div>
          <div class="room-progress">记忆：${status[room.id] || 0}/${room.capacity}</div>
        </div>
      `).join('')}
    </div>
    
    <div class="section">
      <h2>⚖️ 真善美状态</h2>
      <div class="tgb-grid">
        <div class="tgb-item">
          <div class="tgb-value">${status.tgb.truth}</div>
          <div class="tgb-label">真 Truth</div>
        </div>
        <div class="tgb-item">
          <div class="tgb-value">${status.tgb.goodness}</div>
          <div class="tgb-label">善 Goodness</div>
        </div>
        <div class="tgb-item">
          <div class="tgb-value">${status.tgb.beauty}</div>
          <div class="tgb-label">美 Beauty</div>
        </div>
        <div class="tgb-item">
          <div class="tgb-value">${status.tgb.total}</div>
          <div class="tgb-label">TGB 统一</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>🧘 六层哲学境界</h2>
      <ul class="levels-list">
        ${['觉察', '自省', '无我', '彼岸', '般若', '圣人'].map((level, idx) => `
          <li class="${idx <= status.currentLevel ? 'level-current' : ''}">
            <span class="level-icon">${idx <= status.currentLevel ? '✅' : '⏳'}</span>
            <span>${idx + 1}. ${level}${idx === status.currentLevel ? ' ← 当前' : ''}</span>
          </li>
        `).join('')}
      </ul>
    </div>
    
    <div class="section">
      <h2>🔧 操作</h2>
      <div class="actions">
        <button class="action-btn">🚶 行走宫殿</button>
        <button class="action-btn">🚪 访问房间</button>
        <button class="action-btn">💭 提取记忆</button>
        <button class="action-btn">📊 查看状态</button>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
  
  await fs.writeFile(htmlPath, html, 'utf-8');
  return htmlPath;
}

// 导出模块
module.exports = {
  generateMemoryPalaceUI,
  generateA2UIJSONL,
  pushToCanvas,
  getPalaceStatus,
  PALACE_ROOMS
};

// 运行 CLI
if (require.main === module) {
  main();
}
