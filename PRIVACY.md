# Privacy Policy — Visual Research MCP

**Effective date:** October 19, 2026

**Operator:** Park Pavel (independent developer)
**Project:** [Visual Research MCP](https://github.com/ParkPavel/Pinterest-research-mcp)
**Contact:** [Project issue tracker](https://github.com/ParkPavel/Pinterest-research-mcp/issues). Please do not post private information, tokens, or account details in public issues; request a private contact channel first.

## 1. What the application does
Visual Research MCP is an experimental, read-only tool for authorized Pinterest account research and visual analysis through compatible AI assistants. It may retrieve information about the connected account and accessible boards, board sections, Pins, descriptions, source links, and media URLs within Pinterest API permissions.

**Current status:** The software is in development. Its local prototype is not yet a publicly hosted multi-user service. Capabilities below describe intended processing when an account is connected and the tool is used.

## 2. Information processed
When you explicitly authorize the app, it may process:
- Your Pinterest account identifier and basic account information available under granted permissions.
- IDs, titles, descriptions, metadata, and media URLs of boards, sections, and Pins available to the authorized user.
- OAuth access and refresh tokens needed to make API requests.
- Minimal operational information required for security and troubleshooting if the service is deployed.

The app does not ask for your Pinterest password. It does not request access to private data beyond granted Pinterest scopes.

## 3. Why the information is used
Data is used to fulfill your requested Pinterest research queries, display collections and references, troubleshoot authorization, and protect the service from unauthorized access. The project does not use personal data for advertising or sell personal data.

## 4. Processing by other services
Pinterest provides data through its official API. When you choose to use an AI assistant such as ChatGPT, retrieved content may be sent to that assistant for analysis and handled according to the assistant provider's terms and privacy notice. GitHub hosts the publicly visible project source code and this policy; personal Pinterest data and OAuth tokens must not be stored in the public repository.

## 5. Storage and security
The current single-user implementation stores Pinterest OAuth tokens in a local AES-256-GCM-encrypted file, with the encryption key configured separately. The current prototype does not maintain a cloud user-data database. If a hosted service is introduced, this policy will be revised before public use to describe actual hosting, access controls, storage locations, retention periods, and any subprocessors. No security measure eliminates all risk.

## 6. Retention and deletion
In the local prototype, data returned from Pinterest is processed for the active request and is not intentionally retained in a long-lived application content database. Locally encrypted OAuth tokens remain until deleted or replaced by the operator. Removing the local `.data/tokens.enc` file deletes that local token copy. Separately, revoke the application's access in Pinterest account settings to invalidate permission. Data already passed to external AI clients is governed by their own retention and deletion controls.

## 7. Your choices
You control authorization and may revoke Pinterest access at any time. You may request information about project data handling through the project issue tracker without posting personal information publicly.

## 8. Changes
This policy will be updated when the software moves beyond its current local single-user prototype, especially before multi-user hosting or any new persistent storage, and the effective date will be changed.

## 9. Independent app notice
Visual Research MCP is an independent developer project and is not affiliated with or endorsed by Pinterest.
