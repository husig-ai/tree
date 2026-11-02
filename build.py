#!/usr/bin/env python3
"""Build the Rukh site: src/pages + src/partials + src/svg -> docs/*.html (static, no dependencies)."""
import hashlib, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC, OUT = os.path.join(HERE, "src"), os.path.join(HERE, "docs")
read = lambda *p: open(os.path.join(*p), encoding="utf8").read()

SPECIES = [("Dalbergia sissoo", "Indian rosewood"), ("Bombax ceiba", "Simal"), ("Acacia catechu", "Khair"), ("Pinus roxburghii", "Chir pine"), ("Phyllanthus emblica", "Amla"), ("Choerospondias axillaris", "Lapsi")]
SITES = ["Bardiya", "Nawalparasi", "Chitwan"]
STATUS = ["Alive at 3-month check", "Alive at 3-month check", "Awaiting 3-month check", "Alive at 12-month check", "Replaced after 3-month check"]


def tree_id(n):
    return f"RK-NP-{n:06d}"


def treegrid(n, svg):
    return "\n".join(f'<a class="treetile" href="tree.html">{svg}<span>{tree_id(100 + i)}</span><br><span class="muted">{SPECIES[i % 6][1]}</span></a>' for i in range(n))


def register(n):
    rows = []
    for i in range(n):
        sp, site, st = SPECIES[i % 6], SITES[i % 3], STATUS[i % 5]
        planted = f"2026-0{6 + i % 3}-{10 + (i * 3) % 18:02d}"
        rows.append(f'<tr><td><a href="tree.html">{tree_id(100 + i)}</a></td><td>{sp[1]} <span class="muted">({sp[0]})</span></td><td>{site}</td><td>{planted}</td><td>{st}</td></tr>')
    return "\n".join(rows)


def render(slug, body, meta, parts, svgs):
    cur = lambda m: ' aria-current="page"' if m.group(1) == slug else ""
    out = parts["head"] + parts["header"] + body + parts["footer"]
    out = out.replace("{{title}}", meta["title"]).replace("{{desc}}", meta["desc"])
    out = re.sub(r"\{\{cur:(\w+)\}\}", cur, out)
    out = out.replace("{{aud:ind}}", "false" if slug == "business" else "true").replace("{{aud:biz}}", "true" if slug == "business" else "false")
    out = re.sub(r"\{\{svg:(\w+)\}\}", lambda m: svgs[m.group(1)], out)
    out = re.sub(r"\{\{treegrid:(\d+)\}\}", lambda m: treegrid(int(m.group(1)), svgs["tree"]), out)
    out = re.sub(r"\{\{register:(\d+)\}\}", lambda m: register(int(m.group(1))), out)
    return out


def versioned(html):
    """Add ?v=<content hash> to the stylesheet and script URLs, so a cached old copy is never served with new pages."""
    for name in ("assets/style.css", "assets/app.js"):
        digest = hashlib.sha1(open(os.path.join(OUT, name), "rb").read()).hexdigest()[:8]
        html = html.replace(f'"{name}"', f'"{name}?v={digest}"')
    return html


def main():
    parts = {k: read(SRC, "partials", f"{k}.html") for k in ("head", "header", "footer")}
    svgs = {f[:-4]: read(SRC, "svg", f).strip() for f in os.listdir(os.path.join(SRC, "svg")) if f.endswith(".svg")}
    pages = sorted(f for f in os.listdir(os.path.join(SRC, "pages")) if f.endswith(".html"))
    for f in pages:
        raw = read(SRC, "pages", f)
        m = re.match(r"<!--\s*title:\s*(.+?)\s*\|\s*desc:\s*(.+?)\s*-->\n", raw)
        if not m:
            sys.exit(f"{f}: first line must be <!-- title: X | desc: Y -->")
        html = render(f[:-5], raw[m.end():], {"title": m.group(1), "desc": m.group(2)}, parts, svgs)
        if chr(8212) in html or chr(8211) in html:
            sys.exit(f"{f}: em or en dash found (house style)")
        if re.search(r"\{\{\w", html):
            sys.exit(f"{f}: unresolved placeholder")
        open(os.path.join(OUT, f), "w", encoding="utf8").write(versioned(html))
    open(os.path.join(OUT, ".nojekyll"), "w").write("")
    open(os.path.join(OUT, "robots.txt"), "w").write("User-agent: *\nDisallow: /\n")
    print(f"built {len(pages)} pages into {os.path.relpath(OUT)}")


if __name__ == "__main__":
    main()
