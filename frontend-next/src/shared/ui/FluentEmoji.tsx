'use client';

/**
 * Microsoft Fluent Emoji (MIT) 의 3D PNG 를 jsdelivr CDN 으로 사용한다.
 * Wrtn flot 스타일의 클레이/3D 일러를 동일 라이브러리로 그대로 끌어다 쓰는 방식.
 *
 * 라이선스: github.com/microsoft/fluentui-emoji 의 MIT
 *
 * 폴더 규칙: assets/<Folder name>/3D/<folder_name_lowercased>_3d.png
 * - 폴더명 첫 단어만 대문자, 나머지는 소문자, 공백 포함 (예: "Crystal ball")
 * - 파일명은 폴더명을 전부 lowercase 하고 공백을 `_` 로 치환 + `_3d.png`
 *
 * 새 아이콘이 필요하면 `FOLDER_BY_NAME` 에 폴더명만 추가하면 된다.
 * Fluent UI Emoji 카탈로그: github.com/microsoft/fluentui-emoji/tree/main/assets
 */

const CDN = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets';

/**
 * 사람 이모지(스킨톤 변형 있음)는 폴더 한 단계가 더 들어가고 파일명이 `_default` 로 끝남.
 *   assets/<Folder>/Default/3D/<slug>_3d_default.png
 * 이 셋에 해당하는 폴더는 `PERSON_EMOJI` 에 등록한다.
 */
const PERSON_EMOJI = new Set<string>([
  'Folded hands',
  'Thumbs up',
  'Person in lotus position',
]);

/** 사이트에서 쓰는 키 → Fluent Emoji 폴더명 (첫 단어 대문자, 나머지 소문자) */
const FOLDER_BY_NAME = {
  // 별·반짝임·에너지
  sparkles:        'Sparkles',
  star:            'Glowing star',
  star2:           'Star',
  fire:            'Fire',
  highVoltage:     'High voltage',
  partyPopper:     'Party popper',
  shootingStar:    'Shooting star',
  rainbow:         'Rainbow',

  // 행운/점술/오컬트
  clover:          'Four leaf clover',
  crystalBall:     'Crystal ball',
  magicWand:       'Magic wand',
  bell:            'Bellhop bell',
  bookmark:        'Bookmark tabs',
  scroll:          'Scroll',
  hourglass:       'Hourglass not done',
  unicorn:         'Unicorn',
  dragon:          'Dragon',

  // 하트/사랑
  redHeart:        'Red heart',
  twoHearts:       'Two hearts',
  sparkleHeart:    'Sparkling heart',
  heartRibbon:     'Heart with ribbon',
  loveLetter:      'Love letter',
  heartFace:       'Smiling face with hearts',
  rose:            'Rose',
  bouquet:         'Bouquet',

  // 직업/일/돈
  briefcase:       'Briefcase',
  moneyBag:        'Money bag',
  moneyWithWings:  'Money with wings',
  graphUp:         'Chart increasing',
  graphDown:       'Chart decreasing',
  computer:        'Laptop',
  pencil:          'Memo',
  graduation:      'Graduation cap',
  buildingOffice:  'Office building',
  trophy:          'Trophy',

  // 건강/일상
  health:          'Plus',
  pill:            'Pill',
  heartPulse:      'Beating heart',
  meditate:        'Person in lotus position', // person → Default/3D/_default.png
  prayingHands:    'Folded hands',              // person → Default/3D/_default.png
  teaCup:          'Teacup without handle',
  candle:          'Candle',

  // 시간/날씨
  sun:             'Sun',
  cloudSun:        'Sun behind small cloud',
  moon:            'Crescent moon',
  fullMoon:        'Full moon',
  newMoon:         'New moon face',
  alarmClock:      'Alarm clock',
  hourglassFlow:   'Hourglass done',
  cloud:           'Cloud',

  // 메시지/뉴스
  newspaper:       'Newspaper',
  megaphone:       'Megaphone',
  speechBalloon:   'Speech balloon',
  bookmarkRibbon:  'Bookmark',
  envelope:        'Envelope',
  mailbox:         'Closed mailbox with raised flag',

  // 사주/명리 비유
  yinYang:         'Yin yang',
  bomb:            'Bomb',
  magnet:          'Magnet',
  key:             'Key',
  oldKey:          'Old key',
  mirror:          'Mirror',
  compass:         'Compass',
  globe:           'Globe showing asia-australia',

  // 띠 (12지)
  rat:             'Rat',
  ox:              'Ox',
  tiger:           'Tiger face',
  rabbit:          'Rabbit face',
  dragonFace:      'Dragon face',
  snake:           'Snake',
  horse:           'Horse face',
  goat:            'Goat',
  monkey:          'Monkey face',
  rooster:         'Rooster',
  dog:             'Dog face',
  pig:             'Pig face',

  // UI 보조
  magnifyingGlass: 'Magnifying glass tilted left',
  bullseye:        'Bullseye',
  thumbsUp:        'Thumbs up',
  warning:         'Warning',
  checkMark:       'Check mark button',
  questionMark:    'Red question mark',
  bullhorn:        'Loudspeaker',
  lotus:           'Lotus',
} as const;

export type FluentEmojiName = keyof typeof FOLDER_BY_NAME;

/** 폴더명 → 파일명: 전체 소문자 + 공백을 `_` 로 (하이픈은 보존) + `_3d.png`
 *  사람 이모지는 `_3d_default.png` 와 `/Default` 한 단계 추가 */
function fileFor(folder: string, person: boolean): string {
  const slug = folder.toLowerCase().replace(/\s/g, '_');
  return person ? `${slug}_3d_default.png` : `${slug}_3d.png`;
}

function urlFor(name: FluentEmojiName): string {
  const folder = FOLDER_BY_NAME[name];
  const person = PERSON_EMOJI.has(folder);
  const subdir = person ? 'Default/3D' : '3D';
  return `${CDN}/${encodeURIComponent(folder)}/${subdir}/${fileFor(folder, person)}`;
}

interface Props {
  name: FluentEmojiName;
  size?: number;
  alt?: string;
  className?: string;
}

export function FluentEmoji({ name, size = 64, alt = '', className = '' }: Props) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={urlFor(name)}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={`select-none pointer-events-none ${className}`}
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}
