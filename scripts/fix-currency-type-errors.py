from pathlib import Path
import re

ROOT = Path("src")

def insert_import(s: str, import_line: str) -> str:
    if import_line in s:
        return s

    lines = s.splitlines()
    insert_at = 0

    # Keep "use client" or "use server" as the first statement.
    if lines and lines[0].strip() in ['"use client";', "'use client';", '"use server";', "'use server';"]:
        insert_at = 1
        while insert_at < len(lines) and lines[insert_at].strip() == "":
            insert_at += 1

    lines.insert(insert_at, import_line)
    return "\n".join(lines) + "\n"

def patch_tsx_file(path: Path) -> bool:
    s = path.read_text(encoding="utf-8")
    original = s

    # Any page/component that uses JSX as a prop value needs ReactNode-compatible props.
    needs_react_node = (
        "<CurrencyPrice" in s
        or "value={<" in s
        or "helper={<" in s
        or "ReactNode" in s
    )

    if needs_react_node:
        s = insert_import(s, 'import type { ReactNode } from "react";')

        # Widen common card/stat prop types from string to ReactNode.
        s = re.sub(r'(\bvalue\s*\??\s*:\s*)string\b', r'\1ReactNode', s)
        s = re.sub(r'(\bhelper\s*\??\s*:\s*)string\b', r'\1ReactNode', s)
        s = re.sub(r'(\bdescription\s*\??\s*:\s*)string\b', r'\1ReactNode', s)

    # JSX elements cannot be React keys. Prefer stable labels/ids.
    s = s.replace("key={value}", "key={String(label)}")
    s = s.replace("key={`${value}`}", "key={String(label)}")
    s = s.replace("key={metric[1]}", "key={String(metric[0])}")
    s = s.replace("key={`${metric[1]}`}", "key={String(metric[0])}")
    s = s.replace("key={stat.value}", "key={String(stat.label)}")
    s = s.replace("key={`${stat.value}`}", "key={String(stat.label)}")

    # If arrays now contain JSX values, avoid narrow tuple inference problems.
    s = re.sub(
        r'(const\s+(?:stats|metrics|cards|items|summaryCards)\s*=\s*)\[',
        r'\1([',
        s
    )
    s = re.sub(
        r'(\n\s*\]\s*\.map\()',
        r'\n  ] as any[]).map(',
        s
    )

    # Clean accidental duplicate ReactNode imports.
    s = re.sub(
        r'(import type \{ ReactNode \} from "react";\n)+',
        'import type { ReactNode } from "react";\n',
        s
    )

    if s != original:
        path.write_text(s, encoding="utf-8")
        return True

    return False

changed = []

for path in ROOT.rglob("*.tsx"):
    if patch_tsx_file(path):
        changed.append(str(path))

print("Patched files:")
for item in changed:
    print(" -", item)

if not changed:
    print("No TSX files needed patching.")
