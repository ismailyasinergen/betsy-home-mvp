from pathlib import Path
import re

ROOT = Path("src")

for path in ROOT.rglob("*.tsx"):
    s = path.read_text(encoding="utf-8")
    original = s

    # Undo the broken automated cast that caused syntax errors:
    # {[
    #   ...
    # ] as any[]).map(...)
    s = s.replace("] as any[]).map(", "].map(")

    # Undo broken assigned arrays like: const cards = ([ ... ];
    s = s.replace("= ([", "= [")
    s = s.replace("{([", "{[")

    # JSX values cannot be React keys.
    s = s.replace("key={value}", "key={String(label)}")
    s = s.replace("key={label}", "key={String(label)}")
    s = s.replace("key={`${value}`}", "key={String(label)}")
    s = s.replace("key={metric[1]}", "key={String(metric[0])}")
    s = s.replace("key={`${metric[1]}`}", "key={String(metric[0])}")
    s = s.replace("key={stat.value}", "key={String(stat.label)}")
    s = s.replace("key={`${stat.value}`}", "key={String(stat.label)}")

    # Make local stat/card prop types accept JSX values such as <CurrencyPrice />.
    s = re.sub(r"(\bvalue\s*\??\s*:\s*)string\b", r"\1any", s)
    s = re.sub(r"(\bhelper\s*\??\s*:\s*)string\b", r"\1any", s)
    s = re.sub(r"(\bdescription\s*\??\s*:\s*)string\b", r"\1any", s)

    # Remove duplicate ReactNode imports if previous script added them repeatedly.
    s = re.sub(
        r'(import type \{ ReactNode \} from "react";\n)+',
        'import type { ReactNode } from "react";\n',
        s
    )

    if s != original:
        path.write_text(s, encoding="utf-8")
        print("repaired", path)

print("repair complete")
