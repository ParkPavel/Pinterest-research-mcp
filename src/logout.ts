import { createLocalClient } from './pinterest.js';
import { publicError } from './errors.js';
try {
  await createLocalClient().disconnect('local');
  console.log('Local token copy deleted. Also revoke the app in Pinterest Settings → Apps / App permissions. This command does not revoke the Pinterest grant or delete AI chat history.');
} catch (error) { console.error(publicError(error)); process.exitCode = 1; }
