import 'dotenv/config';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createPinterestServer } from './server.js';
await createPinterestServer().connect(new StdioServerTransport());
