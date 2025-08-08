---
allowed-tools: Bash
argument-hint: [args]
description: {{description}}
model: sonnet
---

{{instructions}}

{{#each requiredPhrases}}
{{this}}
{{/each}}

{{#each securityWarnings}}
⚠️ {{this}}
{{/each}}
