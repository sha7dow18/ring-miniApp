#!/usr/bin/env bash
# 扫描 wxss 中的 token 残留。人工跑，不入 CI。
# 用法：bash scripts/check-tokens.sh

set -u
cd "$(dirname "$0")/.."

EXIT=0
ROOT="miniprogram"

echo "━━━ 1. 硬编码 hex 色值扫描 ━━━"
echo "(tokens.wxss 和数据可视化专色 #8a1d30 已豁免)"
# 数据可视化豁免：#8a1d30（血压图），#D6A15B/#A87635/#9A9A9A/#6B6B6B（订单状态 hero）
# FCE4D6/D6E4FC/E4FCD6/FFF4E0/F4E0E0/F1D9CD（状态 pill 变体）
HEXES=$(grep -rEn "#[0-9a-fA-F]{6}" "$ROOT" \
  --include='*.wxss' \
  --exclude-dir=styles \
  | grep -vE "#(8a1d30|D6A15B|A87635|9A9A9A|6B6B6B|FCE4D6|D6E4FC|E4FCD6|FFF4E0|F4E0E0|F1D9CD|8B3F32|FAF6F0)" \
  || true)

if [ -n "$HEXES" ]; then
  echo "$HEXES"
  echo ""
  echo "❌ 以上硬编码色值需替换为 var(--...) token"
  EXIT=1
else
  echo "✅ 无残留"
fi

echo ""
echo "━━━ 2. 页面级 linear-gradient 扫描 ━━━"
echo "(hero icon / 状态 hero / avatar / empty-logo 豁免)"
GRADS=$(grep -rEn "linear-gradient" "$ROOT" --include='*.wxss' \
  | grep -vE "(hero-icon|hero-pending|hero-canceled|\.hero\s*\{|\.ava\s*\{|empty-logo|weekly-bar|\.bar\s*\{|sport-main)" \
  || true)

# 进一步排除只在类名/选择器内的匹配
if [ -n "$GRADS" ]; then
  echo "$GRADS"
  echo ""
  echo "⚠️  以上 linear-gradient 需人工确认是否为豁免点缀"
  # 只警告不 fail — 豁免清单难自动化穷举
else
  echo "✅ 无疑似残留"
fi

echo ""
echo "━━━ 3. 3F6B5E 变体检查（应只出现在 tokens.wxss 里）━━━"
ALT=$(grep -rEn "(3F5E54|3f5e54|2f4a42|#3F6B5E|#3f6b5e)" "$ROOT" \
  --include='*.wxss' \
  --exclude-dir=styles \
  | grep -vE "豁免" || true)
if [ -n "$ALT" ]; then
  echo "$ALT"
  echo ""
  echo "❌ 以上绿色硬编码应改 var(--brand) 或 var(--brand-dark)"
  EXIT=1
else
  echo "✅ 无残留"
fi

echo ""
echo "━━━ 4. emoji 作 UI 图标扫描 ━━━"
echo "(页面 wxml / js 里硬编码 emoji 不允许。用户输入内容例外 — 只扫 hardcoded)"
# perl 支持 Unicode 属性类
EMO=$(perl -nle 'print "$ARGV:$.:$_" if /[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]/' \
  $(find "$ROOT/pages" "$ROOT/custom-tab-bar" -type f \( -name '*.wxml' -o -name '*.js' \)) 2>/dev/null \
  | grep -vE "(_pendingPreset|chooseImage|indexOf|_openid)" \
  || true)
if [ -n "$EMO" ]; then
  echo "$EMO"
  echo ""
  echo "❌ 以上 emoji 应替换为 /assets/icons/*.svg"
  EXIT=1
else
  echo "✅ 无残留"
fi

echo ""
if [ $EXIT -eq 0 ]; then
  echo "═══ 全部通过 ═══"
else
  echo "═══ 有残留，请修正 ═══"
fi
exit $EXIT
