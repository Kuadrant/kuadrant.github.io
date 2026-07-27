---
title: Replacing ext-proc with Envoy's Native MCP Filter (Almost)
date: 2026-07-26
author: Krishna Kukadia
---
`mcp-gateway` relies on a custom Go processor, `ext-proc`, to parse MCP requests - routing tool calls, managing sessions, and exposing metadata for authorization, work Envoy had no native way to do. Parsing sits underneath all of it: without knowing which tool a request is calling, none of the rest is possible. Envoy 1.38 changed this specifically: its native MCP filter can extract the same metadata without custom code.

A `tools/call` request makes this concrete. The HTTP request line only says `POST /mcp` - the tool being called lives entirely inside the JSON-RPC body:

```json
POST /mcp HTTP/1.1
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "delete_records",
    "arguments": { "table": "users" }
  }
}
```

Nothing in the path or headers says `delete_records`. A proxy reading only HTTP semantics has no way to know which tool this request is calling, or to authorize it at the tool level, without opening this body.

I took this on as my [LFX mentorship project](https://mentorship.lfx.linuxfoundation.org/project/1acff18b-c4da-4166-9a79-ceb8a8ad112b) this term (Term 2, 2026), scoped in [this issue](https://github.com/Kuadrant/mcp-gateway/issues/809): if Envoy's [native MCP filter](https://www.envoyproxy.io/docs/envoy/latest/configuration/http/http_filters/mcp_filter) can already parse requests and publish that metadata on its own, does a separate parsing component still belong in the request path?

To answer that question, I compared `mcp-gateway`'s current architecture against a native Envoy filter chain. 

But before looking at the comparison, a few terms worth defining:

- **[ext-proc](https://github.com/Kuadrant/mcp-gateway/tree/main/internal/mcp-router)** - the processor `mcp-gateway` uses to parse MCP requests before Authorino sees them
- **[Authorino](https://github.com/Kuadrant/authorino)** - evaluates policy and returns allow or deny
- **[HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview)** - the transport carrying MCP messages between the client, gateway, and server
- **[JSON-RPC](https://www.jsonrpc.org/specification)** - MCP's message format, where tool calls are represented in the request body rather than the HTTP path or headers

{% image "./diagram-architecture.png", "mcp-gateway path compared to the native Envoy filter chain" %}


## Testing standalone instead of waiting

At the time of testing, Istio didn't run the native MCP filter, and this is the kind of thing that can change as Istio's build evolves. Even on Istio 1.30, which bundles Envoy 1.38, loading `envoy.filters.http.mcp` through an `EnvoyFilter` was rejected ([evidence](https://github.com/kkukadia/mcp-native-investigation/blob/master/results/c6.txt)) - Istio compiles its own proxy image from a curated subset of upstream Envoy extensions, and this filter wasn't in that set. Since Kuadrant deployments typically run Envoy through Istio, testing the filter at all meant not going through Istio.

I had two options:

- **Wait for Istio to add the filter to its build.**
- **Test standalone Envoy 1.38 directly with Authorino.**

I chose the standalone approach, using Authorino's `AuthConfig` API directly since Kuadrant's `AuthPolicy` integration depends on the Istio request path. The goal was to validate the new Envoy → authorization flow directly, not reproduce the entire production stack.

## Connecting parsing to authorization

A single `tools/call` request needs to pass through several steps before the MCP server sees it:

{% image "./diagram-sequence.png", "Request sequence for a single tools/call" %}

The initial setup looked correct: Envoy had the expected filter chain (`mcp_filter → ext_authz → router`), and the MCP filter was successfully extracting the method and tool name from requests.

Every tool call still returned `200`, though - allowed and blocked alike.

That's because I hadn't wired the metadata through yet: `ext_authz` doesn't forward Envoy's dynamic metadata to the authorization server by default, so Authorino was evaluating every request with an empty input.

The fix was adding the MCP namespace to the [`ext_authz` configuration](https://github.com/kkukadia/mcp-native-investigation/blob/master/tests/capability/c5/kuadrant/manifests/envoy138.yaml):

```yaml
metadata_context_namespaces:
- envoy.filters.http.mcp
```

After that, Authorino received the method and tool name, and the [policies](https://github.com/kkukadia/mcp-native-investigation/blob/master/tests/capability/c5/kuadrant/manifests/authconfig.yaml) started producing the expected allow and deny decisions.

## Where this leaves things

The interesting part of this investigation was what happened once MCP parsing moved into the data plane, not just that Envoy could parse an MCP request in the first place.

Before Envoy 1.38, a custom component had to sit between the proxy and authorization layer to translate MCP into something policy engines could understand. With the native MCP filter, that translation can happen inside Envoy itself. The remaining question is which responsibilities should stay outside the proxy.

For a single MCP server: Envoy can provide the context needed for tool-level authorization without a separate parsing process. The tradeoff shifts from building custom infrastructure to waiting on Istio to register `envoy.filters.http.mcp` in its own proxy build.

That's the one piece still missing. Two things are proven independently here, not together: the native filter works, tested standalone against Authorino directly, and Kuadrant's `AuthPolicy` CRD works cleanly against an Istio 1.30 Gateway with zero manual Envoy config ([evidence](https://github.com/kkukadia/mcp-native-investigation/blob/master/results/c6.txt)). That `AuthPolicy` test ran without the filter present, since Istio doesn't register it yet. The combined path, native filter plus `AuthPolicy` plus Istio all at once, hasn't been tested and can't be until Istio adds the filter to its build.

MCP gateways still have other jobs to solve - routing across multiple servers, aggregation, and higher-level MCP-specific behavior, but parsing no longer has to be one of them.

I tested Envoy's native aggregating mode against multiple backend servers separately, and the results are a different enough story (caching, session notifications, per-backend credentials) to leave for their own writeup ([evidence](https://github.com/kkukadia/mcp-native-investigation/tree/master/results)).

The full evidence and working configuration are available in the [investigation repo](https://github.com/kkukadia/mcp-native-investigation).