---
name: obsidian-cyber-ide-design
description: Use this skill to generate well-branded interfaces and assets for Obsidian Cyber IDE, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for protoyping.
user-invocable: true
---

The design system lives in the `@orpm/design-system` workspace package at
`packages/design-system/` (repository root). This skill only points to it, so there is a
single source of truth.

Read `packages/design-system/README.md`, then explore the other files in that package
(`tokens/`, `components/`, `guidelines/`, `ui_kits/`).
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, import the tokens from the package and read the rules there to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
