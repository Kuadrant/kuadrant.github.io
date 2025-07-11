---
title: Kuadrant and Model context protocol (MCP) the ultimate pairing?
date: 2025-07-09
author: Rachel Lawton
---
With the rise in popularity of Model context protocol (MCP) and the recent addition of Streamable HTTP. Kuadrant created some proof of concepts to showcase what Kuadrant could provide to MCP as is or with a few tweaks. 

### Existing policies: DNS, TLS, Auth and Rate limiting

This proof of concept demonstrated that Kuadrant policies can effectively stand in front of an MCP server using Streamable HTTP. Adding value through DNS, TLS, Authentication, and Rate Limiting policies. This was a great success! Users could create a Gateway and HTTPRoute for the MCP Server, and it worked like any other application. This allowed users to secure, connect and protect their MCP server.

### Tool based AuthZ and Rate limiting
Since the first POC was successful and all policies functioned as expected, we explored additional areas where Kuadrant policies could provide value, leading us to investigate tool-based Authorization and Rate Limiting.

In this use case, we aimed to allow a platform engineer to authorise users to access only specific tools exposed by the MCP server. This was more complex due to the nature of streamable HTTP based MCP servers, which expose a single endpoint for all functionality. Also, requests and responses are sent and received via JSON-RPC, making it difficult to directly extract the necessary information for policy evaluation.

To address this, we introduced an ext-proc (external processing) component into the Kuadrant filter chain. This component parses the tool name from the JSON-RPC request body and inserts it into a custom header (e.g. x-mcp-tools). This approach enabled us to use CEL (Common Expression Language) within our policies for evaluation.

For example, the following CEL expression checks if the header exists and matches a specific tool:

``` cel
request.headers.exists(h, h.lowerAscii() == "x-mcp-tools" && request.headers[h] == "server1-echo_headers")

```
This expression also supports tool-specific Rate Limiting. Such limits are useful for tools that are resource-intensive or have long execution times, allowing users to limit how often they can be invoked.

### Tool aggregation and routing
The nature of Streamable HTTP makes it difficult to have one Gateway with one HTTPRoute with one backend, because of what we said before with the one accessible endpoint `/mcp`. To come up with a potential solution for this we created an `MCP-Gateway`. This was an MCP-Server standing in front of two other MCP servers. 

How it worked is that on startup, the first server or MCP gateway makes an instantiation call to the two other MCP servers, followed by a tool list call. The MCP gateway then saves this tool list response in memory to be used at a later time by a MCP Host via the single gateway and HTTPRoute(Backend). This works brilliantly with the tool AuthZ and Rate Limiting mentioned above. To route the call from the MCP Host back to the right MCP server, the routing piece was handled when a tools/call was seen in the gateway. It would pass the JSON RPC message on to the appropriate MCP server, and proxy back the response.

The nature of Streamable HTTP makes it challenging to rely on a single Gateway, HTTPRoute, and backend when all functionality is exposed through a single endpoint `/mcp`. To address this limitation, we designed a component called the MCP Gateway, a dedicated MCP server that acts as a proxy in front of two other MCP servers.

On startup, the first MCP Server or MCP Gateway performs an instantiation call to each  MCP server, followed by a tool list call. The Gateway saves the tool list responses in memory, allowing it to dynamically route future requests from MCP hosts through a single Gateway API Gateway and HTTPRoute.

This approach integrates perfectly with the previously mentioned tool-based authorization and Rate Limiting policies. When a tools/call is received, the MCP Gateway inspects the JSON-RPC message to determine the correct backend MCP server for the requested tool, forwards the request, and proxies the response back to the client via the Gateway API Gateway.

To test these POC's out for yourself, please see the following repos:
* Existing policies: DNS, TLS, Auth and Rate limiting [POC](https://github.com/Kuadrant/kuadrant-mcp-poc)
* Tool based AuthZ, Rate limiting and tool aggregation and routing [POC](https://github.com/Kuadrant/Kuadrant-MCP-Walkthrough)

To watch demos please see the Kuadrant YouTube [channel](https://youtu.be/Dya_4lEVtQs)
