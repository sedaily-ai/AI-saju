"""
캐릭터 그리드 이미지(2x2)를 4개의 개별 파일로 분할하는 스크립트.

사용법:
  python3 scripts/split-characters.py

입력: public/characters/characters-grid.png (2x2 그리드 이미지)
출력:
  public/characters/raccoon.png    (왼쪽 위)
  public/characters/lion.png       (오른쪽 위)
  public/characters/hippo.png      (왼쪽 아래)
  public/characters/orangutan.png  (오른쪽 아래)
"""

from PIL import Image
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
CHARACTERS_DIR = os.path.join(PROJECT_ROOT, 'public', 'characters')

INPUT_FILE = os.path.join(CHARACTERS_DIR, 'characters-grid.png')

OUTPUTS = [
    ('raccoon.png', (0, 0)),      # 왼쪽 위
    ('lion.png', (1, 0)),         # 오른쪽 위
    ('hippo.png', (0, 1)),        # 왼쪽 아래
    ('orangutan.png', (1, 1)),    # 오른쪽 아래
]


def main():
    if not os.path.exists(INPUT_FILE):
        print(f'ERROR: {INPUT_FILE} not found.')
        print('Please save the 2x2 character grid image as characters-grid.png')
        return

    img = Image.open(INPUT_FILE)
    w, h = img.size
    half_w = w // 2
    half_h = h // 2

    os.makedirs(CHARACTERS_DIR, exist_ok=True)

    for filename, (col, row) in OUTPUTS:
        left = col * half_w
        top = row * half_h
        right = left + half_w
        bottom = top + half_h

        cropped = img.crop((left, top, right, bottom))
        output_path = os.path.join(CHARACTERS_DIR, filename)
        cropped.save(output_path, 'PNG')
        print(f'Saved: {output_path} ({half_w}x{half_h})')

    print('\nDone! 4 character images created.')


if __name__ == '__main__':
    main()
