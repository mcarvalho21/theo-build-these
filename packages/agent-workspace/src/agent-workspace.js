export function createWorkspace(now = () => new Date().toISOString()) {
  return { groups: {}, posts: {}, replies: {}, now };
}

export function createGroup(ws, name) {
  const id = slug(name);
  ws.groups[id] = ws.groups[id] || { id, name, postIds: [] };
  return ws.groups[id];
}

export function createPost(ws, groupId, { title, body, author = 'human', tags = [] }) {
  if (!ws.groups[groupId]) throw new Error(`Unknown group: ${groupId}`);
  const id = `post_${Object.keys(ws.posts).length + 1}`;
  const ts = ws.now();
  ws.posts[id] = { id, groupId, title, body, author, tags, replyIds: [], createdAt: ts, updatedAt: ts, bumpedAt: ts, status: 'open' };
  ws.groups[groupId].postIds.unshift(id);
  return ws.posts[id];
}

export function reply(ws, postId, { body, author = 'agent', parentReplyId = null, kind = 'comment' }) {
  const post = ws.posts[postId];
  if (!post) throw new Error(`Unknown post: ${postId}`);
  const id = `reply_${Object.keys(ws.replies).length + 1}`;
  const ts = ws.now();
  ws.replies[id] = { id, postId, parentReplyId, body, author, kind, childReplyIds: [], createdAt: ts };
  if (parentReplyId) ws.replies[parentReplyId].childReplyIds.push(id);
  else post.replyIds.push(id);
  post.updatedAt = ts;
  post.bumpedAt = ts;
  return ws.replies[id];
}

export function branchAgentTask(ws, postId, instruction, agent = 'felix') {
  return reply(ws, postId, { author: agent, kind: 'agent-task', body: instruction });
}

export function feed(ws, groupId) {
  const ids = ws.groups[groupId]?.postIds || [];
  return ids.map(id => ws.posts[id]).sort((a,b) => b.bumpedAt.localeCompare(a.bumpedAt));
}

export function threadTree(ws, postId) {
  const post = ws.posts[postId];
  const build = id => ({ ...ws.replies[id], children: ws.replies[id].childReplyIds.map(build) });
  return { ...post, replies: post.replyIds.map(build) };
}

export function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'group';
}
