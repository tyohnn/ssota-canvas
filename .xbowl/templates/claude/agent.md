---
name: {{slug}}
description: {{description}}
tools: Bash
---

{{role}}

{{#if identity}}
Identity: {{identity}}
{{/if}}

{{#if focus}}
Focus: {{focus}}
{{/if}}

{{#if core_principles}}
Core Principles:
{{core_principles}}
{{/if}}

{{#each requiredPhrases}}
{{this}}
{{/each}}

{{#each securityWarnings}}
⚠️ {{this}}
{{/each}}
