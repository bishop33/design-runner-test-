// 화면에 머무는 동안 목록 순서를 고정합니다.
//
// 우선순위 정렬은 상태가 바뀔 때마다 결과가 달라집니다. 그대로 두면
// 하나를 완료할 때마다 목록이 다시 늘어서서, 두 번째 탭이 엉뚱한 줄에 떨어집니다.
// 그래서 화면에 들어온 순간의 순서를 잠그고, 완료한 항목도 자리에 남겨 둡니다.
// 화면을 떠났다 돌아오면 잠금이 풀려 새로 정렬됩니다.

const locks = new Map();

/** 경로가 바뀌면 전부 풉니다. 같은 화면에 머무는 동안에는 유지됩니다. */
export function release() {
  locks.clear();
}

/**
 * @param key     화면 안에서 목록을 구분하는 이름
 * @param compute 잠기지 않았을 때 목록을 만드는 함수
 * @param byId    id → 항목
 */
export function frozen(key, compute, byId) {
  if (!locks.has(key)) {
    const items = compute();
    locks.set(key, items.map((i) => i.id));
    return items;
  }
  return locks
    .get(key)
    .map((id) => byId[id])
    .filter(Boolean);
}
