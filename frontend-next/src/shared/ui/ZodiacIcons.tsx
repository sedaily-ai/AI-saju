/**
 * 12지 동물 아이콘 — game-icons.net (CC BY 3.0)
 * Authors: Delapouite (rat, ox=cow, tiger-head, rabbit, horse-head, goat=sheep, rooster, dog=sitting-dog, pig=piggy-bank)
 *          Lorc (dragon-head, snake, monkey)
 * SVG 파일은 public/zodiac-icons/{id}.svg
 * CSS mask-image 로 단색 렌더링하여 currentColor처럼 컬러 제어 가능.
 */
import type { CSSProperties } from 'react';

export type ZodiacId =
  | 'rat' | 'ox' | 'tiger' | 'rabbit' | 'dragon' | 'snake'
  | 'horse' | 'goat' | 'monkey' | 'rooster' | 'dog' | 'pig';

interface IconProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

function makeIcon(id: ZodiacId) {
  function Icon({ size = 24, className, style }: IconProps) {
    const url = `url(/zodiac-icons/${id}.svg)`;
    return (
      <span
        aria-hidden="true"
        className={className}
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          backgroundColor: 'currentColor',
          WebkitMaskImage: url,
          maskImage: url,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          ...style,
        }}
      />
    );
  }
  Icon.displayName = `${id}Icon`;
  return Icon;
}

export const RatIcon     = makeIcon('rat');
export const OxIcon      = makeIcon('ox');
export const TigerIcon   = makeIcon('tiger');
export const RabbitIcon  = makeIcon('rabbit');
export const DragonIcon  = makeIcon('dragon');
export const SnakeIcon   = makeIcon('snake');
export const HorseIcon   = makeIcon('horse');
export const GoatIcon    = makeIcon('goat');
export const MonkeyIcon  = makeIcon('monkey');
export const RoosterIcon = makeIcon('rooster');
export const DogIcon     = makeIcon('dog');
export const PigIcon     = makeIcon('pig');

export const ZODIAC_ICONS: Record<ZodiacId, ReturnType<typeof makeIcon>> = {
  rat: RatIcon,
  ox: OxIcon,
  tiger: TigerIcon,
  rabbit: RabbitIcon,
  dragon: DragonIcon,
  snake: SnakeIcon,
  horse: HorseIcon,
  goat: GoatIcon,
  monkey: MonkeyIcon,
  rooster: RoosterIcon,
  dog: DogIcon,
  pig: PigIcon,
};
