# Link2Pay UX Laws and Guidelines

This document translates UX psychology laws into practical implementation rules for Link2Pay.

## Core UX Laws We Apply

1. Jakob's Law
- Keep core flows familiar (form fields, CTA hierarchy, status states, copy actions).
- Prefer standard checkout and payment language over internal jargon.

2. Fitts's Law
- Primary actions must be easy to hit on mobile and desktop.
- Keep important tap targets large and visually distinct (`Create`, `Copy`, `Continue`).

3. Miller's Law
- Chunk complex tasks into small steps.
- Group fields by intent (asset, amount, expiration) and avoid dense mixed controls.

4. Hick's Law
- Limit decisions per screen.
- Surface defaults and quick presets (common amount presets, short expiration set).

5. Postel's Law
- Be strict in output, forgiving in input.
- Accept human amount formats (commas/periods) and normalize safely.

6. Peak-End Rule
- End each flow with a clear next action and confidence signal.
- After preview or success, guide users to the live workflow.

7. Aesthetic-Usability Effect
- Keep visual hierarchy clean and polished to improve perceived trust.
- Use spacing, contrast, and predictable typography to reduce anxiety.

8. Von Restorff Effect
- Use one clear visual primary action per section.
- Avoid competing highlighted controls.

9. Tesler's Law
- Push unavoidable complexity into system logic, not user tasks.
- Auto-generate references, status payloads, and sane defaults.

10. Doherty Threshold
- Keep interaction feedback immediate.
- Show instant preview updates and clear copy-to-clipboard confirmation.

## Product-Specific UX Rules

1. Every payment creation screen must have one dominant CTA.
2. Every amount input should be tolerant and normalized on blur.
3. Every async action must show explicit feedback (loading, success, error).
4. Every preview/demo UI must avoid localhost-facing URLs.
5. Every multilingual text update must be reviewed for natural phrasing, not literal translation.

## Principle to Law to Rule Framework

This follows the chapter pattern from the book: define a design principle, connect to a law, then define concrete rules.

1. Principle: Clarity over abundance of choice
- Law: Hick's Law
- Rule: Show no more than 3 primary options per decision group when possible.

2. Principle: Guide users to successful completion
- Law: Peak-End Rule
- Rule: End every key flow section with one clear next-step CTA.

3. Principle: Fast, trustworthy interaction
- Law: Doherty Threshold
- Rule: Show immediate feedback for edits and copy actions (< 400ms perceived response).

4. Principle: Forgiving input, strict output
- Law: Postel's Law
- Rule: Accept common user formats (comma/period amounts), normalize before payload generation.

## Good Principles Checklist

Use these checks before adding or changing principles:

1. Not a truism: specific and actionable.
2. Solves real product questions.
3. Opinionated enough to help teams say no.
4. Memorable enough to be used daily.

## Review Checklist for PRs

- Is there a single primary action in each section?
- Are choices reduced or grouped into small chunks?
- Are inputs forgiving and outputs deterministic?
- Does the flow provide instant feedback?
- Is the final state clear with a next step?
- Is wording natural in EN/ES/PT?
