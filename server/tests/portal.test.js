import test from 'node:test';
import assert from 'node:assert/strict';
import { buildParentPortalUrl, generateAccessToken } from '../src/utils/portal.js';

test('generateAccessToken creates a non-empty unique-looking token', () => {
  const token = generateAccessToken();
  assert.equal(typeof token, 'string');
  assert.ok(token.length > 20);
  assert.ok(!token.includes(' '));
});

test('buildParentPortalUrl includes studentId and accessToken', () => {
  const url = buildParentPortalUrl('student-1', 'token-123');
  assert.equal(url, 'http://localhost:5173/parent/student-1/token-123');
});
