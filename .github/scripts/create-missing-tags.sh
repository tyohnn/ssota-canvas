#!/bin/bash

# 누락된 Git 태그 생성 스크립트
# 과거 버전 커밋들에 태그를 생성하여 CHANGELOG를 정리합니다.

set -e

echo "🏷️  Creating missing git tags..."
echo ""

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 태그 생성 함수
create_tag() {
    local version=$1
    local commit=$2
    local date=$3
    
    # 태그가 이미 존재하는지 확인
    if git rev-parse "$version" >/dev/null 2>&1; then
        echo -e "${YELLOW}  ⏭️  Tag $version already exists${NC}"
        return
    fi
    
    # 태그 생성
    git tag -a "$version" "$commit" -m "Release $version

Released on: $date

This tag was created retrospectively to organize the CHANGELOG.
See CHANGELOG.md for detailed release notes."
    
    echo -e "${GREEN}  ✅ Created tag: $version → $commit${NC}"
}

echo "Creating tags from version commits..."
echo ""

# v0.5.x series
create_tag "v0.5.2" "7579ae191b6377fdec0cf6fdac94ca3a5ca181eb" "2025-12-10"
create_tag "v0.5.1" "8d423fe0cb3b5e49eee13fba6a4afee5b8d6e260" "2025-12-10"
create_tag "v0.5.0" "2880ce2e187f3e8be2df234931b306178aee4619" "2025-12-10"

# v0.3.x series
create_tag "v0.3.6" "d2e49d2fd3fc130d998287c08437cbd90c54816f" "2025-11-28"
create_tag "v0.3.5" "ffbc71c4ceea11a1ad9105792da6353f81a5a23f" "2025-11-27"
create_tag "v0.3.4" "5f7dfdb7cee16eefa9ebce666d01f80a8b12adac" "2025-11-26"
create_tag "v0.3.3" "978dc33f217039f5c579412ad443f3141244fb26" "2025-11-24"
create_tag "v0.3.2" "c7358d517f21a7a45f059e7fc1e658afb4ae5cab" "2025-11-24"
create_tag "v0.3.1" "233d806ea81e40cd236ce8858a2413afccefcecc" "2025-11-22"
create_tag "v0.3.0" "7364e858598a7402565cf2689828d4884a7e2648" "2025-11-22"

echo ""
echo -e "${GREEN}✅ All tags created successfully!${NC}"
echo ""
echo "📋 Summary:"
git tag -l | grep -E "^v[0-9]" | sort -V
echo ""
echo -e "${YELLOW}⚠️  Note: Tags are created locally only.${NC}"
echo ""
echo "Next steps:"
echo "  1. Review tags: git tag -l"
echo "  2. Push tags: git push origin --tags"
echo "  3. Regenerate CHANGELOG: git cliff --config cliff.toml > CHANGELOG_NEW.md"
echo ""

