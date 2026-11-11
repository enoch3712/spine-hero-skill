# Agent notes

This repository holds one agent skill, `spine-hero`, in the open Agent Skills layout:
[skills/spine-hero/SKILL.md](skills/spine-hero/SKILL.md).

- If a task is about animating a 2D game character from one painting on a skeletal rig, read that SKILL.md first. Then read only the reference files it points to.
- The skill content lives only in `skills/spine-hero/`. The plugin manifests (`.claude-plugin/`, `.cursor-plugin/`, `plugin.json`, `.agents/plugins/`) only point at it. Do not copy the content anywhere else.
- Test the gate script with `node --test skills/spine-hero/scripts/gate.test.mjs` (Node 18 or later, no dependencies).
