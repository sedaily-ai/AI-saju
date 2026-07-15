"""
총운 병렬 생성 — 일간별 10개 프로세스 동시 실행
"""
import json
import boto3
import time
import sys
import concurrent.futures
from pathlib import Path
from botocore.config import Config
from threading import Lock

# saju-sonnet-4 application inference profile (Sonnet 4) — Bedrock 비용 태깅 Service=SAJU. docs/bedrock-saju-tagging.md
BEDROCK_MODEL = 'arn:aws:bedrock:us-east-1:887078546492:application-inference-profile/cybevkpbbz32'
BEDROCK_REGION = 'us-east-1'
LOCAL_CACHE_DIR = Path(__file__).parent / 'saju-cache-local'
PROGRESS_FILE = LOCAL_CACHE_DIR / '_progress.txt'

progress_lock = Lock()

CG10 = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
JJ12 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
CG_KR = {'甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무', '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계'}
JJ_KR = {'子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해'}
CG_OH = {'甲': '목', '乙': '목', '丙': '화', '丁': '화', '戊': '토', '己': '토', '庚': '금', '辛': '금', '壬': '수', '癸': '수'}
JJ_OH = {'子': '수', '丑': '토', '寅': '목', '卯': '목', '辰': '토', '巳': '화', '午': '화', '未': '토', '申': '금', '酉': '금', '戌': '토', '亥': '수'}

ILGAN_NATURE = {
    '甲': '큰 나무의 기운. 곧고 강직하며 리더십이 있고, 자존심이 높으며 개척자적 기질.',
    '乙': '풀과 꽃의 기운. 유연하고 적응력이 뛰어나며, 부드럽지만 내면은 질기고 끈기 있음.',
    '丙': '태양의 기운. 밝고 열정적이며 사교적. 에너지가 넘치고 추진력이 있으나 성급할 수 있음.',
    '丁': '촛불의 기운. 은은하고 따뜻하며 지적. 한 분야를 깊이 파고드는 집중력이 뛰어남.',
    '戊': '큰 산의 기운. 듬직하고 포용력이 크며 중재자 역할을 잘 함. 안정감이 있으나 변화에 둔감.',
    '己': '논밭의 기운. 온화하고 현실적이며 실속 있음. 모성애가 강하고 인내심이 강함.',
    '庚': '바위와 쇠의 기운. 강인하고 결단력이 있으며 의리가 있음. 냉철하고 직설적.',
    '辛': '보석의 기운. 섬세하고 감수성이 풍부하며 완벽주의적. 심미안이 뛰어남.',
    '壬': '큰 바다의 기운. 지혜롭고 포용력이 크며 자유로운 영혼. 창의적이고 직관력이 뛰어남.',
    '癸': '이슬과 빗물의 기운. 조용하고 직관력이 뛰어나며 깊은 사고력으로 본질을 꿰뚫음.',
}

WOLJI_SEASON = {
    '寅': '봄(초춘)', '卯': '봄(중춘)', '辰': '봄(늦봄)',
    '巳': '여름(초하)', '午': '여름(한여름)', '未': '여름(늦여름)',
    '申': '가을(초추)', '酉': '가을(한가을)', '戌': '가을(늦가을)',
    '亥': '겨울(초동)', '子': '겨울(한겨울)', '丑': '겨울(늦겨울)',
}

MBTI_PERSONAS = {
    'NT': """당신은 사주명리학 전문가이자 '분석가' 성향의 해석자입니다.
성격 특성: 논리적이고 분석적인 사고, 핵심을 구조화해서 설명, 데이터와 근거 중시, 효율적 커뮤니케이션.
해석 방향: 사주의 구조적 특징을 분석하고, 오행의 상생상극 관계를 논리적으로 풀어주세요.
말투: 간결하고 핵심적, "~입니다", 구조화된 서술 선호.
예시: "핵심 포인트 3가지로 정리해드릴게요. 첫째, ..." """,
    'NF': """당신은 사주명리학 전문가이자 '이야기꾼' 성향의 해석자입니다.
성격 특성: 성찰적이고 의미 중시, 사람과 가치에 관심, 큰 그림과 맥락 파악, 공감과 이해 중요.
해석 방향: 사주가 담고 있는 삶의 의미와 성장 가능성에 초점을 맞춰 풀어주세요.
말투: 따뜻하고 사려 깊음, "~이에요", 내면의 여정을 함께 걷는 듯한 어조.
예시: "이 사주가 담고 있는 의미를 함께 생각해볼까요?" """,
    'ST': """당신은 사주명리학 전문가이자 '실용주의자' 성향의 해석자입니다.
성격 특성: 정확하고 체계적, 사실과 데이터 집중, 실용적 정보 중시, 신뢰할 수 있는 정보 전달.
해석 방향: 사주의 명리학적 근거를 명확히 하고, 실생활에 적용할 수 있는 실용적 조언을 제공하세요.
말투: 명확하고 정확, "~입니다"/"~습니다" 격식체, 팩트 기반.
예시: "이 일주의 실제 성향과 적용 포인트는 다음과 같습니다." """,
    'SF': """당신은 사주명리학 전문가이자 '공감러' 성향의 해석자입니다.
성격 특성: 친근하고 공감, 어려운 것도 쉽게 설명, 실생활 연결, 독자와 소통.
해석 방향: 사주를 친구에게 설명하듯 쉽고 재미있게 풀어주되, 내면의 아픔도 다정하게 어루만져 주세요.
말투: 친구처럼 편안한 말투, "~해요"/"~거든요", 비유와 예시 활용.
예시: "쉽게 말하면요, 이 사주는 이런 느낌이에요!" """,
}

# ── 총운 해석 공통 지침 (모든 MBTI 페르소나에 붙는 시스템 프롬프트 베이스) ──
CHONGUN_SYSTEM_BASE = """당신은 사주명리학 30년 경력의 전문 감명가입니다.
깊이 있는 명리학 칼럼이자 실제 상담 내용을 정리한 유료 리포트 수준으로 작성합니다.
독자가 자신의 실제 행동을 떠올릴 수 있도록 현실적이고 구체적으로 씁니다.

★ 문체 원칙:
(1) 명리 전문용어(십성·격국·용신·신강약 등)를 쓰되, 바로 옆에 일상어로 풀어줄 것.
    예: '식상은 생각과 기술을 결과물로 꺼내는 도구입니다. 이 기운이 강하면 머릿속 아이디어를 빠르게 기획하고 남에게 보여주는 능력은 뛰어납니다.'
(2) 일주(일간+일지)를 하나의 생생한 물상/캐릭터로 형상화할 것.
    예: 경술(庚戌) → '늦가을 광산의 서리 내린 원철', 을묘(乙卯) → '봄바람에 흔들리지만 뿌리가 깊은 들풀'
(3) 결론을 먼저 제시하고, 명리학적 근거 → 현실 행동 패턴 → 긍정적 가능성 → 위험 요소 → 구체적 행동 조언 순서로 서술.
(4) 현실에서 나타날 수 있는 장면을 구체적으로 묘사할 것.
    예: '일을 시작할 때의 추진력', '마감 직전 행동', '돈이 들어오고 나가는 패턴', '스트레스를 받을 때의 회피 방식'
(5) 주변에서 들었을 법한 말을 포함할 수 있음.
    예: '"너는 시작할 때는 엄청 열심히 하는데 왜 끝에 가서 지쳐?"'
    단, '주변에서는 이런 말을 할 수 있습니다' 형태로.

★ 금지 사항:
- '좋은 기운입니다', '가능성이 있습니다', '노력하면 잘될 것입니다' 같은 두루뭉술한 긍정
- '무조건 성공합니다', '큰돈을 벌게 됩니다' 같은 확정적 예언
- 건강 질병 진단이나 완치 시기 확정
- 운명론적 단정이나 공포 유발
- 좋은 점만 포장 — 약점과 위험도 솔직하게 설명하되 비난하지 않을 것

★ 구조 원칙:
- 각 섹션은 최소 5줄 이상, 한 문단으로 압축하지 말고 읽기 좋은 여러 문단으로 작성
- 비유가 있으나 과도하게 시적이지 않은 문체
- 단호하지만 공격적이지 않은 문체
"""


def get_bedrock_client():
    """각 스레드별 bedrock 클라이언트"""
    return boto3.client(
        'bedrock-runtime',
        region_name=BEDROCK_REGION,
        config=Config(read_timeout=120, connect_timeout=30, retries={'max_attempts': 3}),
    )


def call_claude(client, system_prompt, user_message):
    request_body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "system": [{"type": "text", "text": system_prompt}],
        "messages": [{"role": "user", "content": user_message}],
    })
    response = client.invoke_model(
        modelId=BEDROCK_MODEL,
        contentType="application/json",
        accept="application/json",
        body=request_body,
    )
    body = json.loads(response['body'].read())
    return body.get('content', [{}])[0].get('text', '')


def load_progress():
    if PROGRESS_FILE.exists():
        return set(PROGRESS_FILE.read_text(encoding='utf-8').strip().split('\n'))
    return set()


def save_progress(key):
    with progress_lock:
        with open(PROGRESS_FILE, 'a', encoding='utf-8') as f:
            f.write(key + '\n')


def process_chongun(ilgan, ilji, wolji, done):
    """단일 총운 조합 처리"""
    key = f"chongun/{ilgan}_{ilji}_{wolji}.json"
    if key in done:
        return None

    bedrock = get_bedrock_client()

    ilgan_kr = CG_KR[ilgan]
    ilji_kr = JJ_KR[ilji]
    wolji_kr = JJ_KR[wolji]

    # 오행 편중 분석용 데이터
    ilgan_oh = CG_OH[ilgan]
    ilji_oh = JJ_OH[ilji]
    wolji_oh = JJ_OH[wolji]
    oh_count = {}
    for oh in [ilgan_oh, ilji_oh, wolji_oh]:
        oh_count[oh] = oh_count.get(oh, 0) + 1
    excess_oh = [oh for oh, cnt in oh_count.items() if cnt >= 2]
    all_oh = {'목', '화', '토', '금', '수'}
    present_oh = set(oh_count.keys())
    lacking_oh = list(all_oh - present_oh)

    base_info = f"""사주 정보:
- 일간: {ilgan_kr}({ilgan}), 오행: {ilgan_oh}
- 일지: {ilji_kr}({ilji}), 오행: {ilji_oh}
- 월지(태어난 계절): {wolji_kr}({wolji}), 오행: {wolji_oh}, 계절: {WOLJI_SEASON.get(wolji, '')}
- 일간 성향: {ILGAN_NATURE.get(ilgan, '')}
- 과한 오행: {', '.join(excess_oh) if excess_oh else '없음(균형)'}
- 부족한 오행: {', '.join(lacking_oh) if lacking_oh else '없음(균형)'}

아래 10개 섹션으로 나누어 이 사주의 총운을 해석해주세요.
반드시 아래 JSON 형식으로만 출력하세요. JSON 외에 다른 텍스트는 절대 포함하지 마세요.

{{"headline": "(독자의 시선을 끄는 비유형 한 문장. 예: '서리 내린 광산의 원철, 숙살의 무인')",
"temperament": "(일주 물상 형상화 + 겉 인상과 내면 반전 대비 + 과한/부족 오행의 심리 패턴 + 인성의 내면 작용(완벽주의/자기검열/방어기제 등). 현실에서 나타나는 구체적 행동 패턴 포함. 최소 8줄, 400~600자)",
"stressPattern": "(스트레스 받을 때 나타나는 구체적 행동 패턴. 주변에서 들었을 법한 말 1~2개 포함. 위험 요소와 해소법 모두 제시. 최소 5줄, 200~350자)",
"bestEnvironment": "(잘 맞는 환경/역할. 구체적 현대 직업명 3~5개 제시. 왜 맞는지 명리학적 근거 포함. 최소 5줄, 200~350자)",
"career": "(직업·재능의 구조적 분석. 식상·재성 기운과 연결. 프리랜서 vs 조직 적합성. 현실적 판단 기준 포함. 최소 5줄, 200~350자)",
"wealth": "(돈을 대하는 태도, 수입 구조, 저축·지출 패턴, 투자 성향, 돈이 새는 지점. 확정적 예언 금지. 최소 5줄, 200~350자)",
"love": "(연애·배우자 패턴. 만남 기회, 관계 시작 방식, 유지·갈등 요소, 잘 맞는 만남 방식. '무조건 연애한다' 금지. 최소 5줄, 200~350자)",
"relationships": "(대인관계 패턴. 동료·친구·상사와의 관계 강점과 주의점. 고립/의존 패턴. 현실 장면 묘사. 최소 5줄, 200~350자)",
"health": "(오행 편중이 몸에 미치는 영향. 취약 부위와 생활 리듬. 질병 진단·완치 시기 확정 금지. 자기관리 관점으로만. 최소 4줄, 150~250자)",
"improvement": "(부족한 {', '.join(lacking_oh) if lacking_oh else '오행'} 보충 개운법. 색상·방위·일상 습관·음식·운동 구체 제시. 최소 4줄, 150~250자)",
"luckyColor": "(이 일주에 행운을 가져다주는 색상 1~2가지. 예: '초록, 청록')",
"luckyNumber": "(행운의 숫자 2개. 예: '3, 8')",
"luckyItem": "(일상에서 지니면 좋은 행운 아이템 2~3가지. 예: '나무 소품, 화분, 녹색 액세서리')",
"bestMatch": "(가장 잘 맞는 오행/일간 유형과 그 이유. 왜 상생하는지 구체적으로. 3~5줄, 100~200자)",
"dailyAdvice": "(이 일주를 위한 일상 조언 한 줄. 매번 다르게. 예: '오늘은 새로운 아이디어를 메모해두세요. 작은 씨앗이 큰 나무가 됩니다.')"}}

★ 각 값은 자연스러운 문장으로. 마크다운·번호 매기기 금지. 결론→근거→현실→조언 순서."""

    result = {}
    for group, persona in MBTI_PERSONAS.items():
        system_prompt = CHONGUN_SYSTEM_BASE + "\n" + persona
        raw = call_claude(bedrock, system_prompt, base_info)
        # Claude가 ```json ... ``` 코드블록으로 감싸는 경우 제거
        cleaned = raw.strip()
        if cleaned.startswith('```'):
            # 첫 줄(```json)과 마지막 줄(```) 제거
            lines = cleaned.split('\n')
            if lines[0].startswith('```'):
                lines = lines[1:]
            if lines and lines[-1].strip() == '```':
                lines = lines[:-1]
            cleaned = '\n'.join(lines).strip()
        # JSON 파싱 시도 — 실패하면 기존 방식(단일 텍스트)으로 폴백
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, dict) and 'personality' in parsed or 'temperament' in parsed:
                result[group] = parsed
            else:
                result[group] = {"text": raw}
        except (json.JSONDecodeError, ValueError):
            result[group] = {"text": raw}

    # Save
    data_json = json.dumps(result, ensure_ascii=False, indent=2)
    path = LOCAL_CACHE_DIR / key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(data_json, encoding='utf-8')

    save_progress(key)
    return key


def main():
    LOCAL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    done = load_progress()

    # 모든 조합 생성
    tasks = []
    for ilgan in CG10:
        for ilji in JJ12:
            for wolji in JJ12:
                key = f"chongun/{ilgan}_{ilji}_{wolji}.json"
                if key not in done:
                    tasks.append((ilgan, ilji, wolji))

    total = len(CG10) * len(JJ12) * len(JJ12)
    remaining = len(tasks)
    completed = total - remaining
    print(f"=== 총운 병렬 생성: {total}개 (완료: {completed}, 남은: {remaining}) ===\n", flush=True)

    if not tasks:
        print("모두 완료!", flush=True)
        return

    workers = 1  # rate limit 방지
    count = [completed]

    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {
            executor.submit(process_chongun, ilgan, ilji, wolji, done): (ilgan, ilji, wolji)
            for ilgan, ilji, wolji in tasks
        }
        for future in concurrent.futures.as_completed(futures):
            ilgan, ilji, wolji = futures[future]
            try:
                result = future.result()
                if result:
                    count[0] += 1
                    print(f"[{count[0]}/{total}] {result}", flush=True)
            except Exception as e:
                print(f"[ERROR] chongun/{ilgan}_{ilji}_{wolji}.json: {e}", flush=True)

    print(f"\n=== 완료: {count[0]}/{total} ===", flush=True)


if __name__ == '__main__':
    main()
