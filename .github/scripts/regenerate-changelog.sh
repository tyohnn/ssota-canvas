#!/bin/bash

# CHANGELOG 재생성 스크립트
# 태그 생성 후 CHANGELOG.md를 버전별로 정리합니다.

set -e

echo "📚 Regenerating CHANGELOG..."
echo ""

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 현재 브랜치 확인
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${BLUE}Current branch: $CURRENT_BRANCH${NC}"
echo ""

# git-cliff 설치 확인
if ! command -v git-cliff &> /dev/null; then
    echo -e "${YELLOW}⚠️  git-cliff not found. Trying to use pnpm...${NC}"
    if command -v pnpm &> /dev/null; then
        CLIFF_CMD="pnpm exec git-cliff"
    else
        echo -e "${YELLOW}❌ git-cliff not available. Please install it first:${NC}"
        echo "   brew install git-cliff"
        echo "   or"
        echo "   pnpm install"
        exit 1
    fi
else
    CLIFF_CMD="git-cliff"
fi

echo "Using: $CLIFF_CMD"
echo ""

# 기존 CHANGELOG 백업
if [ -f "CHANGELOG.md" ]; then
    cp CHANGELOG.md CHANGELOG.md.backup
    echo -e "${GREEN}✅ Backed up CHANGELOG.md → CHANGELOG.md.backup${NC}"
fi

# CHANGELOG 재생성
echo ""
echo "Generating new CHANGELOG..."
$CLIFF_CMD --config cliff.toml --output CHANGELOG_NEW.md

if [ ! -f "CHANGELOG_NEW.md" ]; then
    echo -e "${YELLOW}❌ Failed to generate CHANGELOG_NEW.md${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Generated CHANGELOG_NEW.md${NC}"
echo ""

# 미리보기
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Preview (first 50 lines):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
head -50 CHANGELOG_NEW.md
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 사용자 확인
echo -e "${YELLOW}Review the preview above.${NC}"
echo ""
echo "Next steps:"
echo "  1. Check CHANGELOG_NEW.md: cat CHANGELOG_NEW.md | less"
echo "  2. If it looks good, replace: mv CHANGELOG_NEW.md CHANGELOG.md"
echo "  3. If not, restore backup: mv CHANGELOG.md.backup CHANGELOG.md"
echo ""
echo "Files created:"
echo "  - CHANGELOG_NEW.md (new version)"
echo "  - CHANGELOG.md.backup (backup)"
echo ""

