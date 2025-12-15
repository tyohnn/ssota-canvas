#!/bin/bash

# GitHub Release Labels 생성 스크립트

set -e

echo "🏷️  Creating GitHub release labels..."
echo ""

# GitHub CLI 설치 확인
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "   Install: brew install gh"
    echo "   Or visit: https://cli.github.com/"
    exit 1
fi

# 인증 확인
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI is not authenticated."
    echo "   Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is ready"
echo ""

# Labels 생성
echo "Creating labels..."

# release:patch (Green)
gh label create "release:patch" \
    --description "Patch release (0.0.x) - Bug fixes and small improvements" \
    --color "0e8a16" \
    --force 2>/dev/null && echo "  ✅ release:patch" || echo "  ℹ️  release:patch already exists"

# release:minor (Yellow)
gh label create "release:minor" \
    --description "Minor release (0.x.0) - New features and Epic completion" \
    --color "fbca04" \
    --force 2>/dev/null && echo "  ✅ release:minor" || echo "  ℹ️  release:minor already exists"

# release:major (Red)
gh label create "release:major" \
    --description "Major release (x.0.0) - Major changes and official releases" \
    --color "d93f0b" \
    --force 2>/dev/null && echo "  ✅ release:major" || echo "  ℹ️  release:major already exists"

echo ""
echo "🎉 Labels created successfully!"
echo ""
echo "Usage:"
echo "  1. Create a PR: dev → main"
echo "  2. Add label: release:patch (or minor/major)"
echo "  3. Merge PR"
echo "  4. Watch the magic happen! ✨"
echo ""
echo "Labels:"
echo "  🟢 release:patch  → v0.5.3 → v0.5.4"
echo "  🟡 release:minor  → v0.5.3 → v0.6.0"
echo "  🔴 release:major  → v0.5.3 → v1.0.0"

