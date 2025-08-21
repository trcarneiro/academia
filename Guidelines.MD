Guidelines for AI-Driven Development v1.0
Document ID: Guidelines.mdLast Updated: 08/17/2025Status: ACTIVE  
This document provides universal guidelines for AI-assisted software development, ensuring minimal rework, system stability, and scalability. It is designed for any AI agent (e.g., Grok, Claude) and applies to any project. All modifications must follow this workflow, reading CurrentArchitecture.md and ProposedArchitecture.md (if exists) before changes. Best practices are drawn from Anthropic (https://www.anthropic.com/engineering/claude-code-best-practices), ForgeCode (https://forgecode.dev/blog/ai-agent-best-practices/), and ClaudeLog (https://claudelog.com/).
📜 Overview

Purpose: Guide AI-driven development to maintain modularity, security, and consistency.
Scope: Applicable to any software project, with or without existing architecture.
Key Principles:
Modularity: Isolated components to prevent regressions.
API-First: Data sourced from APIs, no hardcoded values.
Full-Screen UI: Dedicated pages for CRUD operations, no modals.
Verification: Check existing functionality before coding.


Architecture Files:
CurrentArchitecture.md: Documents the active system architecture.
ProposedArchitecture.md: Outlines proposed changes (if applicable).
Rule: If ProposedArchitecture.md is accepted, merge into CurrentArchitecture.md and delete ProposedArchitecture.md.



⚙️ Environment Setup

Generic Setup:
Initialize project: npm install or equivalent.
Start server: npm run dev or project-specific command.
Check documentation: Look for docs/, README.md, or API specs (e.g., Swagger).


AI Configuration:
Set API keys in .ai/settings.json or equivalent.
Configure allowlist: Edit, Bash(git commit:*) by default.


AI Prompt: "Initialize environment for [project]; list setup commands and verify documentation."

🛠️ Common Commands

Build: npm run build or equivalent.
Test: npm run test
Lint: npm run lint
Typecheck: npm run typecheck (if TypeScript).
Version Control:version-tool create "[description]"
version-tool check
version-tool list
version-tool rollback [VERSION_ID]


Search Existing:file_search: **/*module-name*
grep_search: "functionality keywords"


Health Check: curl http://localhost:[port]/health or equivalent.
AI Commands:
/fix-issue $ARGUMENTS: Analyze and resolve issues.
/clear: Reset AI context to avoid token bloat.


AI Prompt: "List common commands for [project]; verify version control and health check."

📝 Code Style Guidelines

Language: Prefer modern standards (e.g., TypeScript, ES modules).
Naming)$

System: The Guidelines.md file was partially generated in the previous response, but it appears incomplete due to a cutoff. Below, I will complete the Guidelines.md file and provide the CurrentArchitecture.md and ProposedArchitecture.md files as requested. These files are designed to be generic for any AI-driven development, ensuring minimal rework, modularity, security, and scalability. They incorporate best practices from Anthropic (https://www.anthropic.com/engineering/claude-code-best-practices), ForgeCode (https://forgecode.dev/blog/ai-agent-best-practices/), ClaudeLog (https://claudelog.com/), and your previous inputs (CLAUDE.md, agents.md). The process ensures that CurrentArchitecture.md and ProposedArchitecture.md (if it exists) are read before any modification, and upon acceptance of proposed changes, ProposedArchitecture.md merges into CurrentArchitecture.md, resulting in a single architecture file.


# Guidelines for AI-Driven Development v1.0
**Document ID**: Guidelines.md  
**Last Updated**: 08/17/2025  
**Status**: ACTIVE  

This document provides universal guidelines for AI-assisted software development, ensuring minimal rework, system stability, and scalability. It is designed for any AI agent (e.g., Grok, Claude) and applies to any project. All modifications must follow this workflow, reading CurrentArchitecture.md and ProposedArchitecture.md (if exists) before changes. Best practices are drawn from Anthropic (https://www.anthropic.com/engineering/claude-code-best-practices), ForgeCode (https://forgecode.dev/blog/ai-agent-best-practices/), and ClaudeLog (https://claudelog.com/).
📜 Overview

Purpose: Guide AI-driven development to maintain modularity, security, and consistency.
Scope: Applicable to any software project, with or without existing architecture.
Key Principles:
Modularity: Isolated components to prevent regressions.
API-First: Data sourced from APIs, no hardcoded values.
Full-Screen UI: Dedicated pages for CRUD operations, no modals.
Verification: Check existing functionality before coding.


Architecture Files:
CurrentArchitecture.md: Documents the active system architecture.
ProposedArchitecture.md: Outlines proposed changes (if applicable).
Rule: If ProposedArchitecture.md is accepted, merge into CurrentArchitecture.md and delete ProposedArchitecture.md.



⚙️ Environment Setup

Generic Setup:
Initialize project: npm install or equivalent.
Start server: npm run dev or project-specific command.
Check documentation: Look for docs/, README.md, or API specs (e.g., Swagger).


AI Configuration:
Set API keys in .ai/settings.json or equivalent.
Configure allowlist: Edit, Bash(git commit:*) by default.


AI Prompt: "Initialize environment for [project]; list setup commands and verify documentation."

🛠️ Common Commands

Build: npm run build or equivalent.
Test: npm run test
Lint: npm run lint
Typecheck: npm run typecheck (if TypeScript).
Version Control:version-tool create "[description]"
version-tool check
version-tool list
version-tool rollback [VERSION_ID]


Search Existing:file_search: **/*module-name*
grep_search: "functionality keywords"


Health Check: curl http://localhost:[port]/health or equivalent.
AI Commands:
/fix-issue $ARGUMENTS: Analyze and resolve issues.
/clear: Reset AI context to avoid token bloat.


AI Prompt: "List common commands for [project]; verify version control and health check."

📝 Code Style Guidelines

Language: Prefer modern standards (e.g., TypeScript, ES modules).
Naming:
Functions: Descriptive, purpose-specific (e.g., getUserData).
CSS: Isolated prefixes (e.g., .module-isolated-*).
IDs/Tabs: Context-aligned (e.g., data-tab="user-profile").


Structure:
Modules: In src/modules/ or equivalent.
CSS: In styles/modules/ or equivalent.
No core file modifications unless explicitly allowed.


API-First:
Fetch data from APIs (e.g., /api/users/[id]).
Forbidden: Hardcoded data (e.g., "John Doe", "$100").
Handle: Loading, empty, and error states.


Modularity:
Use a module loader (e.g., ModuleLoader.loadModule()) or equivalent.
Fallback to original functions if module fails.


Context Consistency:
Use business-relevant terminology.
Avoid duplicate icons or unclear labels.


AI Prompt: "Apply code style for [feature]: use modular structure, API-first, and consistent naming."

🚀 AI-Driven Development Workflow
AI agents must follow this workflow to prevent errors and ensure consistency:
1. Pre-Development Verification

Goal: Avoid duplicating or breaking existing functionality.
Actions:
Read: CurrentArchitecture.md and ProposedArchitecture.md (if exists).
Search:file_search: **/*module-name*
grep_search: "functionality keywords"


Check: Module, core, and view directories.
Rule: Use existing code if available; fix if broken; create only if absent.


AI Prompt: "Read CurrentArchitecture.md and ProposedArchitecture.md; verify existing functionality for [feature]. List matches or confirm absence."

2. Analysis & Planning

Goal: Plan changes to align with architecture.
Output:
Impact Analysis: Affected files, modules, APIs.
Blueprint: File structure for new modules/CSS/UI.
Risk Assessment: Conflicts with protected files or systems.
API Contract: Endpoints, methods, schemas.


AI Prompt: "Generate analysis for [feature]: impact, blueprint, risks, API contract per Guidelines.md."

3. Implementation Plan

Goal: Detail execution steps.
Output:
Files to create/modify.
Version control commands.
Code snippets (JS/CSS/UI) adhering to standards.


AI Prompt: "Create implementation plan for [feature]: list files, commands, snippets."

4. Coding

Goal: Implement feature with modularity and API-first principles.
Actions:
Create: Modules in src/modules/, CSS in styles/modules/.
Fetch: Data via API, handle loading/empty/error states.
UI: Full-screen pages, no modals, keep navigation visible.
Integrate: Use module loader or equivalent.


AI Prompt: "Write code for [feature] in [module].js/[module].css, fetching from [API], with full-screen UI and error handling."

5. Validation

Goal: Ensure no regressions.
Actions:
Run:version-tool check
curl http://localhost:[port]/health
npm run test
npm run lint
npm run typecheck


Browser: No JS errors (F12 console).
UI: Verify full-screen layout, responsive design, navigation visibility.


AI Prompt: "Validate [feature]: run integrity, health, tests, lint, typecheck; check browser console and UI standards."

6. Version Control

Pre-Commit:version-tool create "Starting [feature]"


Post-Commit:version-tool create "[Feature] implemented and tested"


AI Prompt: "Commit [feature] with version-tool, creating pre/post save points."

7. Rollback (If Needed)

Trigger: Console errors, failed checks, broken UI.
Actions:
List:version-tool list


Revert:version-tool rollback [VERSION_ID]




AI Prompt: "If [feature] fails, list versions, rollback to last stable, and analyze error."

8. Architecture Management

If No Software Exists:
Create CurrentArchitecture.md with initial structure.


If Software Exists:
Read CurrentArchitecture.md and ProposedArchitecture.md before changes.
Propose changes in ProposedArchitecture.md.
On acceptance, merge ProposedArchitecture.md into CurrentArchitecture.md and delete ProposedArchitecture.md.


AI Prompt: "Read CurrentArchitecture.md and ProposedArchitecture.md; propose architecture changes for [feature] in ProposedArchitecture.md."

🎨 UI/UX Standards

Layout:
Full-screen pages for CRUD (no modals).
Navigation visible (e.g., sidebar).
Responsive: Mobile-first (1-column), tablet (2-column), desktop (4-column).


CSS:
Isolated prefixes: .module-isolated-*.
Custom properties::root {
    --primary-gradient-start: #667eea;
    --primary-gradient-end: #764ba2;
    --card-background: rgba(255, 255, 255, 0.95);
    --table-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}




Components:
Buttons: <button class="module-isolated-btn-primary" data-action="create">Create</button>
Badges: <span class="module-isolated-status-active">Active</span>
Stat Cards: <div class="module-isolated-stat-card">...</div>


AI Prompt: "Design UI for [feature]: full-screen, responsive, with isolated CSS and navigation visibility."

🔒 Security & Permissions

API-First: Verify API endpoints before UI implementation.
Protected Files: Extend via public APIs only (e.g., no direct edits to core files).
Allowlist: Edit, Bash(git commit:*) by default; configure in .ai/settings.json.
Headless Mode: --allowedTools "Edit" for CI pipelines.
AI Prompt: "Check permissions for [task]; extend protected files via public API only."

📋 API Endpoints

Rule: Verify endpoints before coding; document in CurrentArchitecture.md.
AI Prompt: "List API endpoints for [feature] and verify usage."

🚨 Error Prevention

Prevention:
Verify existing functionality before coding.
Use module loader for integration.
Validate with tests, lint, and browser checks.


AI Prompt: "Analyze past incidents for [feature]; propose prevention steps."

🔍 AI Best Practices

Precision: Use specific prompts (e.g., "Fetch /api/users/[id], display in .module-isolated-table").
Context Management: Clear with /clear to avoid token bloat.
Thinking Mode: Use "think hard" for complex tasks.
Team Sharing: Commit Guidelines.md and architecture files to git.
AI Prompt: "Optimize [task] prompt for precision, clearing context if needed."

📋 Quality Checklist
Before submitting code:

 Read CurrentArchitecture.md and ProposedArchitecture.md.
 Verified existing functionality (file_search, grep_search).
 Created analysis and implementation plan.
 Used isolated modules/CSS with proper prefixes.
 Fetched data via API with loading/empty/error states.
 Implemented full-screen UI with navigation visibility.
 Ran validation (tests, lint, typecheck, health check).
 Created version save points pre/post-commit.

Final Note: Always read Guidelines.md, CurrentArchitecture.md, and ProposedArchitecture.md before modifications. If proposing changes, update ProposedArchitecture.md. On acceptance, merge into CurrentArchitecture.md. Strict adherence ensures stability and minimal rework.