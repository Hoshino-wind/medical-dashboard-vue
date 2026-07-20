#!/usr/bin/env python3
"""Build the dashboard-only Heavy font subset selected from the concept board.

The reference-board glyphs are traced directly from the approved images. Characters
that are used by the dashboard but absent from the boards are derived from the
OFL-licensed Noto Sans CJK SC source and rounded to match each selected direction.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import importlib.metadata
import json
import re
import shutil
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont


UPM = 1000
ASCENT = 900
DESCENT = -120
REFERENCE_TITLE = "医疗设备全场景智慧管理系统"
REFERENCE_CARD_GROUPS = ("设备总览", "维修工单", "保修统计", "巡检工单")
REFERENCE_DIGITS = "0123456789"
EXTRA_SYMBOLS = " %.+-:/·（）"
PIPELINE_VERSION = 4
FONT_TIMESTAMP = 3850070400  # 2026-01-01 00:00:00 UTC in the TrueType 1904 epoch.
NOTO_SOURCE_COMMIT = 'f8d157532fbfaeda587e826d4cd5b21a49186f7c'
NOTO_SOURCE_URL = (
    'https://raw.githubusercontent.com/notofonts/noto-cjk/'
    f'{NOTO_SOURCE_COMMIT}/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf'
)
OFL_SUMMARY = (
    'This Font Software is licensed under the SIL Open Font License, Version 1.1. '
    'It is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF '
    'ANY KIND. See the SIL Open Font License for permissions and limitations.'
)


@dataclass(frozen=True)
class GlyphBuildResult:
    ttf_path: Path
    woff2_path: Path
    preserved_characters: set[str]
    source_by_character: dict[str, str]


@dataclass(frozen=True)
class GlyphMaskSource:
    mask: np.ndarray
    source: str
    is_normalized: bool = False
    advance: int | None = None


@dataclass(frozen=True)
class StyleConfig:
    key: str
    family: str
    file_stem: str
    reference_path: Path
    title_box: tuple[int, int, int, int]
    card_boxes: tuple[tuple[int, int, int, int], ...]
    digit_box: tuple[int, int, int, int]
    punctuation_boxes: dict[str, tuple[int, int, int, int]]
    threshold: int
    source_dilate: int
    source_blur: int
    weight_class: int
    preview_color: tuple[int, int, int]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument('--project-root', type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument(
        '--noto-font',
        type=Path,
        help='OFL-licensed Noto Sans CJK SC source. Required only for unapproved new glyphs.',
    )
    parser.add_argument(
        '--extra-glyphs-file',
        type=Path,
        help='UTF-8 file containing additional characters to include in the Heavy family.',
    )
    parser.add_argument(
        '--output-dir',
        type=Path,
        help='Write a review build outside src/assets/fonts without touching production fonts.',
    )
    parser.add_argument(
        '--refresh-existing',
        action='store_true',
        help='Regenerate existing glyphs instead of preserving them from the current TTF seed.',
    )
    parser.add_argument(
        '--require-approved-new-glyphs',
        action='store_true',
        help='Reject new characters that only have the rounded Noto fallback.',
    )
    parser.add_argument(
        '--update-build-lock',
        action='store_true',
        help='Intentionally update the pinned source-font and dependency lock.',
    )
    parser.add_argument(
        '--accept-current-glyphs',
        action='store_true',
        help='After visual review, add the current output glyph fingerprints to the glyph lock.',
    )
    return parser.parse_args()


def style_configs(root: Path) -> tuple[StyleConfig]:
    reference_dir = root / 'src/assets/fonts/references'
    return (
        StyleConfig(
            key='heavy',
            family='MedDash Rounded Heavy Subset',
            file_stem='meddash-rounded-heavy-subset',
            reference_path=reference_dir / 'rounded-heavy-reference.png',
            title_box=(130, 219, 1722, 351),
            card_boxes=(
                (232, 426, 504, 487),
                (612, 426, 884, 487),
                (993, 426, 1267, 487),
                (1361, 426, 1633, 487),
            ),
            digit_box=(159, 573, 919, 660),
            punctuation_boxes={
                '.': (1134, 573, 1148, 660),
                '%': (1230, 573, 1288, 660),
                '+': (1349, 573, 1398, 660),
            },
            threshold=148,
            source_dilate=7,
            source_blur=7,
            weight_class=700,
            preview_color=(242, 249, 255),
        ),
    )


def project_title_strings(root: Path) -> list[str]:
    sources = (
        root / 'src/data/modules.ts',
        root / 'src/data/document/dashboardData.ts',
    )
    values: list[str] = []
    for source in sources:
        text = source.read_text(encoding='utf-8')
        for value in re.findall(r"(?:title|subtitle):\s*'([^']+)'", text):
            if re.search(r'[\u3400-\u9fff]', value):
                values.append(value)
    return list(dict.fromkeys(values))


def default_extra_glyphs_path(root: Path) -> Path:
    return root / 'scripts/fonts/dashboard-extra-glyphs.txt'


def default_component_recipe_path(root: Path) -> Path:
    return root / 'scripts/fonts/component-recipes.json'


def default_build_lock_path(root: Path) -> Path:
    return root / 'scripts/fonts/font-build-lock.json'


def default_glyph_lock_path(root: Path) -> Path:
    return root / 'scripts/fonts/font-glyph-lock.json'


def read_extra_glyphs(path: Path) -> str:
    if not path.exists():
        return ''
    lines = []
    for raw_line in path.read_text(encoding='utf-8').splitlines():
        line = raw_line.strip()
        if line and not line.startswith('#'):
            lines.append(line)
    return ''.join(lines)


def required_characters(root: Path, extra_glyphs_path: Path) -> tuple[list[str], list[str]]:
    title_values = project_title_strings(root)
    extra_glyphs = read_extra_glyphs(extra_glyphs_path)
    characters = set(''.join(title_values) + extra_glyphs + EXTRA_SYMBOLS + REFERENCE_DIGITS)
    ordered = sorted(characters, key=ord)
    return ordered, title_values


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def dependency_versions() -> dict[str, str]:
    distributions = {
        'fonttools': 'fonttools',
        'numpy': 'numpy',
        'Pillow': 'Pillow',
    }
    versions: dict[str, str] = {}
    for label, distribution in distributions.items():
        versions[label] = importlib.metadata.version(distribution)
    versions['opencv'] = cv2.__version__
    try:
        versions['brotli'] = importlib.metadata.version('brotli')
    except importlib.metadata.PackageNotFoundError:
        versions['brotli'] = 'missing'
    return versions


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding='utf-8'))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + '\n', encoding='utf-8')


def verify_build_lock(lock_path: Path, noto_path: Path, update: bool) -> dict[str, Any]:
    current = {
        'pipeline_version': PIPELINE_VERSION,
        'source_font': {
            'filename': noto_path.name,
            'sha256': sha256_file(noto_path),
            'upstream_commit': NOTO_SOURCE_COMMIT,
            'url': NOTO_SOURCE_URL,
        },
        'dependencies': dependency_versions(),
    }
    locked = load_json(lock_path, None)
    if update:
        write_json(lock_path, current)
        return current
    if locked is None:
        raise RuntimeError(
            f'Missing build lock: {lock_path}. Run once with --update-build-lock after reviewing '
            'the source font and dependency versions.'
        )
    if locked != current:
        raise RuntimeError(
            'Font build environment differs from font-build-lock.json. '
            'Use the pinned environment or intentionally pass --update-build-lock.'
        )
    return current


def font_family_name(font: TTFont) -> str:
    for record in font['name'].names:
        if record.nameID == 1:
            try:
                return record.toUnicode()
            except UnicodeDecodeError:
                continue
    return ''


def font_glyph_fingerprints(path: Path) -> dict[str, str]:
    font = TTFont(path)
    glyph_set = font.getGlyphSet()
    metrics = font['hmtx'].metrics
    fingerprints: dict[str, str] = {}
    for codepoint, glyph_name_value in sorted(font.getBestCmap().items()):
        pen = RecordingPen()
        glyph_set[glyph_name_value].draw(pen)
        payload = repr((pen.value, metrics[glyph_name_value])).encode('utf-8')
        fingerprints[chr(codepoint)] = hashlib.sha256(payload).hexdigest()
    font.close()
    return fingerprints


def verify_glyph_lock(
    lock_path: Path,
    style: 'StyleConfig',
    seed_path: Path,
) -> dict[str, str]:
    locked = load_json(lock_path, {'version': 1, 'families': {}})
    expected: dict[str, str] = locked.get('families', {}).get(style.key, {})
    if not expected:
        return {}
    actual = font_glyph_fingerprints(seed_path)
    changed = [character for character, fingerprint in expected.items() if actual.get(character) != fingerprint]
    if changed:
        display = ''.join(changed[:20])
        raise RuntimeError(
            f'{style.family} seed does not match the locked glyph outlines: {display}. '
            'Restore the approved seed or explicitly re-accept the changed glyphs after review.'
        )
    return expected


def crop_rgb(image: np.ndarray, box: tuple[int, int, int, int]) -> np.ndarray:
    x0, y0, x1, y1 = box
    return image[y0:y1, x0:x1]


def remove_small_components(mask: np.ndarray, minimum_area: int = 4) -> np.ndarray:
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    cleaned = np.zeros_like(mask, dtype=np.uint8)
    for label in range(1, count):
        if stats[label, cv2.CC_STAT_AREA] >= minimum_area:
            cleaned[labels == label] = 255
    return cleaned


def reference_mask(crop: np.ndarray, threshold: int) -> np.ndarray:
    maximum = crop.max(axis=2)
    luminance = crop.mean(axis=2)
    mask = ((maximum >= threshold) & (luminance >= 88)).astype(np.uint8) * 255
    mask = cv2.morphologyEx(
        mask,
        cv2.MORPH_CLOSE,
        cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3)),
    )
    return remove_small_components(mask)


def split_equal_cells(
    image: np.ndarray,
    box: tuple[int, int, int, int],
    text: str,
    threshold: int,
) -> dict[str, np.ndarray]:
    x0, y0, x1, y1 = box
    row = image[y0:y1, x0:x1]
    row_mask = reference_mask(row, threshold)
    projection = (row_mask > 0).sum(axis=0)
    cell_width = (x1 - x0) / len(text)
    search_radius = max(10, round(cell_width * 0.22))
    boundaries = [0]
    for index in range(1, len(text)):
        target = round(index * cell_width)
        left = max(boundaries[-1] + 2, target - search_radius)
        right = min(row.shape[1] - 2, target + search_radius)
        window = projection[left:right + 1]
        minimum = window.min()
        candidates = np.flatnonzero(window == minimum) + left
        boundary = int(candidates[np.argmin(np.abs(candidates - target))])
        boundaries.append(boundary)
    boundaries.append(row.shape[1])

    result: dict[str, np.ndarray] = {}
    for index, character in enumerate(text):
        left = boundaries[index]
        right = boundaries[index + 1]
        result[character] = reference_mask(row[:, left:right], threshold)
    return result


def extract_reference_masks(style: StyleConfig) -> dict[str, np.ndarray]:
    image = np.asarray(Image.open(style.reference_path).convert('RGB'))
    masks = split_equal_cells(image, style.title_box, REFERENCE_TITLE, style.threshold)
    for text, box in zip(REFERENCE_CARD_GROUPS, style.card_boxes, strict=True):
        for character, mask in split_equal_cells(image, box, text, style.threshold).items():
            masks.setdefault(character, mask)
    masks.update(split_equal_cells(image, style.digit_box, REFERENCE_DIGITS, style.threshold))
    for character, box in style.punctuation_boxes.items():
        masks[character] = reference_mask(crop_rgb(image, box), style.threshold)
    return masks


def unicode_key(character: str) -> str:
    return f'U+{ord(character):04X}'


def load_approved_override(root: Path, style: StyleConfig, character: str) -> np.ndarray | None:
    path = root / 'scripts/fonts/approved-glyphs' / style.key / f'{unicode_key(character)}.png'
    if not path.exists():
        return None
    mask = np.asarray(Image.open(path).convert('L'))
    _, mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)
    return remove_small_components(mask)


def load_component_recipes(path: Path) -> dict[str, Any]:
    recipes = load_json(path, {'version': 1, 'styles': {}})
    if recipes.get('version') != 1 or not isinstance(recipes.get('styles'), dict):
        raise RuntimeError(f'Unsupported component recipe format: {path}')
    return recipes


def compose_component_recipe(
    root: Path,
    style: StyleConfig,
    character: str,
    recipes: dict[str, Any],
) -> tuple[np.ndarray, int] | None:
    style_recipes = recipes.get('styles', {}).get(style.key, {})
    recipe = style_recipes.get('characters', {}).get(unicode_key(character))
    if recipe is None:
        return None
    advance = int(recipe.get('advance', advance_width(character)))
    if advance <= 0 or advance > 2000:
        raise RuntimeError(f'Invalid advance for {style.key} {unicode_key(character)}: {advance}')
    canvas = np.zeros((1000, advance), dtype=np.uint8)
    components = recipe.get('components', [])
    if not components:
        raise RuntimeError(f'Empty component recipe for {style.key} {unicode_key(character)}')
    for component in components:
        filename = component['file']
        if Path(filename).name != filename:
            raise RuntimeError(f'Component file must be a basename: {filename}')
        component_path = root / 'scripts/fonts/components' / style.key / filename
        if not component_path.exists():
            raise RuntimeError(f'Missing component image: {component_path}')
        source = np.asarray(Image.open(component_path).convert('L'))
        _, source = cv2.threshold(source, 127, 255, cv2.THRESH_BINARY)
        source = tight_crop(source)
        x = int(component['x'])
        y = int(component['y'])
        width = int(component['width'])
        height = int(component['height'])
        if width <= 0 or height <= 0 or x < 0 or y < 0 or x + width > advance or y + height > 1000:
            raise RuntimeError(
                f'Component placement is outside the glyph cell: {style.key} '
                f'{unicode_key(character)} {filename}'
            )
        resized = cv2.resize(source, (width, height), interpolation=cv2.INTER_CUBIC)
        _, resized = cv2.threshold(resized, 127, 255, cv2.THRESH_BINARY)
        region = canvas[y:y + height, x:x + width]
        mode = component.get('mode', 'add')
        if mode == 'add':
            canvas[y:y + height, x:x + width] = np.maximum(region, resized)
        elif mode == 'subtract':
            canvas[y:y + height, x:x + width] = np.where(resized > 0, 0, region)
        else:
            raise RuntimeError(f'Unsupported component mode: {mode}')
    return remove_small_components(canvas), advance


def tight_crop(mask: np.ndarray) -> np.ndarray:
    points = cv2.findNonZero((mask > 0).astype(np.uint8))
    if points is None:
        return np.zeros((1, 1), dtype=np.uint8)
    x, y, width, height = cv2.boundingRect(points)
    return mask[y:y + height, x:x + width]


def source_mask(character: str, font: ImageFont.FreeTypeFont, style: StyleConfig) -> np.ndarray:
    bbox = font.getbbox(character)
    width = max(1, bbox[2] - bbox[0])
    height = max(1, bbox[3] - bbox[1])
    margin = 36
    image = Image.new('L', (width + margin * 2, height + margin * 2), 0)
    draw = ImageDraw.Draw(image)
    draw.text((margin - bbox[0], margin - bbox[1]), character, font=font, fill=255)
    mask = np.asarray(image)
    if style.source_dilate > 1:
        mask = cv2.dilate(
            mask,
            cv2.getStructuringElement(
                cv2.MORPH_ELLIPSE,
                (style.source_dilate, style.source_dilate),
            ),
        )
    if style.source_blur > 1:
        mask = cv2.GaussianBlur(mask, (style.source_blur, style.source_blur), 0)
    _, mask = cv2.threshold(mask, 112, 255, cv2.THRESH_BINARY)
    return remove_small_components(mask)


def character_category(character: str) -> str:
    if '\u3400' <= character <= '\u9fff' or character in '（）':
        return 'cjk'
    if character.isdigit():
        return 'digit'
    return 'symbol'


def advance_width(character: str) -> int:
    category = character_category(character)
    if category == 'cjk':
        return 1000
    if category == 'digit':
        return 700
    if character == ' ':
        return 320
    if character in '.·:':
        return 340
    return 620


def normalize_mask(mask: np.ndarray, character: str) -> tuple[np.ndarray, int]:
    advance = advance_width(character)
    category = character_category(character)
    crop = tight_crop(mask)
    if category == 'cjk':
        target_height = 800
        max_width = 850
        top = 92
    elif category == 'digit':
        target_height = 750
        max_width = advance - 108
        top = 138
    elif character == '.':
        target_height = 105
        max_width = 105
        top = 778
    elif character == '·':
        target_height = 105
        max_width = 105
        top = 455
    elif character == ':':
        target_height = 390
        max_width = 110
        top = 340
    elif character in '+-':
        target_height = 450 if character == '+' else 110
        max_width = 460
        top = 280 if character == '+' else 520
    else:
        target_height = 720
        max_width = advance - 70
        top = 155

    scale = min(target_height / crop.shape[0], max_width / crop.shape[1])
    width = max(1, round(crop.shape[1] * scale))
    height = max(1, round(crop.shape[0] * scale))
    resized = cv2.resize(crop, (width, height), interpolation=cv2.INTER_CUBIC)
    resized = cv2.GaussianBlur(resized, (3, 3), 0)
    _, resized = cv2.threshold(resized, 118, 255, cv2.THRESH_BINARY)
    canvas = np.zeros((1000, advance), dtype=np.uint8)
    left = max(0, (advance - width) // 2)
    bottom = min(1000, top + height)
    right = min(advance, left + width)
    canvas[top:bottom, left:right] = resized[:bottom - top, :right - left]
    return canvas, advance


def signed_area(points: list[tuple[int, int]]) -> float:
    area = 0.0
    for index, point in enumerate(points):
        next_point = points[(index + 1) % len(points)]
        area += point[0] * next_point[1] - next_point[0] * point[1]
    return area / 2


def mask_to_glyph(mask: np.ndarray):
    contours, hierarchy = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_TC89_KCOS)
    pen = TTGlyphPen(None)
    if hierarchy is None:
        return pen.glyph()
    hierarchy = hierarchy[0]
    for index, contour in enumerate(contours):
        if abs(cv2.contourArea(contour)) < 12:
            continue
        contour = cv2.approxPolyDP(contour, 1.35, True)
        points = [(int(point[0][0]), int(ASCENT - point[0][1])) for point in contour]
        if len(points) < 3:
            continue
        depth = 0
        parent = hierarchy[index][3]
        while parent != -1:
            depth += 1
            parent = hierarchy[parent][3]
        is_outer = depth % 2 == 0
        area = signed_area(points)
        if (is_outer and area > 0) or (not is_outer and area < 0):
            points.reverse()
        pen.moveTo(points[0])
        for point in points[1:]:
            pen.lineTo(point)
        pen.closePath()
    return pen.glyph()


def notdef_glyph():
    mask = np.zeros((1000, 700), dtype=np.uint8)
    cv2.rectangle(mask, (90, 110), (610, 880), 255, -1)
    cv2.rectangle(mask, (155, 175), (545, 815), 0, -1)
    cv2.line(mask, (185, 735), (515, 255), 255, 42)
    cv2.line(mask, (185, 255), (515, 735), 255, 42)
    return mask_to_glyph(mask)


def glyph_name(character: str) -> str:
    codepoint = ord(character)
    return f'uni{codepoint:04X}' if codepoint <= 0xFFFF else f'u{codepoint:05X}'


def load_seed_font(path: Path, expected_family: str) -> dict[str, Any] | None:
    if not path.exists():
        return None
    font = TTFont(path)
    actual_family = font_family_name(font)
    if actual_family != expected_family:
        font.close()
        raise RuntimeError(
            f'Seed font family mismatch for {path}: expected {expected_family!r}, got {actual_family!r}'
        )
    cmap = font.getBestCmap()
    glyf = font['glyf']
    metrics = font['hmtx'].metrics
    characters: dict[str, tuple[Any, tuple[int, int]]] = {}
    for codepoint, source_name in cmap.items():
        characters[chr(codepoint)] = (copy.deepcopy(glyf[source_name]), metrics[source_name])
    special = {
        '.notdef': (copy.deepcopy(glyf['.notdef']), metrics['.notdef']),
        'space': (
            copy.deepcopy(glyf['space']) if 'space' in glyf else TTGlyphPen(None).glyph(),
            metrics.get('space', (320, 0)),
        ),
    }
    font.close()
    return {'characters': characters, 'special': special}


def resolve_new_glyph_source(
    root: Path,
    style: StyleConfig,
    character: str,
    reference_masks: dict[str, np.ndarray],
    recipes: dict[str, Any],
    source_font: ImageFont.FreeTypeFont | None,
) -> GlyphMaskSource:
    override = load_approved_override(root, style, character)
    if override is not None:
        return GlyphMaskSource(override, 'approved-override')
    component_result = compose_component_recipe(root, style, character, recipes)
    if component_result is not None:
        mask, advance = component_result
        return GlyphMaskSource(mask, 'component-recipe', is_normalized=True, advance=advance)
    reference = reference_masks.get(character)
    if reference is not None:
        return GlyphMaskSource(reference, 'reference-board')
    if source_font is None:
        raise RuntimeError(
            f'{unicode_key(character)} {character!r} is new and has no approved override or component '
            'recipe. Supply --noto-font to create a review-only fallback.'
        )
    return GlyphMaskSource(source_mask(character, source_font, style), 'noto-fallback')


def build_font(
    root: Path,
    noto_path: Path | None,
    output_dir: Path,
    style: StyleConfig,
    characters: list[str],
    recipes: dict[str, Any],
    preserve_existing: bool,
    require_approved_new_glyphs: bool,
    locked_characters: set[str] | None = None,
) -> GlyphBuildResult:
    ttf_path = output_dir / f'{style.file_stem}.ttf'
    woff2_path = output_dir / f'{style.file_stem}.woff2'
    seed_fingerprints = font_glyph_fingerprints(ttf_path) if preserve_existing and ttf_path.exists() else {}
    seed = load_seed_font(ttf_path, style.family) if preserve_existing else None
    reference_masks = extract_reference_masks(style)
    source_font = ImageFont.truetype(str(noto_path), 280) if noto_path is not None else None
    glyph_order = ['.notdef', 'space']
    if seed is not None:
        glyphs = {
            '.notdef': seed['special']['.notdef'][0],
            'space': seed['special']['space'][0],
        }
        metrics = {
            '.notdef': seed['special']['.notdef'][1],
            'space': seed['special']['space'][1],
        }
    else:
        glyphs = {'.notdef': notdef_glyph(), 'space': TTGlyphPen(None).glyph()}
        metrics = {'.notdef': (700, 0), 'space': (320, 0)}
    cmap = {ord(' '): 'space'}
    preserved_characters: set[str] = set()
    source_by_character: dict[str, str] = {' ': 'seed-locked' if seed is not None else 'generated'}

    for character in characters:
        if character == ' ':
            continue
        name = glyph_name(character)
        seed_character = seed['characters'].get(character) if seed is not None else None
        is_locked_seed = seed_character is not None and (
            locked_characters is None or character in locked_characters
        )
        if is_locked_seed:
            glyphs[name] = seed_character[0]
            metrics[name] = seed_character[1]
            preserved_characters.add(character)
            source_by_character[character] = 'seed-locked'
        else:
            resolved = resolve_new_glyph_source(
                root,
                style,
                character,
                reference_masks,
                recipes,
                source_font,
            )
            if require_approved_new_glyphs and resolved.source == 'noto-fallback':
                raise RuntimeError(
                    f'{style.family} {unicode_key(character)} {character!r} only has a Noto fallback. '
                    'Add an approved glyph override or component recipe before release.'
                )
            if resolved.is_normalized:
                normalized = resolved.mask
                advance = resolved.advance or advance_width(character)
            else:
                normalized, advance = normalize_mask(resolved.mask, character)
            glyphs[name] = mask_to_glyph(normalized)
            metrics[name] = (advance, 0)
            source_by_character[character] = resolved.source
        glyph_order.append(name)
        cmap[ord(character)] = name

    builder = FontBuilder(UPM, isTTF=True)
    builder.font['head'].created = FONT_TIMESTAMP
    builder.font['head'].modified = FONT_TIMESTAMP
    builder.setupGlyphOrder(glyph_order)
    builder.setupCharacterMap(cmap)
    builder.setupGlyf(glyphs)
    builder.setupHorizontalMetrics(metrics)
    builder.setupHorizontalHeader(ascent=ASCENT, descent=DESCENT)
    builder.setupNameTable(
        {
            'familyName': style.family,
            'styleName': 'Regular',
            'uniqueFontIdentifier': f'1.000;MDASH;{style.file_stem}',
            'fullName': style.family,
            'psName': style.family.replace(' ', ''),
            'version': 'Version 1.100',
            'copyright': (
                'Dashboard subset design 2026. Portions derived from Noto Sans CJK SC, '
                'Copyright 2014-2021 Adobe.'
            ),
            'licenseDescription': OFL_SUMMARY,
            'licenseInfoURL': 'https://openfontlicense.org',
        }
    )
    builder.setupOS2(
        sTypoAscender=ASCENT,
        sTypoDescender=DESCENT,
        sTypoLineGap=80,
        usWinAscent=ASCENT,
        usWinDescent=abs(DESCENT),
        sxHeight=560,
        sCapHeight=800,
        achVendID='MDSH',
        fsType=0,
        usWeightClass=style.weight_class,
    )
    builder.setupPost()
    builder.setupMaxp()

    builder.save(ttf_path)
    woff_font = TTFont(ttf_path, recalcTimestamp=False)
    woff_font.flavor = 'woff2'
    woff_font.save(woff2_path)
    woff_font.close()

    output_fingerprints = font_glyph_fingerprints(ttf_path)
    changed_preserved = [
        character
        for character in preserved_characters
        if output_fingerprints.get(character) != seed_fingerprints.get(character)
    ]
    if changed_preserved:
        raise RuntimeError(
            f'{style.family} changed preserved glyph outlines: {"".join(sorted(changed_preserved))}'
        )
    return GlyphBuildResult(
        ttf_path=ttf_path,
        woff2_path=woff2_path,
        preserved_characters=preserved_characters,
        source_by_character=source_by_character,
    )


def fit_font(path: Path, text: str, max_width: int, start_size: int) -> ImageFont.FreeTypeFont:
    size = start_size
    while size > 12:
        font = ImageFont.truetype(str(path), size)
        if font.getlength(text) <= max_width:
            return font
        size -= 2
    return ImageFont.truetype(str(path), size)


def render_preview(
    output_path: Path,
    font_path: Path,
    style: StyleConfig,
    title_values: list[str],
) -> None:
    width, height = 1600, 920
    image = Image.new('RGB', (width, height), '#020b18')
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((28, 28, width - 28, height - 28), radius=32, outline='#23769d', width=2)
    for x in range(80, width - 60, 80):
        draw.line((x, 80, x, height - 70), fill='#08243b', width=1)
    for y in range(90, height - 50, 80):
        draw.line((70, y, width - 70, y), fill='#08243b', width=1)

    label_font = ImageFont.load_default(size=24)
    draw.text((78, 62), style.family, font=label_font, fill='#56d8ef')
    title_font = fit_font(font_path, REFERENCE_TITLE, width - 150, 102)
    title_width = draw.textlength(REFERENCE_TITLE, font=title_font)
    draw.text(((width - title_width) / 2, 155), REFERENCE_TITLE, font=title_font, fill=style.preview_color)

    module_titles = [value for value in title_values if value != REFERENCE_TITLE and not value.startswith('近')]
    rows = (' · '.join(module_titles[:5]), ' · '.join(module_titles[5:]))
    row_y = 390
    for row in rows:
        row_font = fit_font(font_path, row, width - 170, 43)
        row_width = draw.textlength(row, font=row_font)
        draw.text(((width - row_width) / 2, row_y), row, font=row_font, fill='#9eeafb')
        row_y += 96

    numeric = '0123456789   99.9%   +58.8%   2026-07-16'
    numeric_font = fit_font(font_path, numeric, width - 170, 88)
    numeric_width = draw.textlength(numeric, font=numeric_font)
    draw.text(((width - numeric_width) / 2, 670), numeric, font=numeric_font, fill=style.preview_color)
    draw.text((78, 847), 'ACTUAL TTF RENDER / DASHBOARD-ONLY SUBSET', font=label_font, fill='#4b9fb8')
    image.save(output_path, optimize=True)


def verify_font(path: Path, required: list[str]) -> None:
    font = TTFont(path)
    missing = [character for character in required if ord(character) not in font.getBestCmap()]
    if missing:
        raise RuntimeError(f'{path.name} missing characters: {"".join(missing)}')
    required_tables = {'cmap', 'glyf', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post'}
    absent_tables = required_tables.difference(font.keys())
    if absent_tables:
        raise RuntimeError(f'{path.name} missing tables: {sorted(absent_tables)}')
    font.close()


def mapped_characters(path: Path) -> set[str]:
    if not path.exists():
        return set()
    font = TTFont(path)
    characters = {chr(codepoint) for codepoint in font.getBestCmap()}
    font.close()
    return characters


def main() -> None:
    args = parse_args()
    root = args.project_root.resolve()
    noto_path = args.noto_font.resolve() if args.noto_font else None
    if noto_path is not None and not noto_path.exists():
        raise RuntimeError(f'Noto source font does not exist: {noto_path}')
    canonical_output_dir = root / 'src/assets/fonts'
    output_dir = args.output_dir.resolve() if args.output_dir else canonical_output_dir
    if args.accept_current_glyphs and output_dir != canonical_output_dir:
        raise RuntimeError('--accept-current-glyphs is only allowed for the canonical src/assets/fonts output')
    preview_dir = output_dir / 'previews'
    output_dir.mkdir(parents=True, exist_ok=True)
    preview_dir.mkdir(parents=True, exist_ok=True)
    extra_glyphs_path = (
        args.extra_glyphs_file.resolve()
        if args.extra_glyphs_file
        else default_extra_glyphs_path(root)
    )
    characters, title_values = required_characters(root, extra_glyphs_path)
    styles = style_configs(root)
    recipes = load_component_recipes(default_component_recipe_path(root))
    preserve_existing = not args.refresh_existing
    glyph_lock_path = default_glyph_lock_path(root)
    locked_by_style: dict[str, dict[str, str]] = {}

    if preserve_existing:
        for style in styles:
            seed_path = canonical_output_dir / f'{style.file_stem}.ttf'
            if seed_path.exists():
                locked_by_style[style.key] = verify_glyph_lock(glyph_lock_path, style, seed_path)
                characters = sorted(set(characters) | mapped_characters(seed_path), key=ord)
            else:
                locked_by_style[style.key] = {}

    if noto_path is not None:
        verify_build_lock(default_build_lock_path(root), noto_path, args.update_build_lock)
    elif args.update_build_lock:
        raise RuntimeError('--update-build-lock requires --noto-font')

    if preserve_existing and output_dir != canonical_output_dir:
        for style in styles:
            canonical_seed = canonical_output_dir / f'{style.file_stem}.ttf'
            if canonical_seed.exists():
                shutil.copy2(canonical_seed, output_dir / canonical_seed.name)

    summaries: list[str] = []
    reports: dict[str, Any] = {}
    results: dict[str, GlyphBuildResult] = {}
    for style in styles:
        result = build_font(
            root,
            noto_path,
            output_dir,
            style,
            characters,
            recipes,
            preserve_existing=preserve_existing,
            require_approved_new_glyphs=args.require_approved_new_glyphs,
            locked_characters=set(locked_by_style.get(style.key, {})),
        )
        results[style.key] = result
        verify_font(result.ttf_path, characters)
        verify_font(result.woff2_path, characters)
        preview_path = preview_dir / f'{style.file_stem}.png'
        render_preview(preview_path, result.ttf_path, style, title_values)
        counts = Counter(result.source_by_character.values())
        locked_characters = set(locked_by_style.get(style.key, {}))
        output_fingerprints = font_glyph_fingerprints(result.ttf_path)
        unlocked_characters = sorted(set(output_fingerprints) - locked_characters, key=ord)
        reports[style.key] = {
            'family': style.family,
            'preserved_characters': ''.join(sorted(result.preserved_characters, key=ord)),
            'new_sources': {
                character: source
                for character, source in sorted(result.source_by_character.items(), key=lambda item: ord(item[0]))
                if source != 'seed-locked'
            },
            'source_counts': dict(sorted(counts.items())),
            'unlocked_characters': ''.join(unlocked_characters),
            'ttf_sha256': sha256_file(result.ttf_path),
            'woff2_sha256': sha256_file(result.woff2_path),
        }
        summaries.append(
            f'{style.family}: {len(characters)} mapped characters, '
            f'{counts.get("seed-locked", 0)} preserved, '
            f'{counts.get("approved-override", 0) + counts.get("component-recipe", 0)} approved new, '
            f'{counts.get("noto-fallback", 0)} review-only fallback.'
        )

    (output_dir / 'dashboard-subset-glyphs.txt').write_text(
        ''.join(characters) + '\n\n' + '\n'.join(title_values) + '\n',
        encoding='utf-8',
    )
    if args.accept_current_glyphs:
        unapproved = {
            style.key: ''.join(
                character
                for character, source in results[style.key].source_by_character.items()
                if source == 'noto-fallback'
            )
            for style in styles
        }
        unapproved = {key: value for key, value in unapproved.items() if value}
        if unapproved:
            raise RuntimeError(
                'Cannot accept review-only Noto fallback glyphs. Add approved overrides or '
                f'component recipes first: {unapproved}'
            )
        glyph_lock = {
            'version': 1,
            'families': {
                style.key: font_glyph_fingerprints(results[style.key].ttf_path)
                for style in styles
            },
        }
        write_json(glyph_lock_path, glyph_lock)
        for style in styles:
            reports[style.key]['unlocked_characters'] = ''
        summaries.append(f'Accepted current glyph fingerprints: {glyph_lock_path}')

    try:
        extra_glyphs_label = str(extra_glyphs_path.relative_to(root))
    except ValueError:
        extra_glyphs_label = str(extra_glyphs_path)
    write_json(
        output_dir / 'font-build-report.json',
        {
            'pipeline_version': PIPELINE_VERSION,
            'extra_glyphs_file': extra_glyphs_label,
            'families': reports,
        },
    )

    print('\n'.join(summaries))


if __name__ == '__main__':
    main()
