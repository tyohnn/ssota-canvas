#!/bin/bash

# 태그에 대한 GitHub Release 생성 스크립트

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

# GitHub CLI 확인
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed.${NC}"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI is not authenticated.${NC}"
    exit 1
fi

# 태그 목록 (v0.5.1, v0.5.2만)
TAGS="v0.5.1 v0.5.2"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Creating GitHub Releases for tags${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

CREATED=0
SKIPPED=0

for TAG in $TAGS; do
    # 기존 Release 확인
    if gh release view "$TAG" &> /dev/null; then
        echo -e "${YELLOW}⏭️  Release for ${TAG} already exists, skipping...${NC}"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi
    
    echo -e "${BLUE}Creating release for: ${TAG}${NC}"
    
    # 태그 메시지 가져오기
    TAG_MESSAGE=$(git tag -l --format='%(contents)' "$TAG" 2>/dev/null || echo "Release $TAG")
    
    # Release notes 생성
    RELEASE_NOTES="$TAG_MESSAGE"
    
    # GitHub Release 생성
    if gh release create "$TAG" \
        --title "$TAG" \
        --notes "$RELEASE_NOTES" \
        --prerelease=false 2>/dev/null; then
        echo -e "${GREEN}  ✅ Created release: ${TAG}${NC}"
        CREATED=$((CREATED + 1))
    else
        echo -e "${RED}  ❌ Failed to create release: ${TAG}${NC}"
    fi
    
    sleep 1
done

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Summary:${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✅ Created: ${CREATED}${NC}"
echo -e "${YELLOW}⏭️  Skipped: ${SKIPPED}${NC}"
echo ""

