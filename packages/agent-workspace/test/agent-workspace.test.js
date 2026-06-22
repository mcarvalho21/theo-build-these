import test from 'node:test';
import assert from 'node:assert/strict';
import { branchAgentTask, createGroup, createPost, createWorkspace, exportWorkspace, feed, importWorkspace, reply, threadTree, validateWorkspace } from '../src/agent-workspace.js';

let tick = 0;
const ws = () => createWorkspace(() => `2026-01-01T00:00:0${tick++}.000Z`);

test('posts live inside groups and feed sorts by bump time', () => {
  const w = ws();
  const g = createGroup(w, 'Felix Workbench');
  const a = createPost(w, g.id, { title: 'A', body: 'old' });
  const b = createPost(w, g.id, { title: 'B', body: 'new' });
  reply(w, a.id, { body: 'bump old post' });
  assert.deepEqual(feed(w, g.id).map(p => p.id), [a.id, b.id]);
});

test('threadTree supports nested replies', () => {
  const w = ws();
  const g = createGroup(w, 'Agents');
  const p = createPost(w, g.id, { title: 'Task', body: 'do it' });
  const r = reply(w, p.id, { body: 'root' });
  reply(w, p.id, { parentReplyId: r.id, body: 'nested' });
  assert.equal(threadTree(w, p.id).replies[0].children[0].body, 'nested');
});

test('branchAgentTask creates typed agent task replies', () => {
  const w = ws();
  const g = createGroup(w, 'Agents');
  const p = createPost(w, g.id, { title: 'Investigate', body: 'x' });
  const task = branchAgentTask(w, p.id, 'go research', 'felix');
  assert.equal(task.kind, 'agent-task');
  assert.equal(task.author, 'felix');
});

test('workspaces export to JSON and import with a fresh clock', () => {
  const w = ws();
  const g = createGroup(w, 'Durable Agents');
  const p = createPost(w, g.id, { title: 'Persist me', body: 'context' });
  reply(w, p.id, { body: 'saved reply' });

  const json = exportWorkspace(w);
  assert(!json.includes('now'));

  const restored = importWorkspace(json, () => '2026-01-02T00:00:00.000Z');
  assert.equal(threadTree(restored, p.id).replies[0].body, 'saved reply');
  const next = createPost(restored, g.id, { title: 'After restore', body: 'fresh timestamp' });
  assert.equal(next.createdAt, '2026-01-02T00:00:00.000Z');
});

test('validateWorkspace reports broken references before import succeeds', () => {
  assert.throws(
    () => validateWorkspace({ groups: { g: { id: 'g', postIds: ['missing'] } }, posts: {}, replies: {} }),
    /missing post/
  );
});
