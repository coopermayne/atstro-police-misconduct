---
description: Stage and commit changes with a descriptive message
---

You are helping commit changes to git with a helpful, descriptive commit message.

**Task**:

{{#if @arguments}}
1. Stage and commit ONLY these specific files: {{@arguments}}
2. Run `git diff {{@arguments}}` to see what changed in these files
3. Analyze the changes in ONLY these files
4. Generate a focused commit message describing the changes in these specific files
{{else}}
1. Stage and commit ALL changed files
2. Run `git status` and `git diff` to see all changes
3. Analyze all the changes comprehensively
4. Generate a commit message describing all the changes
{{/if}}

**Commit Message Format**:
- Start with conventional commit type: `feat:`, `fix:`, `docs:`, `refactor:`, `style:`, `chore:`, etc.
- Write a clear, descriptive summary (50-72 chars max for first line)
- Add detailed body if changes are complex (explain what and why, not how)
- End with the Claude Code signature:

```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Important**:
- Use git add to stage the files
- Use git commit with a HEREDOC for the message to preserve formatting
- Run git status after committing to confirm
- DO NOT push to remote (that's a separate action)

**Example commit command**:
```bash
git commit -m "$(cat <<'EOF'
feat: add new feature X

Detailed explanation of what changed and why.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

Now proceed with the commit.
