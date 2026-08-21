#!/usr/bin/env python3
"""app/ 을 파일 하나로 묶습니다. 정적 서버 없이 열거나 링크로 공유할 때 씁니다.

출력
  dist/junbi.html           브라우저로 바로 여는 완성 문서
  dist/junbi.artifact.html  <head>/<body> 를 감싸 주는 환경(Artifact)용 조각

번들러를 설치하지 않으려고 직접 묶습니다. 이 저장소의 모듈은 전부
파일 첫머리의 정적 import 만 쓰고 export 이름이 겹치지 않아 아래 규칙으로 충분합니다.
모듈마다 함수로 감싸 스코프를 유지하므로 이름이 섞이지 않습니다.

실행: python3 tools/build-standalone.py
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, "app")
DIST = os.path.join(ROOT, "dist")

# 의존 순서대로. 마지막이 진입점입니다.
MODULES = [
    "src/icons.js",
    "src/dates.js",
    "src/store.js",
    "src/model.js",
    "src/ui.js",
    "src/toast.js",
    "src/order.js",
    "src/views/onboarding.js",
    "src/views/today.js",
    "src/views/timeline.js",
    "src/views/topics.js",
    "src/views/detail.js",
    "src/views/search.js",
    "src/views/custom.js",
    "src/views/activity.js",
    "src/views/settings.js",
    "src/views/more.js",
    "src/app.js",
]

IMPORT_NS = re.compile(r"^import \* as (\w+) from '([^']+)';$", re.M)
IMPORT_NAMED = re.compile(r"^import \{([^}]+)\} from '([^']+)';$", re.M)
IMPORT_DEFAULT = re.compile(r"^import (\w+) from '([^']+)';$", re.M)
EXPORT_DEFAULT = re.compile(r"^export default ", re.M)
EXPORT_DECL = re.compile(r"^export (async function|function|const|let) (\w+)", re.M)


def resolve(spec, from_path):
    """'./x.js' / '../x.js' 를 MODULES 의 키로 바꿉니다."""
    base = os.path.dirname(from_path)
    return os.path.normpath(os.path.join(base, spec)).replace(os.sep, "/")


def transform(path, src):
    names = [m.group(2) for m in EXPORT_DECL.finditer(src)]
    has_default = bool(EXPORT_DEFAULT.search(src))

    src = IMPORT_NS.sub(lambda m: f"const {m.group(1)} = __req('{resolve(m.group(2), path)}');", src)
    src = IMPORT_NAMED.sub(
        lambda m: "const {%s} = __req('%s');" % (m.group(1).replace(" as ", ": "), resolve(m.group(2), path)),
        src,
    )
    src = IMPORT_DEFAULT.sub(lambda m: f"const {m.group(1)} = __req('{resolve(m.group(2), path)}').default;", src)
    src = EXPORT_DEFAULT.sub("__x.default = ", src)
    src = EXPORT_DECL.sub(lambda m: f"{m.group(1)} {m.group(2)}", src)
    # 묶은 뒤에는 모듈이 아니라 일반 스크립트라 import.meta 는 파싱 단계에서 막힙니다.
    # 이 값을 쓰는 곳은 콘텐츠를 미리 넣어 둔 빌드에서 실행되지 않는 분기뿐입니다.
    src = src.replace("import.meta.url", "location.href")

    tail = "".join(f"\n__x.{n} = {n};" for n in names)
    return f"__mod['{path}'] = function (__x) {{\n{src}{tail}\n}};"


def build():
    tokens = open(os.path.join(ROOT, "design-tokens.css"), encoding="utf-8").read()
    app_css = open(os.path.join(APP, "app.css"), encoding="utf-8").read()
    content = open(os.path.join(APP, "data", "content.json"), encoding="utf-8").read()

    bodies = "\n\n".join(transform(p, open(os.path.join(APP, p), encoding="utf-8").read()) for p in MODULES)

    # </script> 가 데이터 안에 있으면 스크립트가 거기서 끊깁니다.
    safe_content = content.replace("</", "<\\/")

    script = f"""<script>
(function () {{
  'use strict';
  globalThis.__JUNBI_CONTENT__ = {safe_content};

  var __mod = {{}}, __cache = {{}};
  function __req(id) {{
    if (__cache[id]) return __cache[id];
    var x = (__cache[id] = {{}});
    __mod[id](x);
    return x;
  }}

{bodies}

  __req('{MODULES[-1]}');
}})();
</script>"""

    page = f"""<title>임신·출산·육아 체크리스트</title>
<meta name="description" content="임신부터 출산 후 24개월까지 해야 할 일을 시기별로 확인하고 부부가 함께 기록합니다." />
<style>
{tokens}
{app_css}
</style>

<a class="skip" href="#main">본문으로 건너뛰기</a>
<div id="app" aria-busy="true"><p class="boot">불러오는 중입니다.</p></div>

{script}
"""

    doc = f"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#ffffff" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="준비" />
{page.split('<style>')[0]}<style>
{tokens}
{app_css}
</style>
</head>
<body>
<a class="skip" href="#main">본문으로 건너뛰기</a>
<div id="app" aria-busy="true"><p class="boot">불러오는 중입니다.</p></div>
{script}
</body>
</html>
"""

    os.makedirs(DIST, exist_ok=True)
    for name, text in [("junbi.html", doc), ("junbi.artifact.html", page)]:
        out = os.path.join(DIST, name)
        with open(out, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"{out}  {len(text.encode('utf-8')) / 1024:.0f} KB")


if __name__ == "__main__":
    build()
