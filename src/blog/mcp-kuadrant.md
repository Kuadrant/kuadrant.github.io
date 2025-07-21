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
The nature of Streamable HTTP makes it difficult to have one Gateway with one HTTPRoute with one backend, because of what we said before with the one accessible endpoint `/mcp`. To come up with a potential solution for this we created an `MCP-Gateway` proof of concept. This was an MCP-Server standing in front of two other MCP servers. 

How it worked is that on startup, the first server or MCP gateway makes an initialize call to the two other MCP servers, followed by a tool list call. The MCP gateway then saves this tool list response in memory to be used at a later time by a MCP Host via the single gateway and HTTPRoute(Backend). 

This works brilliantly with the tool-based AuthZ and Rate Limiting mentioned above. When a tools/call is detected by the gateway, it routes the JSON-RPC message from the MCP Host to the correct MCP server and proxies the response back. 

To ensure proper isolation and state consistency, the gateway implements per-client backend connections, meaning each client that connects to the gateway receives dedicated connections to each backend server. These connections maintain their own sessions internally through the mcp-go client library, eliminating the need for manual session header management. 

To test these POC's out for yourself, please see the following repos:
* Existing policies: DNS, TLS, Auth and Rate limiting [POC](https://github.com/Kuadrant/kuadrant-mcp-poc)
* Tool based AuthZ, Rate limiting and tool aggregation and routing [POC](https://github.com/Kuadrant/Kuadrant-MCP-Walkthrough)

To watch demos please see the Kuadrant YouTube [channel](https://youtu.be/Dya_4lEVtQs)
