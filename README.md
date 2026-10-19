# Pinterest Research MCP v0.2 preview

A read-only local-first Pinterest connector using Pinterest API v5, a TypeScript MCP server and an MCP Apps pin gallery resource.

**Status:** code preview, not yet a deployed/installed ChatGPT App. Read [ChatGPT integration and security limitations](docs/CHATGPT_APP.md).

## Setup

Requires Node 20+ and a Pinterest developer application approved for the requested permissions.

```sh
npm install
cp .env.example .env
openssl rand -hex 32
```

Set PINTEREST_APP_ID, PINTEREST_APP_SECRET, TOKEN_ENCRYPTION_KEY in your private .env; configure your Pinterest app's matching OAuth redirect. Do not commit secrets or tokens.

```sh
npm run auth
npm run check
npm run build
npm start         # local stdio MCP
npm run start:http # read-only HTTP MCP, loopback by default
```

For HTTP MCP set MCP_SERVER_TOKEN in .env to a random 32+ character value, and use header `Authorization: Bearer <value>` in an MCP Inspector client. HTTP endpoint: http://127.0.0.1:8787/mcp. Health check: /healthz.

## Available tools

`pinterest_account`, `pinterest_boards`, `pinterest_board`, `pinterest_board_pins`, `pinterest_pins`, `pinterest_pin`, `pinterest_board_sections`, `pinterest_section_pins`. The board-pin and section-pin tools expose source links and media URLs with a gallery UI resource.

## Limitations

- The HTTP prototype authorizes **one** Pinterest account through one shared bearer token; it is **not** yet a production-compatible multi-user ChatGPT OAuth provider.
- Do not expose it publicly before implementing end-user authorization and isolation.
- Image URLs are returned but this server does not itself decode images or perform visual-model inference.
- Pinterest API approval and available scopes control what can be read; no bypassing privacy or access restrictions.
- OAuth flow and runtime have not yet been tested end-to-end with real Pinterest credentials.

Developer documentation: https://developers.openai.com/plugins/ and https://developers.pinterest.com/docs/api/v5/
