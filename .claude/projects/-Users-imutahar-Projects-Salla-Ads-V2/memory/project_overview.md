---
name: Salla Ads V2 Project Overview
description: Multi-platform advertising campaign builder supporting Meta, TikTok, Google, Snapchat, DV360 with shared component architecture
type: project
---

Salla Ads V2 is a React-based multi-platform advertising campaign creation tool for the Salla e-commerce platform. It supports 5 ad platforms: Meta (Facebook/Instagram), TikTok, Google Ads (6 campaign types), Snapchat, and DV360 (YouTube & Partners).

**Why:** Built for Saudi/MENA e-commerce merchants who need a unified interface to create ad campaigns across platforms without learning each platform's native ad manager.

**How to apply:** Each platform has its own wizard under `components/{platform}/` with shared components in `components/shared/`. Campaign types/configs live in `lib/{platform}/campaign-types.ts`. All platforms follow a 5-step wizard pattern: Objective -> Audience -> Budget -> Creative -> Review.
