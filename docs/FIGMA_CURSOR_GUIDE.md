# Using the Figma Plugin with Cursor

Quick guide to test and work on a Figma component from this project.

---

## 1. Connect Figma to Cursor

- **Figma MCP** must be enabled in Cursor (it’s the “Figma plugin” for Cursor).
- First time: Cursor may ask you to **authenticate** the Figma MCP (e.g. open a link and log in to Figma). Do that when prompted so tools can run.

---

## 2. Give Cursor Something to Work On

Use **one** of these:

### Option A: Share a Figma link (easiest)

1. In Figma, select the **frame or component** you want.
2. Right‑click → **Copy link to selection** (or copy the URL from the browser so it includes the selected node).
3. The URL should look like:
   ```text
   https://www.figma.com/design/FILE_KEY/File%20Name?node-id=123-456
   ```
4. Paste that link in the Cursor chat.

### Option B: Use Figma desktop + selection

1. Open the **Figma desktop app** (not only the browser).
2. Open your file and **select the component/frame** you want.
3. In Cursor, say what you want (e.g. “Implement this component” or “Connect this to code”) **without** pasting a URL.  
   The Figma desktop MCP uses the current selection.

---

## 3. What You Can Ask For

| Goal | What to say in Cursor |
|------|------------------------|
| **Implement** the design in code (new or updated component) | “Implement this component from Figma” or “Build this [button/card] to match the design” and paste the Figma URL (or use desktop selection). |
| **Connect** an existing code component to a Figma component (Code Connect) | “Connect this Figma component to my code” or “Map this design to my Button component” and paste the URL (or use desktop selection). |

---

## 4. Try It With One Component

1. In Figma: pick one component (e.g. a button or card).
2. Copy link to selection (or select it in Figma desktop).
3. In Cursor, say for example:
   - **Implement:** “Implement this Figma component: [paste URL]”
   - **Connect:** “Connect this Figma component to my code: [paste URL]”
4. I’ll use the Figma plugin to read the design and either generate/update code or set up the Code Connect mapping.

---

## 5. Notes

- **Implement:** I’ll use layout, typography, colors, and assets from Figma and align with your existing components (e.g. in `src/components` or your UI library).
- **Code Connect:** Only works for components **published to a team library** and may require a Figma Org/Enterprise plan.
- If the Figma MCP says it needs authentication, complete the auth step in Cursor when prompted, then retry.

---

**Next step:** Pick a component in Figma, copy its link (or select it in the desktop app), and tell me either “implement this component” or “connect this to code” with the link. I’ll use the Figma plugin and guide you through the result.
