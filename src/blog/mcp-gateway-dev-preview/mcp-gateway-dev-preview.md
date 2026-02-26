---
title: "Announcing MCP Gateway 0.5: Dev Preview Release"
date: 2026-02-24
author: David Martin
---

The [MCP Gateway](https://github.com/kuadrant/mcp-gateway) has reached its 0.5 dev preview release. The MCP Gateway is a project from the Kuadrant team that provides centralized connectivity, access control, and security for AI agent applications accessing [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers.

## What is the MCP Gateway?

As AI agents become more capable, they need access to an increasing number of tools and services. The Model Context Protocol provides a standard way for agents to discover and invoke these tools, but managing connectivity, authentication, and authorization across multiple MCP servers quickly becomes complex.

The MCP Gateway addresses this by aggregating MCP servers behind a single endpoint, built on [Envoy proxy](https://www.envoyproxy.io/) and [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io/). It allows you to:

- **Aggregate MCP servers** behind a single, unified endpoint for your AI agents
- **Manage access control and security** with fine-grained, per-tool authorization
- **Scale agentic AI applications** without embedding networking and auth logic into application code

For a deeper look at how access control works with the MCP Gateway and Kuadrant's AuthPolicy, see our earlier post on [Protecting AI Agent Tool Access with Kuadrant](/blog/mcp-gateway/). Full details on the architecture and capabilities are available in the [overview documentation](https://docs.kuadrant.io/dev/mcp-gateway/docs/guides/overview/).

## What's in the 0.5 Release?

This is a **dev preview** release. The MCP Gateway is available to try out and provide feedback on, but APIs and interfaces are expected to change as we gather feedback from the community. It is not yet intended for production use.

The 0.5 release provides the core MCP Gateway functionality:

- MCP server aggregation and tool discovery via a single gateway endpoint
- Integration with Kuadrant's AuthPolicy for authentication and authorization
- Support for OAuth2 token exchange, credential translation via Vault, and identity-based tool filtering
- A quick start experience to get up and running locally

## Try It Out

The fastest way to see the MCP Gateway in action is the [quick start guide](https://docs.kuadrant.io/dev/mcp-gateway/docs/guides/quick-start/), along with the MCP Inspector:

{% image "./mcp-inspector-screenshot.png", "MCP Inspector showing tools from aggregated MCP servers" %}

For a more detailed walkthrough, including setting up authentication and authorization, see the [getting started guide](https://docs.kuadrant.io/dev/mcp-gateway/docs/guides/getting-started/).

## What's Next: The Road to 0.6

The next release, 0.6, will focus primarily on adding a [Kubernetes operator](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/) for easier installation and management of the MCP Gateway. This will simplify deployment and make it easier to manage MCP Gateway configurations declaratively alongside the rest of your Kuadrant policies.

Milestones and progress can be tracked on the [public project board](https://github.com/orgs/Kuadrant/projects/27/views/1).

## Get Involved

As a dev preview, feedback will directly shape what comes next.

- Report issues or request features on the [MCP Gateway Issues](https://github.com/kuadrant/mcp-gateway/issues) page.
- Engage with the [community](https://kuadrant.io/community/).
