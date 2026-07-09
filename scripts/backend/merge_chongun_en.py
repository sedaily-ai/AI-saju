"""
영어 총운 캐시 병합
- scripts/saju-cache-local/chongun_en/*.json (1440개 개별 파일) 을
  단일 파일 frontend/public/saju-cache/chongun-en.json 으로 병합
- 키 구조는 한글 chongun.json 과 동일: {ilgan_ilji_wolji} -> {NT,NF,ST,SF} -> text
- 파일명 stem 이 그대로 키가 됨 (예: 丁_丑_丑.json -> "丁_丑_丑")
"""
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
SRC_DIR = Path(__file__).parent / 'saju-cache-local' / 'chongun_en'
OUT_FILE = ROOT / 'frontend' / 'public' / 'saju-cache' / 'chongun-en.json'
KO_FILE = ROOT / 'frontend' / 'public' / 'saju-cache' / 'chongun.json'

EXPECTED_GROUPS = {'NT', 'NF', 'ST', 'SF'}


def main():
    files = sorted(SRC_DIR.glob('*.json'))
    if not files:
        raise SystemExit(f'영어 캐시 파일 없음: {SRC_DIR}')

    merged = {}
    for f in files:
        with open(f, 'r', encoding='utf-8') as fp:
            data = json.load(fp)
        groups = set(data.keys())
        if not EXPECTED_GROUPS.issubset(groups):
            print(f'[WARN] {f.name}: 그룹 누락 {EXPECTED_GROUPS - groups}')
        merged[f.stem] = data

    # 한글 캐시와 키 집합 일치 검증
    with open(KO_FILE, 'r', encoding='utf-8') as fp:
        ko_keys = set(json.load(fp).keys())
    en_keys = set(merged.keys())
    if en_keys != ko_keys:
        only_ko = ko_keys - en_keys
        only_en = en_keys - ko_keys
        print(f'[WARN] 키 불일치 — ko전용 {len(only_ko)}, en전용 {len(only_en)}')
        if only_ko:
            print(f'  ko전용 샘플: {list(only_ko)[:5]}')
        if only_en:
            print(f'  en전용 샘플: {list(only_en)[:5]}')

    with open(OUT_FILE, 'w', encoding='utf-8') as fp:
        json.dump(merged, fp, ensure_ascii=False, indent=2)

    size_mb = OUT_FILE.stat().st_size / 1024 / 1024
    print(f'=== 병합 완료: {len(merged)}개 키 → {OUT_FILE} ({size_mb:.1f}MB) ===')


if __name__ == '__main__':
    main()