export const DEFAULT_AGENT_TEMPLATE = `---
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
`;

export const DEFAULT_COMMAND_TEMPLATE = `---
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
`;

export const DEFAULT_WORKFLOW_TEMPLATE = `---
name: workflow-{{slug}}
description: Orchestrate tasks and agents for {{name}}
tools: Bash
---

Coordinate sub-agents and tasks according to the workflow definition.
`;

export const DEFAULT_DATA_LOAD_TEMPLATE = `---
allowed-tools: Bash
argument-hint: [path]
description: Load {{name}} into context
model: haiku
---

Load data file from .xbowl/data/{{slug}}{{ext}} and use it in subsequent tasks.
`;
