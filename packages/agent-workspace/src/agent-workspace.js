export function createWorkspace(now = () => new Date().toISOString()) {
  return { groups: {}, posts: {}, replies: {}, now };
}

export function exportWorkspace(ws) {
  return JSON.stringify(snapshotWorkspace(ws), null, 2);
}

export function importWorkspace(json, now = () => new Date().toISOString()) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  const workspace = createWorkspace(now);
  workspace.groups = data.groups || {};
  workspace.posts = data.posts || {};
  workspace.replies = data.replies || {};
  validateWorkspace(workspace);
  return workspace;
}

export function snapshotWorkspace(ws) {
  return {
    groups: ws.groups || {},
    posts: ws.posts || {},
    replies: ws.replies || {}
  };
}

export function validateWorkspace(ws) {
  const errors = [];
  for (const group of Object.values(ws.groups || {})) {
    for (const postId of group.postIds || []) {
      if (!ws.posts?.[postId]) errors.push(`group ${group.id} references missing post ${postId}`);
    }
  }
  for (const post of Object.values(ws.posts || {})) {
    if (!ws.groups?.[post.groupId]) errors.push(`post ${post.id} references missing group ${post.groupId}`);
    for (const replyId of post.replyIds || []) {
      if (!ws.replies?.[replyId]) errors.push(`post ${post.id} references missing reply ${replyId}`);
    }
  }
  for (const replyItem of Object.values(ws.replies || {})) {
    if (!ws.posts?.[replyItem.postId]) errors.push(`reply ${replyItem.id} references missing post ${replyItem.postId}`);
    if (replyItem.parentReplyId && !ws.replies?.[replyItem.parentReplyId]) errors.push(`reply ${replyItem.id} references missing parent ${replyItem.parentReplyId}`);
    for (const childId of replyItem.childReplyIds || []) {
      if (!ws.replies?.[childId]) errors.push(`reply ${replyItem.id} references missing child ${childId}`);
    }
  }
  if (errors.length) throw new Error(`Invalid workspace: ${errors.join('; ')}`);
  return true;
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
