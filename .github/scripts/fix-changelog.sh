#!/bin/bash

# CHANGELOG 완전 수정 스크립트
# 1. 누락된 태그 생성
# 2. CHANGELOG 재생성
# 3. 태그 push (선택)

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

clear

cat << "EOF"
╔══════════════════════════════════════════════════════╗
║                                                      ║
║        🔧 CHANGELOG & Release Tag Fixer 🔧           ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${BLUE}This script will:${NC}"
echo "  1. Create missing git tags (v0.3.0 ~ v0.5.0)"
echo "  2. Regenerate CHANGELOG.md with version sections"
echo "  3. (Optional) Push tags to remote"
echo ""

# 현재 상태 확인
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Current Status:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo "📍 Current branch: $(git rev-parse --abbrev-ref HEAD)"
echo ""
echo "🏷️  Existing tags:"
git tag -l | grep -E "^v[0-9]" | sort -V || echo "  (none)"
echo ""
echo "📋 CHANGELOG structure:"
if grep -q "## \[0\." CHANGELOG.md 2>/dev/null; then
    echo "  ✅ Has version sections"
else
    echo "  ⚠️  Only [unreleased] section"
fi
echo ""

# 확인
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
read -p "Continue? (y/N): " -n 1 -r
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""

# Step 1: 태그 생성
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 1: Creating Missing Tags${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

bash "$(dirname "$0")/create-missing-tags.sh"

echo ""

# Step 2: CHANGELOG 재생성
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 2: Regenerating CHANGELOG${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

bash "$(dirname "$0")/regenerate-changelog.sh"

# CHANGELOG 적용 확인
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
read -p "Apply new CHANGELOG? (y/N): " -n 1 -r
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [[ $REPLY =~ ^[Yy]$ ]]; then
    mv CHANGELOG_NEW.md CHANGELOG.md
    echo -e "${GREEN}✅ Applied new CHANGELOG.md${NC}"
    rm -f CHANGELOG.md.backup
    echo -e "${GREEN}✅ Removed backup${NC}"
else
    echo -e "${YELLOW}⏭️  Skipped. CHANGELOG_NEW.md kept for review.${NC}"
fi

echo ""

# Step 3: 태그 push (선택)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Step 3: Push Tags (Optional)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}⚠️  This will push all tags to remote repository.${NC}"
echo ""
echo "Tags to be pushed:"
git tag -l | grep -E "^v[0-9]" | sort -V
echo ""

read -p "Push tags to remote? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Pushing tags..."
    git push origin --tags
    echo -e "${GREEN}✅ Tags pushed successfully!${NC}"
    echo ""
    echo -e "${GREEN}🎉 GitHub Releases will be created automatically!${NC}"
else
    echo -e "${YELLOW}⏭️  Skipped. You can push later with:${NC}"
    echo "     git push origin --tags"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All done!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Summary:"
echo "  ✅ Tags created"
echo "  ✅ CHANGELOG regenerated"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "  ✅ Tags pushed to remote"
else
    echo "  ⏳ Tags not pushed yet"
fi
echo ""
echo "Next steps:"
echo "  1. Review CHANGELOG.md"
echo "  2. Commit changes: git add CHANGELOG.md && git commit -m 'docs: reorganize CHANGELOG with version tags'"
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "  3. Push tags: git push origin --tags"
fi
echo ""

