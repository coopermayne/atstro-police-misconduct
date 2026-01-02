# Claude Code Custom Instructions Structure

This document explains how custom Claude Code instructions are organized in this project.

## Overview

Claude Code reads several markdown files to understand project context and workflows. These files are automatically loaded based on their location.

## File Locations

```
/
├── CLAUDE.md                      # Main instructions (auto-loaded)
├── .claude/
│   ├── project-context.md         # Additional project context
│   └── commands/
│       └── cm.md                  # Custom /cm skill (commit)
└── instructions/
    ├── common.md                  # Shared content creation instructions
    ├── cases.md                   # Case article instructions
    └── posts.md                   # Blog post instructions
```

## How Each File Is Used

### CLAUDE.md (Root)

**Auto-loaded**: Yes - Claude Code reads this automatically.

**Purpose**: Primary entry point for project instructions.

**Contains**:
- Project overview
- Development commands
- Content creation workflow
- Architecture summary
- Key file references

### .claude/project-context.md

**Auto-loaded**: Yes - Claude Code reads files in `.claude/` automatically.

**Purpose**: Supplementary project context beyond CLAUDE.md.

**Contains**:
- Tech stack details
- Current implementation status
- Common issues and solutions
- Quick context tips

### .claude/commands/*.md

**Auto-loaded**: No - These define custom skills invoked with `/skillname`.

**Purpose**: Define reusable workflows triggered by slash commands.

**Current Skills**:
- `/cm` - Stage and commit changes with descriptive message

**Skill File Format**:
```markdown
---
description: Short description shown in skill list
---

Prompt template here. Use {{@arguments}} for user input.
```

### instructions/*.md

**Auto-loaded**: No - Claude Code reads these when instructed to.

**Purpose**: Detailed guidelines for specific content types.

**Usage**: CLAUDE.md tells Claude Code to read these files before creating content:

```
When creating or editing case articles or blog posts, read these files first:
- instructions/common.md
- instructions/cases.md (for cases)
- instructions/posts.md (for posts)
```

**Files**:
| File | Read When |
|------|-----------|
| `common.md` | Always - media utilities, components, registry |
| `cases.md` | Creating/editing police misconduct case articles |
| `posts.md` | Creating/editing blog posts |

## Creating New Custom Skills

1. Create a file in `.claude/commands/` with `.md` extension
2. Add frontmatter with `description` field
3. Write the prompt template
4. Use `{{@arguments}}` to capture user input

**Example** (`.claude/commands/example.md`):
```markdown
---
description: Example skill that does something useful
---

You are helping with a specific task.

{{#if @arguments}}
User provided: {{@arguments}}
{{else}}
No arguments provided.
{{/if}}

Instructions for what to do...
```

**Invoke with**: `/example` or `/example some arguments`

## Best Practices

### Keep CLAUDE.md Focused
- Essential commands and workflows
- Brief architecture overview
- Links to detailed docs (don't duplicate content)

### Use instructions/ for Content Guidelines
- Detailed writing tone and structure
- Complete frontmatter schemas
- Full examples
- Workflow checklists

### Use .claude/project-context.md for Context
- Implementation status
- Tech stack details
- Common patterns and issues
- Information that helps Claude understand the project

### Custom Skills Should Be Reusable
- Define workflows you use frequently
- Keep prompts focused on one task
- Document expected behavior in the description
