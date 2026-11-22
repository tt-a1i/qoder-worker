import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const skillPath = path.join(root, 'SKILL.md');
const content = fs.readFileSync(skillPath, 'utf8');

test('SKILL.md has valid frontmatter with matching name and description', () => {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(content);
  assert.ok(match, 'SKILL.md must begin with YAML frontmatter');
  const frontmatter = match[1];
  assert.match(frontmatter, /^name:\s*qoder-worker$/m);
  assert.match(frontmatter, /^description:/m);
});

test('SKILL.md contains no machine-specific paths or leaked secrets', () => {
  assert.doesNotMatch(content, /\/Users\/[a-zA-Z0-9._-]+\//);
  assert.doesNotMatch(content, /sk-[a-zA-Z0-9]{20,}/);
});

test('SKILL.md documents core qodercli flags and model defaults', () => {
  assert.match(content, /qodercli -p -w "\$repo"/);
  assert.match(content, /--strict-mcp-config --setting-sources local/);
  assert.match(content, /--session-id "\$sid"/);
  assert.match(content, /-r "\$sid"/);
  assert.match(content, /DeepSeek-Flash/);
  assert.match(content, /Ultimate/);
  assert.match(content, /qodercli --list-models/);
});

test('README files and LICENSE exist and cross-link cleanly', () => {
  for (const file of ['README.md', 'README.en.md', 'LICENSE']) {
    assert.ok(fs.existsSync(path.join(root, file)), `${file} must exist`);
  }
  assert.match(fs.readFileSync(path.join(root, 'README.md'), 'utf8'), /README\.en\.md/);
  assert.match(fs.readFileSync(path.join(root, 'README.en.md'), 'utf8'), /README\.md/);
});
