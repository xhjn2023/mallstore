"""Generate 8 category-specific icon CSS rules (ic-cat-*).
   Uses percent-encoding (urllib.parse.quote) for WXSS compatibility.
"""
import urllib.parse

ICONS = {
    "cat-phone": (
        "手机数码",
        '<rect x="7" y="4" width="10" height="16" rx="2" ry="2"/><line x1="11" y1="17" x2="13" y2="17"/><path d="M11 2h2"/>',
    ),
    "cat-laptop": (
        "电脑办公",
        '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M2 17h20l-1.5 3h-17L2 17z"/>',
    ),
    "cat-appliance": (
        "家用电器",
        '<path d="M9 2h6v4H9zM12 6v14"/><path d="M8 20h8"/><circle cx="12" cy="19" r="1"/>',
    ),
    "cat-bag": (
        "服饰鞋包",
        '<path d="M6 8h12a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2z"/><path d="M9 8V6a3 3 0 116 0v2"/>',
    ),
    "cat-beauty": (
        "美妆个护",
        '<circle cx="12" cy="8" r="4"/><path d="M12 12v6"/><path d="M8 18c0-2.2 1.8-4 4-4s4 1.8 4 4"/>',
    ),
    "cat-food": (
        "食品生鲜",
        '<path d="M12 21s-7-4.5-7-11a7 7 0 0114 0c0 6.5-7 11-7 11z"/><path d="M12 10c-.5-2-2-3-2-5a2 2 0 114 0c0 2-1.5 3-2 5z"/>',
    ),
    "cat-home": (
        "家居家装",
        '<path d="M3 12l9-9 9 9"/><path d="M5 10v10a1 1 0 001 1h4V15h4v6h4a1 1 0 001-1V10"/><polyline points="9,22 9,16 15,16 15,22"/>',
    ),
    "cat-sports": (
        "运动户外",
        '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 000 20"/><path d="M12 2a14.5 14.5 0 010 20"/><path d="M2 12h20"/><path d="M12 2c3 3 4.5 6.5 4.5 10S15 19 12 22"/><path d="M12 2C9 5 7.5 8.5 7.5 12S9 19 12 22"/>',
    ),
}


def svg_to_percent_uri(d: str) -> str:
    svg = (
        f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' "
        f"fill='none' stroke='%23111111' stroke-width='1.8' "
        f"stroke-linecap='round' stroke-linejoin='round'>{d}</svg>"
    )
    encoded = urllib.parse.quote(svg, safe='')
    return f'url("data:image/svg+xml,{encoded}")'


lines = ["/* ===== Category-specific icons (generated) ===== */"]
for cls_name, (label, paths) in ICONS.items():
    uri = svg_to_percent_uri(paths)
    lines.append(f".ic-{cls_name} {{ background-image: {uri}; }}")

block = "\n".join(lines)
print(block)
