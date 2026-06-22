import test from 'node:test';
import assert from 'node:assert/strict';
import { branchAgentTask, createGroup, createPost, createWorkspace, feed, reply, threadTree } from '../src/agent-workspace.js';

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
