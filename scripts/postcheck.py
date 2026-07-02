#!/usr/bin/env python3
"""記事検品スクリプト (postcheck)

使い方:
    python3 scripts/postcheck.py           # 全記事を検品
    python3 scripts/postcheck.py <slug>    # 指定記事のみ検品

検査項目:
  1. frontmatter必須項目 (title/description/pubDate/category/tags) と
     categoryが固定7種のいずれかであること [ERROR]
  2. heroImage: public配下に実ファイルが存在すること [不在=ERROR]。
     寸法が1200x675であること [違い=WARN]。heroImage無し自体は [WARN]
  3. プレースホルダー「【ここに」「挿入】」が本文に残っていないこと [ERROR]
  4. アフィリエイト定型文の直上の非空行が `---` であること [ERROR]。
     定型文が無い記事は [WARN]（初期記事4本は意図的に無い）
  5. 本文中のローカル画像参照 (/images/...) が public/images/ に実在すること [ERROR]
  6. 出現1回のタグ（その記事でしか使われていない）を「新規タグ・要確認」[WARN]
  7. Markdown表の数 [INFO]

ERRORが1件以上あれば exit code 1。
"""

import re
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    Image = None

ROOT = Path(__file__).resolve().parent.parent
BLOG_DIR = ROOT / "src" / "content" / "blog"
PUBLIC_DIR = ROOT / "public"

CATEGORIES = [
    "グルメ",
    "旅行・おでかけ",
    "子育て・日常",
    "ゲーム・エンタメ",
    "ガジェット・テクノロジー",
    "お金・投資",
    "健康・ランニング",
]

REQUIRED_KEYS = ["title", "description", "pubDate", "category", "tags"]
AFFILIATE_MARKER = "このブログの商品リンクから飛んで"
PLACEHOLDERS = ["【ここに", "挿入】"]
HERO_W, HERO_H = 1200, 675


def parse_frontmatter(text):
    """frontmatter(dict)と本文(str)を返す。frontmatterが無ければ({}, 全文)。"""
    m = re.match(r"\A---\s*\n(.*?)\n---\s*\n(.*)\Z", text, re.DOTALL)
    if not m:
        return {}, text
    fm_text, body = m.group(1), m.group(2)
    fm = {}
    for line in fm_text.splitlines():
        km = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$", line)
        if km:
            fm[km.group(1)] = km.group(2).strip()
    return fm, body


def strip_quotes(value):
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
        return value[1:-1]
    return value


def parse_tags(value):
    """tags: ['a', 'b'] 形式からタグのリストを取り出す。"""
    if not value:
        return []
    return [strip_quotes(t) for t in re.findall(r"""['"]([^'"]+)['"]""", value)]


def find_local_images(body):
    """本文中のローカル画像参照(/images/...)を抽出。外部URL内は対象外。

    対象: "/images/..."（引用符付き属性）と ](/images/...)（Markdownリンク/画像）。
    先頭が / で始まるパスのみ拾うため、https://.../images/... は掛からない。
    """
    refs = set()
    refs.update(re.findall(r'"(/images/[^"]+)"', body))
    refs.update(re.findall(r"'(/images/[^']+)'", body))
    refs.update(re.findall(r"\]\((/images/[^)\s]+)", body))
    return sorted(refs)


def count_tables(body):
    """Markdown表の数（`|`で始まる行の連続ブロックのうち区切り行を含むもの）。"""
    count = 0
    in_block = False
    block_lines = []
    for line in body.splitlines() + [""]:
        if line.lstrip().startswith("|"):
            in_block = True
            block_lines.append(line)
        else:
            if in_block:
                if any(re.match(r"^\s*\|?[\s:|-]+\|[\s:|-]*$", l) and "-" in l
                       for l in block_lines):
                    count += 1
                in_block = False
                block_lines = []
    return count


def check_article(path, tag_counts):
    """1記事を検査し、(errors, warns, infos) を返す。"""
    errors, warns, infos = [], [], []
    text = path.read_text(encoding="utf-8")
    fm, body = parse_frontmatter(text)

    # 1. frontmatter必須項目とカテゴリ
    if not fm:
        errors.append("frontmatterが見つからない")
    else:
        for key in REQUIRED_KEYS:
            if key not in fm or not fm[key]:
                errors.append(f"frontmatterに {key} が無い")
        if fm.get("category"):
            cat = strip_quotes(fm["category"])
            if cat not in CATEGORIES:
                errors.append(f"category「{cat}」は固定7種に無い")

    # 2. heroImage
    hero = strip_quotes(fm.get("heroImage", ""))
    if not hero:
        warns.append("heroImage の指定が無い")
    else:
        hero_path = PUBLIC_DIR / hero.lstrip("/")
        if not hero_path.is_file():
            errors.append(f"heroImage の実ファイルが無い: {hero}")
        elif Image is not None:
            try:
                with Image.open(hero_path) as img:
                    w, h = img.size
                if (w, h) != (HERO_W, HERO_H):
                    warns.append(
                        f"heroImage 寸法が {w}x{h}（推奨 {HERO_W}x{HERO_H}）: {hero}")
            except Exception as e:
                warns.append(f"heroImage を画像として開けない: {hero} ({e})")
        else:
            warns.append("Pillow未導入のため heroImage 寸法は未検査")

    # 3. プレースホルダー残り
    for ph in PLACEHOLDERS:
        if ph in body:
            errors.append(f"プレースホルダー「{ph}」が本文に残っている")

    # 4. アフィリエイト定型文の直上に `---`
    lines = body.splitlines()
    marker_idxs = [i for i, l in enumerate(lines) if AFFILIATE_MARKER in l]
    if not marker_idxs:
        warns.append("アフィリエイト定型文が無い（初期記事なら意図的）")
    else:
        for idx in marker_idxs:
            prev = None
            for j in range(idx - 1, -1, -1):
                if lines[j].strip():
                    prev = lines[j].strip()
                    break
            if prev != "---":
                errors.append(
                    f"定型文(本文{idx + 1}行目)の直上の非空行が `---` でない: {prev!r}")

    # 5. ローカル画像参照の実在
    for ref in find_local_images(body):
        img_path = PUBLIC_DIR / ref.lstrip("/").split("#")[0].split("?")[0]
        if not img_path.is_file():
            errors.append(f"本文の画像が public に無い: {ref}")

    # 6. 新規タグ（全記事で出現1回）
    tags = parse_tags(fm.get("tags", ""))
    lonely = [t for t in tags if tag_counts.get(t, 0) == 1]
    if lonely:
        warns.append("新規タグ・要確認（この記事のみで使用）: " + ", ".join(lonely))

    # 7. Markdown表の数
    n_tables = count_tables(body)
    if n_tables:
        infos.append(f"Markdown表 {n_tables} 個")

    return errors, warns, infos


def main():
    if Image is None:
        print("[警告] Pillowが見つかりません。heroImage寸法検査はスキップします。")

    all_paths = sorted(BLOG_DIR.glob("*.md")) + sorted(BLOG_DIR.glob("*.mdx"))
    if not all_paths:
        print(f"記事が見つかりません: {BLOG_DIR}")
        sys.exit(1)

    # タグ集計は常に全記事で行う（単一記事検品時も母集団は全記事）
    tag_counts = {}
    for p in all_paths:
        fm, _ = parse_frontmatter(p.read_text(encoding="utf-8"))
        for t in parse_tags(fm.get("tags", "")):
            tag_counts[t] = tag_counts.get(t, 0) + 1

    if len(sys.argv) > 1:
        slug = sys.argv[1]
        slug = re.sub(r"\.mdx?$", "", slug)
        targets = [p for p in all_paths if p.stem == slug]
        if not targets:
            print(f"記事が見つかりません: {slug}")
            sys.exit(1)
    else:
        targets = all_paths

    total_err = total_warn = 0
    n_ok = 0
    for p in targets:
        errors, warns, infos = check_article(p, tag_counts)
        total_err += len(errors)
        total_warn += len(warns)
        if errors:
            status = "ERROR"
        elif warns:
            status = "WARN "
        else:
            status = "OK   "
            n_ok += 1
        print(f"[{status}] {p.stem}")
        for msg in errors:
            print(f"    ERROR: {msg}")
        for msg in warns:
            print(f"    WARN : {msg}")
        for msg in infos:
            print(f"    INFO : {msg}")

    print()
    print("=" * 60)
    print(f"検品結果: {len(targets)}記事 / OK {n_ok} / "
          f"ERROR {total_err}件 / WARN {total_warn}件")
    if total_err:
        print("ERRORがあります。修正してください。")
        sys.exit(1)
    print("ERROR 0件。検品合格です。")
    sys.exit(0)


if __name__ == "__main__":
    main()
