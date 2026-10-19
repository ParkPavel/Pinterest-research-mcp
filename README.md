# Pinterest Research MCP · v0.1.0

Local-first read-only Pinterest MCP server. OAuth 2.0, Pinterest API v5, encrypted local tokens, board/Pin metadata and source image URLs. No scraped content or invented image analysis.

## Requirements
- Node.js 20+, npm
- Pinterest developer application with approved API access and OAuth scopes: https://developers.pinterest.com/

## Install and authorize
```bash
npm install
cp .env.example .env
openssl rand -hex 32
```
Fill in PINTEREST_APP_ID, PINTEREST_APP_SECRET and TOKEN_ENCRYPTION_KEY in .env. Register exact callback http://127.0.0.1:8765/callback if Pinterest accepts loopback redirects (otherwise adapt callback implementation to approved HTTPS URL).

```bash
npm run auth
npm run check
npm run build
npm start
```

The MCP transport is local stdio; configure a compatible MCP client or Inspector to run the compiled entrypoint from the repository working directory.

## Tools
- pinterest_account
- pinterest_boards
- pinterest_board
- pinterest_board_pins
- pinterest_pins
- pinterest_pin
- pinterest_board_sections
- pinterest_section_pins

Board pagination uses page_size and bookmark. Actual available data depends on the application's approval and OAuth scopes.

## Security
Local OAuth tokens are AES-256-GCM encrypted in .data/tokens.enc. Never commit .env, tokens or browser cookies. OAuth callback validates state. API calls are read-only.

## Limitations
MVP exposes authorized Pin media URLs and metadata, *not decoded image pixel data or automated multimodal analysis*. No remote Streamable HTTP ChatGPT app, gallery UI, browser adapter or search index is included. Authorization with Pinterest does not grant universal access to other users' or private content.

## Status
Source release; dependencies and real Pinterest OAuth flow have not yet been verified end-to-end.