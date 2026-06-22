#!/usr/bin/env node
import { branchAgentTask, createGroup, createPost, createWorkspace, exportWorkspace, feed, reply, threadTree } from '../src/agent-workspace.js';

const ws = createWorkspace();
const group = createGroup(ws, process.argv[2] || 'Build Lab');
const post = createPost(ws, group.id, { title: 'Build bigger tools', body: 'Prototype an agent-native workspace.' });
branchAgentTask(ws, post.id, 'Explore product shape and report back.');
reply(ws, post.id, { author: 'felix', body: 'First pass complete: post-first feed bumps on activity.' });
const result = { feed: feed(ws, group.id), thread: threadTree(ws, post.id) };
if (process.argv.includes('--export-workspace')) result.workspace = JSON.parse(exportWorkspace(ws));
console.log(JSON.stringify(result, null, 2));
