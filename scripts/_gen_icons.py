H = "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23111111' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E"
F = "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23111111' stroke='%23111111' stroke-width='1.8' stroke-linejoin='round'%3E"
G = "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23dddddd' stroke-width='1.8' stroke-linejoin='round'%3E"
W = "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E"
END = "%3C/svg%3E"

def enc(inner, head=H):
    return "url(\"data:image/svg+xml," + head + inner + END + "\")"

icons = {
 'ic-search': "%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='M21 21l-4.3-4.3'/%3E",
 'ic-box': "%3Cpath d='M21 8l-9-5-9 5v8l9 5 9-5z'/%3E%3Cpath d='M3 8l9 5 9-5'/%3E%3Cpath d='M12 13v8'/%3E",
 'ic-cart': "%3Ccircle cx='9' cy='20' r='1.5'/%3E%3Ccircle cx='18' cy='20' r='1.5'/%3E%3Cpath d='M2 3h2.5l2.2 12.6a1.5 1.5 0 0 0 1.5 1.2h9.6a1.5 1.5 0 0 0 1.5-1.2L21 7H6'/%3E",
 'ic-chat': "%3Cpath d='M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z'/%3E",
 'ic-heart': "%3Cpath d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'/%3E",
 'ic-heart-fill': "%3Cpath d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'/%3E",
 'ic-ticket': "%3Cpath d='M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z'/%3E",
 'ic-location': "%3Cpath d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'/%3E%3Ccircle cx='12' cy='10' r='3'/%3E",
 'ic-phone': "%3Cpath d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z'/%3E",
 'ic-settings': "%3Ccircle cx='12' cy='12' r='3'/%3E%3Cpath d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'/%3E",
 'ic-logout': "%3Cpath d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'/%3E%3Cpath d='M16 17l5-5-5-5'/%3E%3Cpath d='M21 12H9'/%3E",
 'ic-doc': "%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/%3E%3Cpath d='M14 2v6h6'/%3E%3Cpath d='M16 13H8'/%3E%3Cpath d='M16 17H8'/%3E%3Cpath d='M10 9H8'/%3E",
 'ic-pay': "%3Crect x='2' y='5' width='20' height='14' rx='2'/%3E%3Cline x1='2' y1='10' x2='22' y2='10'/%3E",
 'ic-truck': "%3Crect x='1' y='3' width='15' height='13' rx='2'/%3E%3Cpath d='M16 8h4l3 3v5h-7V8z'/%3E%3Ccircle cx='5.5' cy='18.5' r='2'/%3E%3Ccircle cx='18.5' cy='18.5' r='2'/%3E",
 'ic-check-circle': "%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath d='M8.5 12.5l2.5 2.5 4.5-5'/%3E",
 'ic-refund': "%3Cpath d='M3 12a9 9 0 1 0 3-6.7L3 8'/%3E%3Cpath d='M3 3v5h5'/%3E",
 'ic-close': "%3Cpath d='M18 6L6 18'/%3E%3Cpath d='M6 6l12 12'/%3E",
 'ic-check': "%3Cpath d='M5 13l4 4L19 7'/%3E",
 'ic-star': "%3Cpath d='M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 17.3 5.8 20.9l1.6-6.8L2.2 8.9l6.9-.6z'/%3E",
 'ic-star-on': "%3Cpath d='M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 17.3 5.8 20.9l1.6-6.8L2.2 8.9l6.9-.6z'/%3E",
 'ic-star-off': "%3Cpath d='M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 17.3 5.8 20.9l1.6-6.8L2.2 8.9l6.9-.6z'/%3E",
 'ic-edit': "%3Cpath d='M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'/%3E",
 'ic-trash': "%3Cpath d='M3 6h18'/%3E%3Cpath d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'/%3E%3Cline x1='10' y1='11' x2='10' y2='17'/%3E%3Cline x1='14' y1='11' x2='14' y2='17'/%3E",
 'ic-tool': "%3Cpath d='M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.1 2.1-2.4-.6-.6-2.4 2.1-2.1z'/%3E",
 'ic-fire': "%3Cpath d='M12 23a7 7 0 0 0 7-7c0-3-2-5.5-3.5-7.5C14 6 13 4 13 2c-1.5 1.5-3 3.5-3 6.5 0 1-.7 1.7-1.5 2C7 12 5 13.8 5 16a7 7 0 0 0 7 7z'/%3E",
 'ic-clock': "%3Ccircle cx='12' cy='12' r='9'/%3E%3Cpath d='M12 7v5l3 2'/%3E",
 'ic-check-white': "%3Cpath d='M5 13l4 4L19 7'/%3E",
 'ic-close-white': "%3Cpath d='M18 6L6 18'/%3E%3Cpath d='M6 6l12 12'/%3E",
}
heads = {'ic-heart-fill': F, 'ic-star-on': F, 'ic-star-off': G, 'ic-check-white': W, 'ic-close-white': W}

lines = []
lines.append("")
lines.append("/* =========================================================")
lines.append("   统一图标系统 - 线性 - 24x24 - stroke 1.8 - 圆角端点")
lines.append("   与底部 TabBar 完全同构：近黑 #111 描边 / 圆角 linecap-join。")
lines.append("   所有页面共用同一套，保证风格 / 线宽 / 圆角 / 配色一致。")
lines.append("   用法：<view class=\"ic ic-xxx [原包裹类]\"></view>")
lines.append("   空状态图标复用同套，仅靠外层 .empty-icon 的 opacity 弱化。")
lines.append("   ========================================================= */")
lines.append(".ic {")
lines.append("  display: inline-block;")
lines.append("  background-repeat: no-repeat;")
lines.append("  background-position: center;")
lines.append("  background-size: contain;")
lines.append("  flex: none;")
lines.append("  width: 48rpx;")
lines.append("  height: 48rpx;")
lines.append("}")
for name, inner in icons.items():
    uri = enc(inner, heads.get(name, H))
    lines.append(".%s { background-image: %s; }" % (name, uri))

block = "\n".join(lines) + "\n"
path = "app.wxss"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()
if '.ic-search' in content:
    print("ALREADY PRESENT - skip")
else:
    with open(path, 'a', encoding='utf-8') as f:
        f.write(block)
    print("APPENDED", len(lines), "lines")
print(block.splitlines()[8])
print(block.splitlines()[-3])
