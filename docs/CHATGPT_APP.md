# ChatGPT App integration (v0.2 preview)

## What is implemented
- Streamable HTTP MCP endpoint at `/mcp` (stateless per request)
- Read-only Pinterest API tools with MCP tool metadata
- MCP Apps UI resource at `ui://pinterest-research/gallery-v1.html`
- Local `stdio` continues to work

## What is NOT implemented
This **is not a production multi-user OAuth 2.1 provider** for ChatGPT. The server uses one local Pinterest OAuth account and a single shared HTTP bearer token. Do not put it on a public endpoint without a protected proxy, proper authorization and per-user credential isolation. Some ChatGPT installation workflows cannot attach this custom bearer header, so a full auth flow and deployment are still necessary. No actual ChatGPT connection or Pinterest login has been verified yet.

## Test locally
```sh
npm install
cp .env.example .env
# Fill Pinterest developer OAuth fields, run npm run auth
openssl rand -hex 32 # Token value for MCP_SERVER_TOKEN
npm run check && npm run build
npm run start:http
```

Use MCP Inspector with Streamable HTTP at `http://127.0.0.1:8787/mcp` and an Authorization header `Bearer <MCP_SERVER_TOKEN>`.
Use `curl http://127.0.0.1:8787/healthz` for process health.
Run localhost only until end-user MCP OAuth authentication is implemented.

## Path to ChatGPT
1. Add MCP OAuth 2.1 authorization and protected-resource metadata. Bind each user to their Pinterest OAuth tokens.
2. Host on HTTPS with durable storage and rate limiting.
3. Verify all MCP tools and gallery resource in Inspector.
4. Create ChatGPT custom MCP plugin in Plugins, using deployed `https://<host>/mcp` and OAuth.
5. Test installation, tool calls, gallery, pagination and error states.
6. For public publication, complete OpenAI plugin submission and Pinterest app approval.

Guides:
- https://developers.openai.com/plugins/build/mcp-server
- https://developers.openai.com/plugins/build/chatgpt-ui
- https://developers.openai.com/plugins/deploy/connect-chatgpt

## OAuth gateway groundwork (v0.3)
When `OAUTH_ISSUER`, `MCP_PUBLIC_URL`, and `OAUTH_AUDIENCE` are set, `/mcp` verifies bearer JWTs against `<issuer>/.well-known/jwks.json`, checking issuer, audience, signature and `pinterest.read` scope. `/.well-known/oauth-protected-resource` publishes the protected-resource discovery document. The external OAuth provider must implement Authorization Code + PKCE, client registration/recognition, and authorization server metadata. This repository does **not** itself issue OAuth tokens or connect Pinterest identities to ChatGPT user identities. Its single-account Pinterest token store is **not safe for multitenant deployments**. Run behind an HTTPS reverse proxy with correct public URL. Local static-token testing is restricted to loopback hosts.

### Remaining blockers for end-to-end ChatGPT connection
1. Configure an external standards-compliant OAuth authorization server and ChatGPT redirect URI.
2. Implement per-user token storage instead of the shared local Pinterest credentials.
3. Deploy HTTPS backend and run MCP Inspector then real ChatGPT authorization.
4. Confirm production Pinterest app approval and supported OAuth callback URL.
