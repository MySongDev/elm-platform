"""预览或恢复本轮源码/配置；保留前两轮未提交改动及报告证据。"""

import base64
import hashlib
import json
import sys
from pathlib import Path

folder = Path(__file__).resolve().parent
root = folder.parents[3]
baseline = json.loads((folder / "stage-baseline.json").read_text(encoding="utf-8"))
changes = json.loads((folder / "changed-files.json").read_text(encoding="utf-8"))
targets = []

for change in changes:
    target = (root / change["file"]).resolve()
    if not target.is_relative_to(root) or not change["file"].startswith("apps/web-admin/"):
        raise SystemExit(f"拒绝仓库范围外路径：{target}")
    current_hash = hashlib.sha256(target.read_bytes()).hexdigest() if target.is_file() else None
    # 防止日后直接运行时覆盖用户的新工作；只接受验收时记录的内容。
    if current_hash != change["final_sha256"]:
        raise SystemExit(f"文件在验收后已变化，未恢复任何内容：{target}")
    targets.append((target, change["file"]))

if "--apply" not in sys.argv:
    for _, name in targets:
        print(name)
    print(f"预览 {len(targets)} 个路径；执行需添加 --apply。")
    raise SystemExit(0)

for target, name in targets:
    original = baseline["files"].get(name)
    if original is not None:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(base64.b64decode(original))
    else:
        target.unlink()
print(f"已恢复到本轮开始时的 {len(targets)} 个源码/配置路径。")
