---
title: "MCP Gateway 0.8 Release (2026-07-28 protocol support)"
date: 2026-07-30
author: David Martin
---

The [MCP Gateway](https://github.com/kuadrant/mcp-gateway) has reached its [0.8 release](https://github.com/Kuadrant/mcp-gateway/releases/tag/v0.8.0). This release adds early support for the MCP 2026 stateless protocol, promotes APIs to v1, introduces broker observability metrics, and adds CA certificate bundle configuration. The project continues as a tech preview. For the full list of changes, check the [0.8.0 release page](https://github.com/Kuadrant/mcp-gateway/releases/tag/v0.8.0) on GitHub.

For background on the MCP Gateway, see the previous [0.7 release announcement](/blog/mcp-gateway-0.7/) or the [overview documentation](https://docs.kuadrant.io/dev/mcp-gateway/docs/guides/overview/).

## What's New in 0.8

### MCP 2026 Protocol Support (Alpha)

The [MCP specification](https://modelcontextprotocol.io/) published a new protocol version (`2026-07-28`) that introduces a stateless HTTP transport. The gateway now supports both protocol versions simultaneously on a single endpoint. Clients negotiate the protocol version, and the gateway routes accordingly: 2026 clients get stateless HTTP handling, while 2025 clients continue with the existing streamable HTTP transport.

This required a significant internal restructuring. Routing logic was extracted from the ext_proc adapter into a transport-agnostic package, with versioned router implementations (`Router202511`, `Router202607`) behind a common interface. The broker maintains separate tool sets per protocol version, so 2026 clients only see tools from stateless-capable backends and vice versa.

A protocol-specific route (`/mcp/stateful`) is also available for clients that want to force the older version regardless of negotiation.

This support is alpha. It will continue to evolve as the 2026 specification matures.

### API Promotion to v1

The custom resource APIs (`MCPGatewayExtension`, `MCPServerRegistration`, `MCPVirtualServer`) have been promoted from `v1alpha1` to `v1`. The `v1alpha1` version remains served for backwards compatibility, but `v1` is now the storage version.

As part of the promotion, several experimental annotations were replaced with typed spec fields:

- `mcp.kuadrant.io/experimental-discovery` annotations are now `category` and `hint` fields on `MCPServerRegistration`
- `mcp.kuadrant.io/experimental-extension` annotations are now typed fields on the relevant CRDs
- Resource shortnames were standardized (`mcpge`, `mcpsr`, `mcpvs`)

See the [v1 migration guide](https://github.com/Kuadrant/mcp-gateway/blob/main/docs/release-notes/1109-api-v1-migration.md) for details on updating existing resources.

### Broker Prometheus Metrics

The broker now exposes Prometheus metrics on a dedicated scrape endpoint (`:9090` by default). Five new metrics cover upstream discovery health, tool inventory, connection stability, and response sizes:

| Metric | Type | Description |
|--------|------|-------------|
| `mcp_broker_discovery_total` | Counter | Discovery attempts per upstream server |
| `mcp_broker_discovery_duration_seconds` | Histogram | Duration of discovery calls |
| `mcp_broker_tools_discovered` | Gauge | Current tool count per server |
| `mcp_broker_upstream_connection_failures_total` | Counter | Connection failures per server |
| `mcp_broker_tools_list_response_bytes` | Gauge | Size of `tools/list` response per server |

Metrics use `server_name` as the only label, bounded by the number of `MCPServerRegistration` resources. No high-cardinality labels. See the [OpenTelemetry guide](https://docs.kuadrant.io/dev/mcp-gateway/docs/guides/opentelemetry/) for setup.

### CA Certificate Bundle

The new `caCertBundleRef` field on `MCPGatewayExtension` references a shared CA certificate bundle Secret. The broker loads this as a base trust pool for all upstream connections, eliminating duplication when multiple upstream servers share the same private CA:

```yaml
apiVersion: mcp.kuadrant.io/v1
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
  caCertBundleRef:
    name: my-ca-bundle
```

The trust pool is additive: system roots, gateway-level bundle, and per-server CA certificates are all composed together.

### Official MCP Go SDK

The broker and router internals migrated from the community `mark3labs/mcp-go` library to the [official MCP Go SDK](https://github.com/modelcontextprotocol/go-sdk). A compatibility layer preserves the exact observable behavior from the previous library, so existing clients are unaffected.

### Bug Fixes and Security Improvements

This release includes a significant number of bug fixes and security improvements from both maintainers and new contributors. Highlights include elicitation ID rewriting fixes, session token expiry handling, transport timeout enforcement on upstream connections, race-free routing config updates, log output obfuscation of session IDs, and cookie/proxy header stripping for user-specific upstreams. See the [release notes](https://github.com/Kuadrant/mcp-gateway/releases/tag/v0.8.0) for the full list.

## What's Next

The project continues to track the evolving [MCP specification](https://modelcontextprotocol.io/) and work toward production readiness. MCP resource federation, additional 2026 protocol features, and further observability improvements are on the roadmap.

## Get Involved

- Try the [getting started guide](https://docs.kuadrant.io/dev/mcp-gateway/docs/guides/getting-started/).
- Report issues or request features on the [MCP Gateway Issues](https://github.com/kuadrant/mcp-gateway/issues) page.
- Engage with the [community](https://kuadrant.io/community/).
