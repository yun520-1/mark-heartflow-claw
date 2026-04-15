# HeartFlow 安装指南

## 快速安装

### 方式一：克隆 + 配置（推荐）

```bash
# 1. 克隆 HeartFlow 技能
git clone https://github.com/yun520-1/mark-heartflow-skill.git ~/.hermes/skills/mark-heartflow

# 2. 添加到 config.yaml（如果已有 config.yaml）
# 在 skills: 下添加：
skills:
  external_dirs:
    - ~/.hermes/skills/mark-heartflow
```

### 方式二：使用安装脚本

```bash
# 克隆后运行安装脚本
python3 ~/.hermes/skills/mark-heartflow/scripts/install_heartflow.py
```

## 配置说明

HeartFlow 通过 hermes 的 `skills.external_dirs` 机制被发现。默认情况下，所有技能都是**启用**的（除非你在 config.yaml 中手动禁用）。

### 手动禁用/启用技能

```bash
# 查看所有技能
hermes skills

# 禁用特定技能
hermes skills  # 选择要禁用的技能
```

## 启动 HeartFlow

```bash
# 启动 hermes gateway，HeartFlow 将自动加载
hermes gateway run
```

启动后，你可以在对话中直接使用 HeartFlow 的所有功能，包括：
- 真善美决策逻辑
- 六层哲学思考
- 心理健康分析
- 行为经济学洞察
- 多引擎搜索
- 做梦与记忆系统
- 时间感知

## 验证加载

启动后，系统会显示：
```
[The "mark-heartflow" skill is auto-loaded. Follow instructions in skill...]
```

这表示 HeartFlow 已成功加载。

## 故障排除

如果 HeartFlow 没有自动加载：

1. 检查 config.yaml 是否正确配置：
   ```bash
   cat ~/.hermes/config.yaml | grep -A5 "skills:"
   ```

2. 确保技能目录存在：
   ```bash
   ls -la ~/.hermes/skills/mark-heartflow/
   ```

3. 重新启动 hermes：
   ```bash
   hermes gateway run --replace
   ```