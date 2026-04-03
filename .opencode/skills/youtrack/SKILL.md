---
name: youtrack
description: "Create and update YouTrack tickets following strict quality rules. Use when user asks to create a bug report, write a feature request, update a ticket, or file an issue. Supports: (1) Validating ticket quality against rules, (2) Generating properly structured bug reports with reproduction steps, (3) Writing feature tickets with problem + proposed solution, (4) Enforcing one-issue-per-ticket policy, (5) Ensuring all required fields are populated, (6) Project isolation - only work with whitelisted projects."
license: MIT
allowed-tools: Bash, Read, Write, Glob, Grep, Task
---

# YouTrack Ticket Quality Enforcer

## When creating a ticket:

1. Determine ticket type
2. Determine priority
3. Estimate story points
4. Validate Definition of Ready
5. Generate ticket using template
6. Validate against checklist
7. Assign labels
8. Link dependencies

## Overview

Create and validate YouTrack tickets that are clear, reproducible, and actionable. Every ticket must follow strict quality rules to ensure the team can understand, reproduce, and resolve issues efficiently.

## My Projects (Whitelist)

**ONLY work with tickets from these projects. NEVER touch tickets from other projects.**

| Project ID | Project Name | Short Name | Notes                    | Write it in the skill format. |
| ---------- | ------------ | ---------- | ------------------------ | ----------------------------- |
| 1          | Vidyame      | vidyame    | Currently active project |

### Project Isolation Rules

> **CRITICAL: Never access, modify, or create tickets in projects not listed above.**

1. Before any ticket operation, verify the project is in the whitelist
2. If asked to work on a ticket from a non-whitelisted project, **refuse** and explain
3. Always include project ID when creating or querying tickets
4. When listing tickets, filter by allowed projects only

### Assignee Constraint Rules

> **CRITICAL: Only edit tickets belonging to Harsh shinde by default.**

1. **Target Assignee**: Default ticket interactions to `harshshinde5606` (Harsh shinde).
2. **Mandatory Confirmation**: Before updating, editing, or moving any ticket assigned to someone OTHER than **Harsh shinde**, you **MUST** seek explicit user approval.
3. **Verification**: Inspect the `Assignee` field of any ticket before executing an `update` or `edit` command.

### Adding New Projects

To add a new project to the whitelist:

1. Get project ID and short name from YouTrack
2. Add entry to the table above
3. Document any special handling notes

## Core Rules

### 1. Title Rules

- **Must state problem + context** in one line
- **No vague words**: Avoid "broken", "doesn't work", "issue with", "problem", "error", "bad"
- **Format**: `[Component] Specific problem with context`
- **Examples**:
  - Bad: "Login not working"
  - Bad: "API issue"
  - Good: `[Auth] Login returns 403 when JWT token expires during active session`
  - Good: `[Dashboard] Revenue chart displays negative values for Q4 2025 data`
  - Good: `[Export] PDF export truncates Cyrillic characters in user names`

### 2. Description Structure

Every description **must** contain these sections in order:

```markdown
## Problem

[What is happening - factual, observable, specific]

## Context

- **Environment**: [Browser/OS/App version]
- **User role**: [Who is affected]
- **When**: [When does it occur - trigger condition]
- **Where**: [Specific page/endpoint/component]

## Impact

[Who is affected and how - business/user impact with numbers if possible]

## Steps to Reproduce

1. [First action]
2. [Second action]
3. [Third action]
   ...

## Expected Behavior

[What SHOULD happen]

## Actual Behavior

[What IS happening]

## Proof

[Screenshot / Video / Log / HAR file / Console output]

## Acceptance Criteria

- [ ] [Criterion 1 - specific, measurable]
- [ ] [Criterion 2 - specific, measurable]
- [ ] [Criterion 3 if needed]
```

### 3. Bug Report Requirements

Every bug ticket **must** have:

| Requirement                                     | Status   |
| ----------------------------------------------- | -------- |
| Clear, numbered reproduction steps              | Required |
| Expected vs Actual behavior (separate sections) | Required |
| At least one proof attachment                   | Required |
| Acceptance criteria checklist (min 2 items)     | Required |
| All required fields filled                      | Required |

### 4. Feature Ticket Requirements

Feature tickets **must** include:

- **Problem**: What pain point or gap exists
- **Proposed Solution**: What should be built and why
- **User story format**: "As a [role], I want [feature] so that [benefit]"
- Same acceptance criteria and field requirements as bugs

### 5. One Issue Per Ticket

```
INVALID: "Login and dashboard and export issues"
VALID:   "[Auth] Login fails when session expires"
VALID:   "[Dashboard] Revenue widget shows stale data"
VALID:   "[Export] PDF export truncates special characters"
```

### 6. Required Fields

Every ticket **must** have these fields populated:

| Field        | Options                                   |
| ------------ | ----------------------------------------- |
| Project      | Must be from whitelist                    |
| Type         | Bug / Feature / Task / Improvement / Epic |
| Priority     | Critical / Major / Minor / Normal         |
| Assignee     | Team member (Default: Harsh shinde)       |
| Estimate     | Time estimate **in hours**                |
| Story Points | 1, 2, 3, 5, 8, 13                         |
| Spent Time   | Actual time worked **in hours**           |
| Labels       | frontend/backend/api/etc                  |
| Dependencies | Optional                                  |

### 7. Language Guidelines

| Never Write          | Write Instead                                          |
| -------------------- | ------------------------------------------------------ |
| "Fix this"           | "The system should..."                                 |
| "Not working"        | "The function returns X instead of Y"                  |
| "Something is wrong" | "Expected Z but observed W"                            |
| "Bug in feature"     | "Feature F produces incorrect output when condition C" |
| "Please fix"         | "The acceptance criteria above define completion"      |

### 8. Reproducibility Rule

> **If it cannot be reproduced, the ticket is invalid.**

Every bug ticket must have steps that another developer can follow and see the same result. If you cannot write reproduction steps, do not create the ticket.

### 9. Done Definition

Every ticket must define "done" unambiguously:

```markdown
## Done = All of the following:

1. [ ] [Specific condition 1 met]
2. [ ] [Specific condition 2 met]
3. ] Unit tests added for [component]
4. ] No regression in [related area]
```

## Validation Checklist

Before creating or approving a ticket, validate against this checklist:

### Title

- [ ] States the problem clearly
- [ ] Includes context/component
- [ ] No vague words (broken, error, issue, problem)
- [ ] Understandable in <5 seconds

### Description

- [ ] Has Problem section
- [ ] Has Context section
- [ ] Has Impact section
- [ ] Has Steps to Reproduce (numbered)
- [ ] Has Expected Behavior (separate)
- [ ] Has Actual Behavior (separate)
- [ ] Has at least one Proof
- [ ] Has Acceptance Criteria (min 2 items)
- [ ] Can be understood in <30 seconds

### Metadata

- [ ] Project is in whitelist
- [ ] Type is filled
- [ ] Priority is filled
- [ ] Assignee is filled
- [ ] Estimate is filled
- [ ] Story Points is filled

### Quality

- [ ] One issue per ticket
- [ ] Written from user/system perspective
- [ ] No assumptions stated as facts
- [ ] "Done" is clearly defined
- [ ] Reproduction steps are verifiable

## Ticket Templates

### Bug Report Template

```markdown
# [Component] Specific problem with context

## Problem

[What is happening - factual and specific]

## Context

- **Environment**: [Browser/OS/Version]
- **User role**: [Who experiences this]
- **When**: [Trigger condition]
- **Where**: [Page/endpoint/component]

## Impact

[Business/user impact - include numbers if possible]

## Steps to Reproduce

1. Navigate to [specific URL/location]
2. [Action with specific values]
3. [Action with expected result]
4. Observe [actual result]

## Expected Behavior

[What SHOULD happen when following steps above]

## Actual Behavior

[What IS happening when following steps above]

## Proof

- Screenshot: [attachment or URL]
- Video: [if applicable]
- Logs: [relevant log output]

## Acceptance Criteria

- [ ] [Specific, measurable criterion 1]
- [ ] [Specific, measurable criterion 2]
- [ ] [Additional criterion if needed]

## Done Definition

- [ ] Issue no longer occurs following reproduction steps
- [ ] Unit tests added/updated
- [ ] No regression in [related functionality]
```

### Feature Request Template

```markdown
# [Component] Feature for specific user benefit

## Problem

[What pain point or gap exists - from user perspective]

## Proposed Solution

[What should be built and why it solves the problem]

## User Story

As a [role], I want [feature] so that [benefit]

## Context

- **Environment**: [Where this applies]
- **User role**: [Who benefits]
- **Frequency**: [How often used]

## Impact

[Value delivered - include metrics if possible]

## Acceptance Criteria

- [ ] [Feature works as described: specific behavior]
- [ ] [Feature handles edge case: specific scenario]
- [ ] [Feature meets performance threshold if applicable]

## Done Definition

- [ ] Feature implemented per acceptance criteria
- [ ] Tests added covering happy path and edge cases
- [ ] Documentation updated if applicable
- [ ] No breaking changes to existing functionality

## 10. Time & Effort Estimation Guide (Hours)

In this project, both **Estimate** and **Story Points** are represented as **HOURS** of effort.

| Hours (SP) | Typical Effort Description                                   |
| ---------- | ------------------------------------------------------------ |
| 1 - 2      | Quick fixes, text changes, small configuration updates       |
| 3 - 5      | Medium bugs, small frontend components, simple logic changes |
| 6 - 8      | Standard features, complex bugs, backend + frontend work     |
| 10 - 16    | Large features, multi-component refactors                    |
| > 20       | Complex modules – **MUST be split into smaller tickets**     |

### Tracking Time Spent

1. **Reporting**: After every completed task or session, update the `Spent Time` field with the actual hours worked.
2. **Accuracy**: Ensure the `Spent Time` reflects the real effort for future sprint planning accuracy.

### Estimation Rules

- Bug fixes are usually **1–3 points**
- Small improvements are **2–3 points**
- Features are usually **3–8 points**
- Infrastructure tasks are **5–8 points**
- Any ticket **> 8 points must be split**
- If uncertain → estimate higher
- Spikes / research tasks → 3 or 5 points

## 11. Priority Definition Guide

| Priority | When to Use                                                 |
| -------- | ----------------------------------------------------------- |
| Critical | Production down, payments failing, login failing, data loss |
| Major    | Core feature unusable but system still works                |
| Normal   | Standard feature work or moderate bug                       |
| Minor    | Cosmetic issue, UI alignment, low impact                    |

### Priority Rules

- Critical tickets interrupt sprint immediately
- Major should be fixed in current sprint
- Normal goes into backlog/sprint planning
- Minor scheduled when time available

## 12. Ticket Type Decision Rules

| Type        | Use When                                  |
| ----------- | ----------------------------------------- |
| Bug         | Existing feature behaves incorrectly      |
| Feature     | New functionality                         |
| Improvement | Improve existing feature                  |
| Task        | Technical work, refactor, infrastructure  |
| Epic        | Large feature split into multiple tickets |

### Epic Rules

- Epics must contain multiple tickets
- Epics cannot be assigned directly to developers
- Epics must define overall goal and success criteria

## 13. Ticket Workflow

All tickets must follow this workflow:

Backlog → Selected → In Progress → Code Review → Testing → Done

### Status Rules

| Status                    | Who Moves       |
| ------------------------- | --------------- |
| Backlog → Selected        | Product Manager |
| Selected → In Progress    | Developer       |
| In Progress → Code Review | Developer       |
| Code Review → Testing     | Reviewer        |
| Testing → Done            | QA / Product    |
| Testing → In Progress     | QA if failed    |

### Workflow Rules

- No ticket goes to In Progress without Story Points
- No ticket goes to Code Review without PR
- No ticket goes to Done without passing Acceptance Criteria

## 14. Definition of Ready

A ticket can enter a sprint only if ALL conditions are met:

- Problem clearly defined
- Acceptance criteria written
- Story points assigned
- Priority assigned
- Dependencies identified
- Reproduction steps exist (for bugs)
- Mockups attached (for UI work)
- API contract defined (for backend work)
- Ticket can be completed within one sprint

If a ticket does not meet Definition of Ready, it cannot enter sprint.

## 15. Dependencies

- Blocked by: [TICKET-ID]
- Blocks: [TICKET-ID]

## 16. Root Cause

[Filled after investigation]

## 17. Labels / Components

Use standardized labels for all tickets:

| Label       | Use For            |
| ----------- | ------------------ |
| frontend    | UI / frontend work |
| backend     | Backend logic      |
| api         | API related        |
| ui          | UI design          |
| infra       | Infrastructure     |
| performance | Performance issues |
| security    | Security related   |
| payments    | Payment systems    |
| auth        | Authentication     |
| database    | Database changes   |

Each ticket should have at least one label.

## 18. Sprint Planning Rules

- Sprint capacity = Team members × 8 story points
- Bugs are prioritized before features
- No ticket > 8 points allowed in sprint
- Critical bugs interrupt sprint immediately
- Tickets without story points cannot enter sprint
- Tickets without acceptance criteria cannot enter sprint
- Each sprint should include:
  - Bugs
  - Improvements
  - Features
  - Technical debt
- Max 2 Epics per sprint

## 19. SLA (Service Level Agreement)

| Priority | Response Time | Fix Target     |
| -------- | ------------- | -------------- |
| Critical | 2 hours       | Same day       |
| Major    | 1 day         | 2–3 days       |
| Normal   | 2 days        | Next sprint    |
| Minor    | 1 week        | When available |
```

## Validation Commands

Use these checks when reviewing a ticket:

```bash
# CRITICAL: Verify project is in whitelist before any operation
PROJECT_ID="<project-id>"
ALLOWED_PROJECTS="1"  # vidyame
echo "$ALLOWED_PROJECTS" | grep -qw "$PROJECT_ID" || echo "ERROR: Project not in whitelist - ACCESS DENIED"

# Check for vague words in title
echo "$TITLE" | grep -iE "^(.*\s)?(broken|doesn't work|issue|problem|error|bug|bad|wrong)(\s.*)?$"

# Verify all sections exist
for section in "Problem" "Context" "Impact" "Steps to Reproduce" "Expected Behavior" "Actual Behavior" "Acceptance Criteria"; do
  echo "$CONTENT" | grep -q "^## $section" || echo "Missing: $section"
done

# Count acceptance criteria items
echo "$CONTENT" | grep -c "^- \[ \]"

# Verify numbered steps exist
echo "$CONTENT" | grep -cE "^[0-9]+\."
```

## Quick Reference

| Rule | Requirement |
| ---- | ----------- |

## Quick Reference

| Rule                  | Requirement                                                       |
| --------------------- | ----------------------------------------------------------------- |
| **Project isolation** | Only work with whitelisted projects                               |
| Title clarity         | Problem + context, no vague words                                 |
| Description           | Problem, Context, Impact sections                                 |
| Bug reproduction      | Numbered steps another can follow                                 |
| Expected/Actual       | Separate sections                                                 |
| Proof                 | Screenshot/video/log required                                     |
| Acceptance criteria   | Minimum 2 checklist items                                         |
| One issue per ticket  | Single problem or feature only                                    |
| Language              | User/system perspective, objective                                |
| Required fields       | Project, Type, Priority, Assignee, Estimate, Story Points, Labels |
| Feature tickets       | Problem + proposed solution                                       |
| 30-second rule        | Understandable in 30 seconds                                      |
| Reproducibility       | If not reproducible, ticket is invalid                            |
| No assumptions        | Describe exactly what happens                                     |
| Done definition       | Unambiguous completion criteria                                   |
| Story points          | Must follow estimation guide                                      |
| Priority              | Must follow priority definition                                   |
| Workflow              | Must follow ticket workflow                                       |
| Definition of Ready   | Ticket must meet DoR before sprint                                |
| Dependencies          | Must be listed if applicable                                      |
| Labels                | Must include at least one label                                   |
