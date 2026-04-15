#!/usr/bin/env python3
"""
HeartFlow 自动安装脚本
=======================
运行此脚本后，HeartFlow 将自动加载，无需每次手动配置。

用法:
    python3 install_heartflow.py
"""

import os
import sys
import json
from pathlib import Path

def get_hermes_config_path() -> Path:
    """获取 hermes config.yaml 路径"""
    hermes_home = os.environ.get("HERMES_HOME", str(Path.home() / ".hermes"))
    return Path(hermes_home) / "config.yaml"

def read_yaml_file(path: Path) -> str:
    """读取文件内容"""
    if not path.exists():
        return ""
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def write_yaml_file(path: Path, content: str):
    """写入文件内容"""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def parse_simple_yaml(content: str) -> dict:
    """极简 YAML 解析器 - 只处理我们需要的情况"""
    result = {}
    current_key = None
    current_list = None
    
    for line in content.split("\n"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        
        # 检测顶级 key: 
        if ":" in line and not line.strip().startswith("-"):
            key = line.split(":")[0].strip()
            value = line.split(":", 1)[1].strip()
            
            if value == "" or value.startswith("["):
                # 这是一个可能的对象或列表开始
                current_key = key
                if value.startswith("["):
                    # 这是一个空列表
                    result[key] = []
                else:
                    result[key] = {}
            else:
                result[key] = value
                current_key = None
        elif line.startswith("- "):
            # 列表项
            if current_key and isinstance(result.get(current_key), list):
                result[current_key].append(line[2:].strip())
    
    return result

def add_skill_external_dir(config_content: str, skill_path: str) -> str:
    """向 config.yaml 添加 skills.external_dirs"""
    lines = config_content.split("\n") if config_content else []
    
    # 查找 skills: 部分
    skills_idx = None
    for i, line in enumerate(lines):
        if line.strip().startswith("skills:"):
            skills_idx = i
            break
    
    # 查找 external_dirs: 在 skills: 之后
    if skills_idx is not None:
        for i in range(skills_idx, len(lines)):
            line = lines[i].strip()
            if line.startswith("external_dirs:"):
                # 找到 external_dirs，添加我们的路径
                # 找到下一个同级或更高级的 key
                for j in range(i + 1, len(lines)):
                    next_line = lines[j].strip()
                    if next_line and not next_line.startswith(" ") and not next_line.startswith("\t"):
                        # 插入到当前行之前
                        indent = "  "
                        lines.insert(j, f"{indent}- {skill_path}")
                        break
                else:
                    # 到达文件末尾
                    lines.append(f"  - {skill_path}")
                return "\n".join(lines)
    
    # 没有找到 skills: 部分，添加新的
    new_lines = []
    for line in lines:
        new_lines.append(line)
        if line.strip().startswith("memory:") or (line.strip().startswith("honcho:") and "memory:" not in "\n".join(new_lines)):
            new_lines.insert(-1, "skills:")
            new_lines.insert(-1, "  external_dirs:")
            new_lines.insert(-1, f"    - {skill_path}")
            break
    
    if not new_lines:
        new_lines = lines + ["", "skills:", "  external_dirs:", f"    - {skill_path}"]
    
    return "\n".join(new_lines)

def main():
    print("🎯 HeartFlow 自动安装")
    print("=" * 40)
    
    # 获取 hermes 配置路径
    config_path = get_hermes_config_path()
    print(f"\n📁 配置文件: {config_path}")
    
    # 检查是否已安装
    skill_path = str(Path.home() / ".hermes/skills/mark-heartflow")
    if not Path(skill_path).exists():
        print(f"\n❌ 错误: 未找到 HeartFlow 技能目录")
        print(f"   请先克隆 skill 到: {skill_path}")
        print(f"\n   命令:")
        print(f"   git clone https://github.com/yun520-1/mark-heartflow-skill.git ~/.hermes/skills/mark-heartflow")
        sys.exit(1)
    
    # 读取现有配置
    print("\n📖 读取现有配置...")
    existing_content = read_yaml_file(config_path)
    
    # 检查是否已配置
    if "mark-heartflow" in existing_content and "external_dirs" in existing_content:
        print("✅ HeartFlow 已经配置过了!")
        print("   无需重复安装。")
        print("\n🚀 启动命令:")
        print("   hermes gateway run")
        return
    
    # 添加配置
    print("\n⚙️  添加 HeartFlow 到配置...")
    new_content = add_skill_external_dir(existing_content, skill_path)
    
    # 写入配置
    print(f"📝 写入配置...")
    write_yaml_file(config_path, new_content)
    
    print("\n" + "=" * 40)
    print("✅ 安装完成!")
    print("\n🚀 启动 HeartFlow:")
    print("   hermes gateway run")
    print("\n💡 每次启动 hermes，HeartFlow 都会自动加载。")
    print("\n📖 如需手动加载，可使用:")
    print("   skill_view(name=\"mark-heartflow\")")

if __name__ == "__main__":
    main()