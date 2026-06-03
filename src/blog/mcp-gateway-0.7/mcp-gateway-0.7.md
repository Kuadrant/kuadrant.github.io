---
title: "MCP Gateway 0.7 Release"
date: 2026-06-03
author: David Martin
---

The [MCP Gateway](https://github.com/kuadrant/mcp-gateway) has reached its [0.7 release](https://github.com/Kuadrant/mcp-gateway/releases/tag/v0.7.0). This release adds tool discovery, per-user tool listings, prompt federation, and OAuth configuration via CRD. The project continues as a tech preview as APIs and core features evolve. For the full list of changes, check the [0.7.0 release page](https://github.com/Kuadrant/mcp-gateway/releases/tag/v0.7.0) on GitHub.

For background on the MCP Gateway, see the previous [0.6 tech preview announcement](/blog/mcp-gateway-tech-preview/) or the [overview documentation](https://docs.kuadrant.io/dev/mcp-gateway/docs/guides/overview/).

## What's New in 0.7

### Tool Discovery

As the number of tools behind a gateway grows, returning everything in a single `tools/list` response becomes impractical. This release introduces progressive tool discovery via two built-in meta-tools: `discover_tools` and `select_tools`.

`discover_tools` returns lightweight metadata (server names, categories, hints, and tool names without schemas) so an agent can browse what's available. `select_tools` then scopes the session to a working set of tools, sending a `notifications/tools/list_changed` event so the agent refreshes its view.

Operators annotate their `MCPServerRegistration` resources with `category` and `hint` fields to make servers discoverable:

```yaml
apiVersion: mcp.kuadrant.io/v1alpha1
kind: MCPServerRegistration
metadata:
  name: weather-server
spec:
  prefix: weather
  category:
    - data
    - environment
  hint: "Weather forecasts and historical climate data"
  targetRef:
    name: weather-server
```

Discovery is enabled by default and can be tuned with the `--discovery-tool-threshold` flag to control when meta-tools appear. See the [tool discovery guide](https://docs.kuadrant.io/dev/mcp-gateway/docs/guides/tool-discovery/) for details.

### Per-User Tool Listings

The gateway can now return different tool lists depending on who is calling. When `userSpecificList` is enabled on an `MCPServerRegistration`, the broker fetches tools per-user during `tools/list` rather than returning the same cached set for everyone. This supports upstream MCP servers that tailor their capabilities based on user identity or permissions.

Per-user listings are opt-in and disabled by default. When enabled, the server must use a prefix:

```yaml
apiVersion: mcp.kuadrant.io/v1alpha1
kind: MCPServerRegistration
metadata:
  name: user-aware-server
spec:
  prefix: myserver
  userSpecificList: Enabled
  targetRef:
    name: user-aware-server
```

### Prompt Federation

The gateway now federates MCP [prompts](https://modelcontextprotocol.io/specification/2025-11-25/server/prompts) from upstream servers alongside tools. Prompts are prefixed the same way as tools and are accessible via `prompts/list` and `prompts/get` through the gateway. Authorization filtering supports prompts via the `allowed-capabilities` JWT claim, and virtual servers can scope prompts via the `spec.prompts` field on `MCPVirtualServer`.

### OAuth Protected Resource Configuration via CRD

The `oauthProtectedResource` field on `MCPGatewayExtension` replaces the previous approach of manually setting `OAUTH_*` environment variables on the broker-router deployment. The controller manages the environment variables automatically:

```yaml
apiVersion: mcp.kuadrant.io/v1alpha1
kind: MCPGatewayExtension
metadata:
  name: mcp-gateway
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: Gateway
    name: mcp-gateway
    namespace: gateway-system
    sectionName: mcp
  oauthProtectedResource:
    authorizationServers:
      - "https://keycloak.example.com/realms/mcp"
    scopesSupported:
      - "basic"
      - "groups"
```

Only `authorizationServers` is required. Sensible defaults are applied for the other fields. See the [authentication guide](https://docs.kuadrant.io/dev/mcp-gateway/docs/guides/authentication/) for the updated workflow.

### Enable/Disable MCPServerRegistration

`MCPServerRegistration` resources now support a `state` field (`Enabled` or `Disabled`, default `Enabled`). Setting `state: Disabled` tells the broker to disconnect from the upstream server and remove its tools and prompts from the gateway. The registration is preserved and can be re-enabled at any time without recreating resources.

### Bug Fixes and Security Improvements

This release includes a number of bug fixes and security improvements, including a [critical security fix](https://github.com/advisories/GHSA-g53w-w6mj-hrpp) for the hairpin backend-init request flow, concurrent map access fixes, Redis session TTL alignment, and improved health check endpoints. See the [release notes](https://github.com/Kuadrant/mcp-gateway/releases/tag/v0.7.0) for the full list.

## Breaking Changes

The 0.7 release includes several breaking API changes. The project is still in tech preview with alpha APIs, so these are expected as the API surface stabilizes.

- **`toolPrefix` renamed to `prefix`** on `MCPServerRegistration`. The field applies to both tools and prompts, so the name now reflects its actual scope. Existing resources must be deleted and recreated due to immutability validation.
- **`x-authorized-tools` header replaced with `x-mcp-authorized`**. The authorization header now supports a capability-typed JWT structure covering tools, prompts, and resources. AuthPolicy configurations must be updated.
- **`--enforce-tool-filtering` renamed to `--enforce-capability-filtering`**. The CLI flag name reflects the broader scope of capability filtering beyond just tools.
- **Keycloak roles now require a `tool:` prefix**. Roles like `greet` must become `tool:greet` to support future capability types (`prompt:`, `resource:`).
- **`JWT_SESSION_SIGNING_KEY` renamed to `GATEWAY_SIGNING_KEY`**. The old environment variable is still accepted as a fallback but is deprecated. In controller-managed deployments, this is handled automatically.

See the [release notes](https://github.com/Kuadrant/mcp-gateway/releases/tag/v0.7.0) for detailed migration steps.

## What's Next

The [0.8 milestone](https://github.com/Kuadrant/mcp-gateway/milestone/7) is in progress. The project continues to track the evolving [MCP specification](https://modelcontextprotocol.io/) and work toward production readiness.

## Get Involved

- Try the [getting started guide](https://docs.kuadrant.io/dev/mcp-gateway/docs/guides/getting-started/).
- Report issues or request features on the [MCP Gateway Issues](https://github.com/kuadrant/mcp-gateway/issues) page.
- Engage with the [community](https://kuadrant.io/community/).
