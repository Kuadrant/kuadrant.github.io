---
title: "MCP Gateway 0.9 Release"
date: 2026-08-14
author: David Martin
---

The [MCP Gateway](https://github.com/kuadrant/mcp-gateway) has reached its [0.9 release](https://github.com/Kuadrant/mcp-gateway/releases/tag/v0.9.0). This release adds MCP resource federation, structured audit logging, and integration with the Kuadrant umbrella operator. It also continues maturing the 2026 stateless protocol support introduced in 0.8. The project remains a tech preview. For the full list of changes, check the [0.9.0 release page](https://github.com/Kuadrant/mcp-gateway/releases/tag/v0.9.0) on GitHub.

For background on the MCP Gateway, see the previous [0.8 release announcement](/blog/mcp-gateway-0.8/) or the [overview documentation](https://docs.kuadrant.io/dev/mcp-gateway/docs/guides/overview/).

## What's New in 0.9

### Resource Federation

The gateway now federates MCP [resources](https://modelcontextprotocol.io/specification/2025-11-25/server/resources) from upstream servers, completing the set alongside tools and prompts. A `resources/list` request fans out to all registered upstreams concurrently and merges the results, with the server prefix injected into each resource URI so clients can address resources unambiguously.

Unlike tools and prompts, resources are fetched live per request rather than cached, so `resources/list` always reflects the current state of each upstream. Resolution uses longest-prefix matching to route a resource read back to the server that owns it. Upstreams that error or time out are skipped, producing an observable partial list rather than failing the whole call.

### Structured Audit Logging

The router now emits a structured audit log entry for every `tools/call` request. Each entry is logged at `INFO` level with `audit=true` and carries the calling user (the JWT `sub` claim), the tool and server names, the response status, and request and session identifiers:

```
level=INFO msg="tool call" audit=true user=alice@example.com tool=echo server=mcp-test/my-server status=200 request_id=<uuid> session=<id>
```

Entries are emitted both when a call reaches the backend and when the router rejects it early (for example on a session init failure or unknown server). Because the log is produced inside the router, the audit trail is self-contained and does not depend on the Envoy or Istio telemetry pipeline. This matters on platforms where the Istio configuration is managed externally and a custom telemetry `extensionProvider` cannot be relied on.

### Kuadrant Umbrella Operator Integration

The Helm chart has been aligned with the Kuadrant [umbrella operator pattern](https://github.com/Kuadrant/architecture). Under this model, `kuadrant-operator` renders the MCP Gateway chart at runtime and applies its resources directly, so the gateway is installed and managed as part of a Kuadrant deployment rather than as a standalone component.

As part of this change, the gateway no longer ships as a standalone OLM operator with its own bundle dependencies. The chart also gained opt-in `NetworkPolicy` templates for the broker-router and controller pods (disabled by default via `networkPolicy.enabled`), scoping ingress to the broker HTTP, router gRPC ext_proc, and metrics ports.

### 2026 Protocol: Streaming and Protocol Handlers

The 2026 stateless protocol support added in 0.8 continues to mature. The router can now use Envoy's streamed request body mode for 2026 protocol requests, avoiding full-body buffering on that path. Inside the broker, routing was restructured behind a `ProtocolHandler` interface with per-version implementations, and tool and prompt responses now carry cache-scope metadata (public or private) so the broker can handle them correctly per protocol version.

This support remains alpha and will keep evolving as the 2026 specification settles.

### Production Readiness and Hardening

Several changes improve behavior in Kubernetes and tighten the supply chain:

- The broker now handles `SIGTERM` for graceful shutdown, so in-flight work drains cleanly on pod termination.
- CA bundle validation rejects non-CA certificates in `caCertBundleRef`, catching misconfiguration early.
- The controller validates that `MCPServerRegistration` prefixes are unique.
- Container images now build for `ppc64le` in addition to existing architectures.
- GitHub Actions are pinned to commit SHAs (via ratchet) with a monthly workflow to keep them current.

### Bug Fixes and Security Improvements

This release includes a number of concurrency, correctness, and security fixes from both maintainers and a growing group of new contributors, including graceful shutdown handling, resource federation edge cases around URI mutation and null arrays, and continued data-race hardening in the broker. See the [release notes](https://github.com/Kuadrant/mcp-gateway/releases/tag/v0.9.0) for the full list.

## What's Next

A design for [A2A (Agent-to-Agent)](https://a2a-protocol.org/) protocol support has landed as a proposal. The first slice is a router-only passthrough behind an experimental `--enable-a2a` flag (default off) that surfaces A2A traffic to authorization and observability without further gateway logic, with agent registration, discovery, and per-principal task ownership following in later phases.

The project continues to track the evolving [MCP specification](https://modelcontextprotocol.io/) and work toward production readiness.

## Get Involved

- Try the [getting started guide](https://docs.kuadrant.io/dev/mcp-gateway/docs/guides/getting-started/).
- Report issues or request features on the [MCP Gateway Issues](https://github.com/kuadrant/mcp-gateway/issues) page.
- Engage with the [community](https://kuadrant.io/community/).
