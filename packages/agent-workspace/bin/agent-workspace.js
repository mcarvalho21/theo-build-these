#!/usr/bin/env node
import { branchAgentTask, createGroup, createPost, createWorkspace, feed, reply, threadTree } from '../src/agent-workspace.js';

const ws = createWorkspace();
const group = createGroup(ws, process.argv[2] || 'Build Lab');
const post = createPost(ws, group.id, { title: 'Build bigger tools', body: 'Prototype an agent-native workspace.' });
branchAgentTask(ws, post.id, 'Explore product shape and report back.');
reply(ws, post.id, { author: 'felix', body: 'First pass complete: post-first feed bumps on activity.' });
console.log(JSON.stringify({ feed: feed(ws, group.id), thread: threadTree(ws, post.id) }, null, 2));
