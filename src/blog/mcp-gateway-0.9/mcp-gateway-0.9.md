---
title: "MCP Gateway 0.9 Release"
date: 2026-08-14
author: David Martin
---

The [MCP Gateway](https://github.com/kuadrant/mcp-gateway) has reached its [0.9 release](https://github.com/Kuadrant/mcp-gateway/releases/tag/v0.9.0). This release adds structured audit logging and continues maturing the 2026 stateless protocol support introduced in 0.8. The project remains a tech preview. For the full list of changes, check the [0.9.0 release page](https://github.com/Kuadrant/mcp-gateway/releases/tag/v0.9.0) on GitHub.

For background on the MCP Gateway, see the previous [0.8 release announcement](/blog/mcp-gateway-0.8/) or the [overview documentation](https://docs.kuadrant.io/dev/mcp-gateway/docs/guides/overview/).

## What's New in 0.9

### Structured Audit Logging

The router now emits a structured audit log entry for every `tools/call` request. Each entry is logged at `INFO` level with `audit=true` and carries the calling user (the JWT `sub` claim) if available, the tool and server names, the response status, and request and session identifiers:

```
level=INFO msg="tool call" audit=true user=alice@example.com tool=echo server=mcp-test/my-server status=200 request_id=<uuid> session=<id>
```

Entries are emitted both when a call reaches the backend and when the router rejects it early (for example on a session init failure or unknown server). Because the log is produced inside the router, the audit trail is self-contained and does not depend on the Envoy or Istio telemetry pipeline. This matters on platforms where the Istio configuration is managed externally and a custom telemetry `extensionProvider` cannot be relied on.

It also supplements what Istio can see. Istio telemetry records the HTTP request to the gateway (method, path, status, latency, and the authenticated peer), but the MCP method and tool name live inside the JSON-RPC request body (or headers for 2026 protocol), which the proxy treats as opaque. The router parses that body and makes the routing decision, so it can attribute each call to a specific tool and the upstream server it resolved to, tied to the calling user. The audit log adds that MCP-level detail on top of Istio's transport-level view.

### 2026 Protocol: Streaming and Protocol Handlers

The 2026 stateless protocol support added in 0.8 continues to mature. The router can now use Envoy's streamed request body mode for 2026 protocol requests, avoiding full-body buffering on that path. Inside the broker, routing was restructured behind a `ProtocolHandler` interface with per-version implementations, and tool and prompt responses now carry cache-scope metadata (public or private) so the broker can handle them correctly per protocol version.

This support remains alpha and will keep evolving as the 2026 specification settles. See the [multi-protocol support guide](https://github.com/Kuadrant/mcp-gateway/blob/main/docs/guides/multi-protocol-support.md) for how version negotiation works.

### Production Readiness and Hardening

Several smaller changes improve behavior in Kubernetes and tighten the supply chain: graceful `SIGTERM` shutdown so in-flight work drains on pod termination, rejection of non-CA certificates in `caCertBundleRef`, prefix-uniqueness validation for `MCPServerRegistration`, `ppc64le` image builds, and GitHub Actions pinned to commit SHAs.

This release also carries a range of concurrency, correctness, and security fixes from maintainers and a growing group of new contributors. See the [release notes](https://github.com/Kuadrant/mcp-gateway/releases/tag/v0.9.0) for the full list.

## What's Next

Resource federation is in progress: the gateway can already merge `resources/list` across upstream servers, and routing `resources/read` calls back to the owning server is the next piece to land, bringing MCP [resources](https://modelcontextprotocol.io/specification/2025-11-25/server/resources) alongside the existing tool and prompt federation.

A [design for guardrails integration](https://github.com/Kuadrant/mcp-gateway/blob/main/docs/design/guardrails/guardrails-design.md) has landed, wiring NeMo Guardrails into the router with configuration flowing from the gateway down to individual `MCPServerRegistration` resources. It is a design at this stage, with implementation to follow.

Install is moving toward the Kuadrant umbrella operator model ([RFC 0019](https://github.com/Kuadrant/architecture)), where `kuadrant-operator` renders and applies the MCP Gateway chart at runtime so the gateway is deployed and managed as part of a Kuadrant instance rather than as a standalone component. 0.9 does the groundwork on the chart: opt-in `NetworkPolicy` templates, a stable controller `ClusterRole` name, and dropping the standalone OLM bundle dependency.

## Get Involved

- Try the [getting started guide](https://docs.kuadrant.io/dev/mcp-gateway/docs/guides/getting-started/).
- Report issues or request features on the [MCP Gateway Issues](https://github.com/kuadrant/mcp-gateway/issues) page.
- Engage with the [community](https://kuadrant.io/community/).
