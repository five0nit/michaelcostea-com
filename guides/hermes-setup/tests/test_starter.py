"""Offline installer and public-pack tests. Run: python3 -m unittest discover -s tests -v"""
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('starter', ROOT / 'install_templates.py')
installer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)
EXPECTED = {'generalist-workflow', 'brief2ship', 'verify-before-done',
            'evidence-led-research', 'project-handoff', 'public-content-check',
            'bounded-autonomy', 'plainspoken-output'}


class StarterTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='hermes-starter-test-')
        self.addCleanup(self.temp.cleanup)
        self.home = Path(self.temp.name) / 'profile'
        self.home.mkdir()
        (self.home / 'config.yaml').write_text('model:\n  default: test-only-no-provider\n')

    def snapshot(self):
        return {str(p.relative_to(self.home)): p.read_bytes()
                for p in self.home.rglob('*') if p.is_file()}

    def test_exact_eight_skills(self):
        self.assertEqual({p.parent.name for p in (ROOT/'skills').glob('*/SKILL.md')}, EXPECTED)

    def test_skill_frontmatter_and_descriptions(self):
        for name in EXPECTED:
            text = (ROOT/'skills'/name/'SKILL.md').read_text()
            self.assertTrue(text.startswith('---\n'))
            self.assertIn(f'\nname: {name}\n', text)
            self.assertRegex(text, r'\ndescription: "(?:Use|Find) ')
            self.assertGreater(len(text.split('---\n', 2)[2].strip()), 100)

    def test_dry_run_changes_nothing(self):
        before = self.snapshot()
        result = installer.run(ROOT, self.home, False)
        self.assertEqual(result['mode'], 'dry-run')
        self.assertEqual(result['managed_files'], 16)
        self.assertEqual(len(result['changes']), 16)
        self.assertEqual(before, self.snapshot())
        self.assertFalse((self.home/'backups').exists())

    def test_apply_copies_exact_bytes(self):
        result = installer.run(ROOT, self.home, True)
        self.assertTrue(result['verified'])
        for source, target in installer.collect(ROOT, self.home):
            self.assertEqual(source.read_bytes(), target.read_bytes())

    def test_existing_managed_files_backed_up(self):
        (self.home/'SOUL.md').write_text('Original local persona\n')
        p = self.home/'skills'/'generalist-workflow'/'SKILL.md'
        p.parent.mkdir(parents=True)
        p.write_text('Original local skill\n')
        result = installer.run(ROOT, self.home, True)
        b = Path(result['backup'])
        self.assertEqual((b/'SOUL.md').read_text(), 'Original local persona\n')
        self.assertEqual((b/'skills/generalist-workflow/SKILL.md').read_text(), 'Original local skill\n')
        manifest = json.loads((b/'manifest.json').read_text())
        self.assertEqual(set(manifest['replaced']), {'SOUL.md','skills/generalist-workflow/SKILL.md'})
        self.assertEqual(len(manifest['new_files']), 14)

    def test_credentials_config_memory_and_unrelated_skill_untouched(self):
        untouched = {'config.yaml': 'model: test-only\n', '.env': '# non-secret test fixture\n',
                     'auth.json': '{}\n', 'memories/USER.md': 'Fixture user\n',
                     'memories/MEMORY.md': 'Fixture memory\n', 'cron/jobs.json': '[]\n',
                     'skills/unrelated/SKILL.md': 'Keep this\n', 'state.db': 'not a real database\n'}
        for rel, text in untouched.items():
            p = self.home/rel
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(text)
        installer.run(ROOT, self.home, True)
        for rel, text in untouched.items():
            self.assertEqual((self.home/rel).read_text(), text)

    def test_second_apply_is_noop(self):
        installer.run(ROOT, self.home, True)
        before = self.snapshot()
        result = installer.run(ROOT, self.home, True)
        self.assertEqual(result['changes'], [])
        self.assertTrue(result['verified'])
        self.assertNotIn('backup', result)
        self.assertEqual(before, self.snapshot())

    def test_missing_home_rejected(self):
        with self.assertRaisesRegex(ValueError, 'does not exist'):
            installer.run(ROOT, self.home/'missing', False)

    def test_missing_config_rejected(self):
        (self.home/'config.yaml').unlink()
        with self.assertRaisesRegex(ValueError, 'No config.yaml'):
            installer.run(ROOT, self.home, False)

    def test_symlink_home_rejected(self):
        linked = self.home.parent/'alias'
        linked.symlink_to(self.home, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'symlink'):
            installer.run(ROOT, linked, True)

    def test_symlink_target_rejected(self):
        external = self.home.parent/'private-file'
        external.write_text('Do not alter\n')
        (self.home/'SOUL.md').symlink_to(external)
        with self.assertRaisesRegex(ValueError, 'symlink'):
            installer.run(ROOT, self.home, True)
        self.assertEqual(external.read_text(), 'Do not alter\n')

    def test_symlink_skills_directory_rejected(self):
        external = self.home.parent/'other-skills'
        external.mkdir()
        (self.home/'skills').symlink_to(external, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, 'symlink'):
            installer.run(ROOT, self.home, True)
        self.assertEqual(list(external.iterdir()), [])

    def test_directory_target_rejected_without_partial_install(self):
        (self.home/'SOUL.md').mkdir()
        with self.assertRaisesRegex(ValueError, 'regular file'):
            installer.run(ROOT, self.home, True)
        self.assertFalse((self.home/'skills').exists())

    def test_rollback_on_write_failure(self):
        (self.home/'SOUL.md').write_text('Original persona\n')
        real = installer.atomic_write
        calls = 0
        def fail_second(target, data):
            nonlocal calls
            calls += 1
            if calls == 2:
                raise OSError('Injected test write failure')
            return real(target, data)
        with patch.object(installer, 'atomic_write', side_effect=fail_second):
            with self.assertRaisesRegex(OSError, 'Injected test'):
                installer.run(ROOT, self.home, True)
        self.assertEqual((self.home/'SOUL.md').read_text(), 'Original persona\n')
        self.assertFalse(list((self.home/'skills').glob('*/SKILL.md')))

    def test_cli_dry_run_from_different_working_directory(self):
        proc = subprocess.run([sys.executable, str(ROOT/'install_templates.py'), '--profile-home', str(self.home)],
                              cwd=self.temp.name, capture_output=True, text=True)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        self.assertEqual(json.loads(proc.stdout)['managed_files'], 16)
        self.assertFalse((self.home/'SOUL.md').exists())

    def test_incomplete_pack_rejected(self):
        import shutil
        partial = self.home.parent/'partial-pack'
        shutil.copytree(ROOT/'templates', partial/'templates')
        shutil.copytree(ROOT/'skills', partial/'skills')
        (partial/'skills/plainspoken-output/SKILL.md').unlink()
        with self.assertRaisesRegex(ValueError, 'incomplete'):
            installer.run(partial, self.home, True)
        self.assertFalse((self.home/'SOUL.md').exists())

    def test_brief2ship_support_files_complete_and_pinned(self):
        import hashlib
        installer.run(ROOT, self.home, True)
        self.assertEqual(len(installer.BRIEF2SHIP_HASHES), 8)
        for relative, digest in installer.BRIEF2SHIP_HASHES.items():
            file = self.home/'skills/brief2ship'/relative
            self.assertEqual(hashlib.sha256(file.read_bytes()).hexdigest(), digest)

    def test_missing_brief2ship_reference_rejected_before_write(self):
        import shutil
        partial = self.home.parent/'partial-brief2ship'
        shutil.copytree(ROOT/'templates', partial/'templates')
        shutil.copytree(ROOT/'skills', partial/'skills')
        (partial/'skills/brief2ship/references/delivery-and-research.md').unlink()
        before = self.snapshot()
        with self.assertRaisesRegex(ValueError, 'incomplete'):
            installer.run(partial, self.home, True)
        self.assertEqual(before, self.snapshot())

    def test_modified_brief2ship_reference_rejected_before_write(self):
        import shutil
        partial = self.home.parent/'modified-brief2ship'
        shutil.copytree(ROOT/'templates', partial/'templates')
        shutil.copytree(ROOT/'skills', partial/'skills')
        (partial/'skills/brief2ship/references/delivery-and-research.md').write_text('Changed source')
        before = self.snapshot()
        with self.assertRaisesRegex(ValueError, 'byte mismatch'):
            installer.run(partial, self.home, True)
        self.assertEqual(before, self.snapshot())

    def test_canonical_brief2ship_workflow(self):
        guide = (ROOT/'GUIDE.md').read_text()
        for marker in ['brief2ship discover', '1c6e4c7155c38fa76a8be05f418070d8be32ae1f', '--test-top 0', 'degraded preflight']:
            self.assertIn(marker, guide)
        self.assertFalse((ROOT/'skills/repo-first-build').exists())

    def test_no_live_state_in_package(self):
        forbidden = {'.env','auth.json','state.db','jobs.json','gateway_state.json'}
        found = [str(p.relative_to(ROOT)) for p in ROOT.rglob('*') if p.is_file() and p.name in forbidden]
        self.assertEqual(found, [])

    def test_pack_relative_links_resolve(self):
        for md in [ROOT/'GUIDE.md', ROOT/'README.md']:
            for target in re.findall(r'\]\(([^)]+)\)', md.read_text()):
                if '://' not in target and not target.startswith('#'):
                    self.assertTrue((md.parent/target.split('#')[0]).is_file(), (md.name,target))

    def test_soul_names_only_bundled_starter_skills(self):
        text = (ROOT/'templates/SOUL.md').read_text()
        named = set(re.findall(r'^- ([a-z][a-z0-9-]+)$', text, flags=re.M))
        self.assertEqual(named, EXPECTED)


class GuideReviewTests(unittest.TestCase):
    """Content regressions, not live provider/gateway/scheduler tests."""

    def setUp(self):
        self.guide = (ROOT/'GUIDE.md').read_text()

    def test_project_context_pinned_before_gateway_start(self):
        command = 'hermes -p operator config set terminal.cwd "$HOME/projects/hermes-lab"'
        self.assertLess(self.guide.index(command), self.guide.index('hermes -p operator gateway run'))
        service = self.guide.split('## 13.', 1)[1].split('## 14.', 1)[0]
        for evidence in ['terminal.cwd', 'pwd', 'AGENTS.md', '/new']:
            self.assertIn(evidence, service)

    def test_profile_authentication_boundary_is_explicit(self):
        profiles = self.guide.split('## 4.', 1)[1].split('## 5.', 1)[0]
        for boundary in ['does not establish credential isolation', '~/.hermes/auth.json',
                         'OS-user `HOME`', 'gh auth status']:
            self.assertIn(boundary, profiles)

    def test_shared_update_scope_precedes_executable_command(self):
        updates = self.guide.split('## 22.', 1)[1].split('## 23.', 1)[0]
        self.assertLess(updates.index('full installation-wide update and restart scope'),
                        updates.index('\nhermes update\n'))
        self.assertIn('check every affected gateway', updates)

    def test_scheduler_has_post_run_history_and_output_steps(self):
        cron = self.guide.split('## 17.', 1)[1].split('## 18.', 1)[0]
        after_resume = cron.split('hermes -p operator cron resume "$JOB_ID"', 1)[1]
        for step in ['cron list --all', 'cron runs "$JOB_ID"', 'version lacks `cron runs`',
                     'config path', 'less "$PROFILE_HOME/cron/output/$JOB_ID/"*.md']:
            self.assertIn(step, after_resume)


if __name__ == '__main__':
    unittest.main()
