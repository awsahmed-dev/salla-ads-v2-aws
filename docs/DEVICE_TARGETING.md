# Device Targeting

## Overview

Device targeting is implemented in two ways:

1. **OS-based (iOS / Android)** — unified shared component on Snapchat, Meta, TikTok, and Google (non-Search).
2. **Device-type (Desktop, Mobile, Tablet, Connected TV)** — used by DV360 and by Google Search (bid adjustments only).

## Unified OS-based component

- **Component:** `components/shared/device-targeting-card.tsx`
- **Constants:** `lib/device-targeting.ts` — `DEVICE_OS_OPTIONS` (iOS, Android).
- **Platforms:** Snapchat, Meta, TikTok, Google (when objective is not Search).
- **Props:** `value: string[]`, `onChange: (ids: string[]) => void`, `accent?: "primary" | "meta"`, `infoTipText?`, `apiBadge?`, `footer?`, `className?`.

### Platform state mapping

| Platform  | State field              | Notes |
|-----------|--------------------------|-------|
| Snapchat  | `audience.deviceOS`      | Same options. |
| Meta      | `audience.operatingSystems` | `apiBadge="user_os"`. |
| TikTok    | `audience.operatingSystems` | Optional `footer` for App Install note. |
| Google    | `audience.operatingSystems` | Shown only when not Search; Search uses Device Bid Adjustments. |

## Where it is not unified

- **Google Search:** Uses "Device Bid Adjustments" (Desktop / Mobile / Tablet with % modifiers), not the OS card.
- **DV360:** Uses "Device Targeting" with four types: Desktop, Mobile, Tablet, Connected TV (different API and UI; remains in `components/dv360/step-audience.tsx`).
