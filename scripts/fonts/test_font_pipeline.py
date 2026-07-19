from __future__ import annotations

import json
import os
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[1]
sys.path.insert(0, str(SCRIPT_DIR))

import build_dashboard_subset_fonts as pipeline  # noqa: E402


class FontPipelineTest(unittest.TestCase):
    def test_extra_glyph_file_ignores_comments_and_line_breaks(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            path = Path(temporary_directory) / 'extra.txt'
            path.write_text('# future titles\n资产\n\n预警\n', encoding='utf-8')

            self.assertEqual(pipeline.read_extra_glyphs(path), '资产预警')

    def test_component_recipe_composes_a_normalized_glyph_cell(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            component_dir = root / 'scripts/fonts/components/heavy'
            component_dir.mkdir(parents=True)
            component = np.zeros((20, 10), dtype=np.uint8)
            component[2:18, 2:8] = 255
            Image.fromarray(component).save(component_dir / 'stem.png')
            recipes = {
                'version': 1,
                'styles': {
                    'heavy': {
                        'characters': {
                            'U+8D44': {
                                'advance': 1000,
                                'components': [
                                    {
                                        'file': 'stem.png',
                                        'x': 100,
                                        'y': 200,
                                        'width': 300,
                                        'height': 500,
                                    }
                                ],
                            }
                        }
                    }
                },
            }

            result = pipeline.compose_component_recipe(
                root,
                pipeline.style_configs(PROJECT_ROOT)[0],
                '资',
                recipes,
            )

            self.assertIsNotNone(result)
            mask, advance = result or (np.zeros((1, 1)), 0)
            self.assertEqual(mask.shape, (1000, 1000))
            self.assertEqual(advance, 1000)
            self.assertGreater(int(mask[200:700, 100:400].sum()), 0)
            self.assertEqual(int(mask[:100].sum()), 0)

    def test_seed_rebuild_preserves_every_existing_outline(self) -> None:
        style = pipeline.style_configs(PROJECT_ROOT)[0]
        source_ttf = PROJECT_ROOT / 'src/assets/fonts' / f'{style.file_stem}.ttf'
        before = pipeline.font_glyph_fingerprints(source_ttf)
        characters = sorted(before, key=ord)

        with tempfile.TemporaryDirectory() as temporary_directory:
            output_dir = Path(temporary_directory)
            shutil.copy2(source_ttf, output_dir / source_ttf.name)
            result = pipeline.build_font(
                PROJECT_ROOT,
                None,
                output_dir,
                style,
                characters,
                {'version': 1, 'styles': {}},
                preserve_existing=True,
                require_approved_new_glyphs=True,
                locked_characters=set(characters),
            )
            after = pipeline.font_glyph_fingerprints(result.ttf_path)
            first_ttf_hash = pipeline.sha256_file(result.ttf_path)
            first_woff2_hash = pipeline.sha256_file(result.woff2_path)
            second_result = pipeline.build_font(
                PROJECT_ROOT,
                None,
                output_dir,
                style,
                characters,
                {'version': 1, 'styles': {}},
                preserve_existing=True,
                require_approved_new_glyphs=True,
                locked_characters=set(characters),
            )
            second_ttf_hash = pipeline.sha256_file(second_result.ttf_path)
            second_woff2_hash = pipeline.sha256_file(second_result.woff2_path)

        self.assertEqual(after, before)
        self.assertEqual(second_ttf_hash, first_ttf_hash)
        self.assertEqual(second_woff2_hash, first_woff2_hash)
        self.assertEqual(result.preserved_characters, set(characters) - {' '})
        self.assertTrue(all(source == 'seed-locked' for source in result.source_by_character.values()))

    @unittest.skipUnless(os.environ.get('NOTO_CJK_FONT'), 'NOTO_CJK_FONT is required')
    def test_new_fallback_is_reported_and_rejected_by_release_gate(self) -> None:
        style = pipeline.style_configs(PROJECT_ROOT)[0]
        source_ttf = PROJECT_ROOT / 'src/assets/fonts' / f'{style.file_stem}.ttf'
        before = pipeline.font_glyph_fingerprints(source_ttf)
        characters = sorted(set(before) | {'资'}, key=ord)
        noto_path = Path(os.environ['NOTO_CJK_FONT'])

        with tempfile.TemporaryDirectory() as temporary_directory:
            output_dir = Path(temporary_directory)
            shutil.copy2(source_ttf, output_dir / source_ttf.name)
            result = pipeline.build_font(
                PROJECT_ROOT,
                noto_path,
                output_dir,
                style,
                characters,
                {'version': 1, 'styles': {}},
                preserve_existing=True,
                require_approved_new_glyphs=False,
                locked_characters=set(before),
            )
            after = pipeline.font_glyph_fingerprints(result.ttf_path)

            self.assertEqual(result.source_by_character['资'], 'noto-fallback')
            self.assertEqual({character: after[character] for character in before}, before)
            with self.assertRaisesRegex(RuntimeError, 'only has a Noto fallback'):
                pipeline.build_font(
                    PROJECT_ROOT,
                    noto_path,
                    output_dir,
                    style,
                    characters,
                    {'version': 1, 'styles': {}},
                    preserve_existing=True,
                    require_approved_new_glyphs=True,
                    locked_characters=set(before),
                )

    def test_glyph_lock_rejects_a_changed_seed(self) -> None:
        style = pipeline.style_configs(PROJECT_ROOT)[0]
        source_ttf = PROJECT_ROOT / 'src/assets/fonts' / f'{style.file_stem}.ttf'
        with tempfile.TemporaryDirectory() as temporary_directory:
            lock_path = Path(temporary_directory) / 'lock.json'
            lock_path.write_text(
                json.dumps({'version': 1, 'families': {'heavy': {'医': 'not-the-real-hash'}}}),
                encoding='utf-8',
            )

            with self.assertRaisesRegex(RuntimeError, 'does not match the locked glyph outlines'):
                pipeline.verify_glyph_lock(lock_path, style, source_ttf)


if __name__ == '__main__':
    unittest.main()
