"""
오늘의 운세 영어 캐시 생성
- 입력: frontend/public/saju-cache/today-parts.json (한글)
- 출력: frontend/public/saju-cache/today-parts-en.json (영어)
- 전략: JSON 구조/키는 그대로 두고 leaf 문자열 값만 영어로 번역
  (ss/us/category 의 십성·12운성 키는 한글 유지 — 프런트가 한글 키로 룩업)
- 번역 캐시(_today_parts_en_cache.json)로 resumable — 중단 후 재실행 시 이어서 진행

NOTE: 모델은 기존 generate_*.py 와 동일하게 sonnet 사용 (해당 AWS 계정에서 검증된 모델 ID).
"""
import json
import boto3
import concurrent.futures
from pathlib import Path
from botocore.config import Config
from threading import Lock

# saju-sonnet-4 application inference profile (Sonnet 4) — Bedrock 비용 태깅 Service=SAJU. docs/bedrock-saju-tagging.md
BEDROCK_MODEL = 'arn:aws:bedrock:us-east-1:887078546492:application-inference-profile/cybevkpbbz32'
BEDROCK_REGION = 'us-east-1'

ROOT = Path(__file__).parent.parent.parent
IN_FILE = ROOT / 'frontend' / 'public' / 'saju-cache' / 'today-parts.json'
OUT_FILE = ROOT / 'frontend' / 'public' / 'saju-cache' / 'today-parts-en.json'
CACHE_FILE = Path(__file__).parent / 'saju-cache-local' / '_today_parts_en_cache.json'

# 사주 용어집 — frontend sajuGlossary.ts 의 영어 명칭과 일치시킬 것
GLOSSARY = """Ten Gods (십성): 비견 Peer, 겁재 Rob Wealth, 식신 Eating God, 상관 Hurting Officer,
편재 Indirect Wealth, 정재 Direct Wealth, 편관 Indirect Officer, 정관 Direct Officer,
편인 Indirect Resource, 정인 Direct Resource.
Twelve Life Stages (12운성): 장생 Birth, 목욕 Bath, 관대 Coronation, 건록 Prosperity,
제왕 Emperor, 쇠 Decline, 병 Illness, 사 Death, 묘 Burial, 절 Void, 태 Conception, 양 Nurturing."""

SYSTEM_PROMPT = f"""You are a professional Korean-to-English translator specializing in Korean Saju (사주, Four Pillars astrology) fortune-telling content.

Translate the given Korean fortune text into natural, fluent English for an English-speaking reader.

Rules:
- Produce idiomatic English, not a literal word-for-word translation. It should read as if originally written in English.
- Preserve markdown structure exactly: **bold**, numbered lists (1) 2) 3)), line breaks.
- Keep the same number of sentences and the same advice/tips. Do not add or drop content.
- Use this fixed glossary for Saju domain terms when they appear:
{GLOSSARY}
- Output ONLY the translated English text. No preamble, no quotes, no explanation.
"""

progress_lock = Lock()


def get_bedrock_client():
    return boto3.client(
        'bedrock-runtime',
        region_name=BEDROCK_REGION,
        config=Config(read_timeout=120, connect_timeout=30, retries={'max_attempts': 3}),
    )


def translate(client, text: str) -> str:
    request_body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1500,
        "system": [{"type": "text", "text": SYSTEM_PROMPT}],
        "messages": [{"role": "user", "content": text}],
    })
    response = client.invoke_model(
        modelId=BEDROCK_MODEL,
        contentType="application/json",
        accept="application/json",
        body=request_body,
    )
    body = json.loads(response['body'].read())
    return body.get('content', [{}])[0].get('text', '').strip()


def collect_strings(node, acc: set):
    """JSON 트리에서 모든 leaf 문자열(값)을 수집"""
    if isinstance(node, str):
        if node.strip():
            acc.add(node)
    elif isinstance(node, list):
        for x in node:
            collect_strings(x, acc)
    elif isinstance(node, dict):
        for v in node.values():
            collect_strings(v, acc)


def rebuild(node, cache: dict):
    """JSON 트리를 복사하며 leaf 문자열을 번역본으로 치환 (키는 그대로)"""
    if isinstance(node, str):
        if not node.strip():
            return node
        return cache.get(node, node)
    if isinstance(node, list):
        return [rebuild(x, cache) for x in node]
    if isinstance(node, dict):
        return {k: rebuild(v, cache) for k, v in node.items()}
    return node


def process(text: str):
    client = get_bedrock_client()
    try:
        return (text, translate(client, text))
    except Exception as e:
        print(f'[ERROR] {text[:40]}... : {e}', flush=True)
        return (text, None)


def main():
    with open(IN_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    all_strings = set()
    collect_strings(data, all_strings)
    print(f'총 leaf 문자열: {len(all_strings)}개', flush=True)

    # 번역 캐시 로드
    cache = {}
    if CACHE_FILE.exists():
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            cache = json.load(f)
    todo = sorted(s for s in all_strings if s not in cache)
    print(f'완료 {len(cache)} / 남음 {len(todo)}', flush=True)

    if todo:
        count = [len(cache)]
        save_lock = Lock()
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = {executor.submit(process, s): s for s in todo}
            for future in concurrent.futures.as_completed(futures):
                src, en = future.result()
                if en is None:
                    continue
                with save_lock:
                    cache[src] = en
                    count[0] += 1
                    if count[0] % 25 == 0:
                        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
                            json.dump(cache, f, ensure_ascii=False, indent=2)
                        print(f'[{count[0]}/{len(all_strings)}] 저장', flush=True)
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)

    missing = [s for s in all_strings if s not in cache]
    if missing:
        print(f'[WARN] 번역 실패 {len(missing)}개 — 재실행 필요. 한글 원문으로 fallback됨.', flush=True)

    translated = rebuild(data, cache)
    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(translated, f, ensure_ascii=False, indent=2)
    print(f'=== 완료: {len(cache)}/{len(all_strings)} 번역 → {OUT_FILE} ===', flush=True)


if __name__ == '__main__':
    main()