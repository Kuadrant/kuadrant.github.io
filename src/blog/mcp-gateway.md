---
title: Protecting AI Agent Tool Access with Kuadrant：A Model Context Protocol Gateway Case Study
date: 2025-11-11
author: Guilherme Cassolato
---
As AI agents become more sophisticated and autonomous, they increasingly need access to real-world tools and services through APIs. The [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) provides a standardized way for AI agents to discover and invoke tools from various servers. However, this creates a complex security challenge: how do you enforce fine-grained access control when an agent aggregates tools from multiple sources with different authentication mechanisms?

This post follows up on Rachel Lawton's [Kuadrant and Model context protocol (MCP) the ultimate pairing?](mcp-kuadrant.md) to explores how [Kuadrant](https://kuadrant.io)'s AuthPolicy provides an elegant solution to the MCP tool aggregation auth problem, using the [MCP Gateway](https://github.com/kagenti/mcp-gateway) as a real-world case study. We'll show how Kuadrant's declarative policy API, built on Gateway API and Envoy, enables sophisticated authentication and authorization patterns that would be prohibitively complex to implement manually.

## The MCP Gateway Security Challenge

An MCP Gateway aggregates tools from multiple MCP servers behind a single endpoint. For example, an AI agent might access:
- Internal code review tools requiring corporate OAuth2
- GitHub repository tools requiring a Personal Access Token (PAT)
- Weather services requiring API keys
- Database query tools requiring role-based access control

This creates three critical security requirements:

1. **Identity-based tool filtering**: Only show users tools they're authorized to access
2. **Token scope reduction**: Don't pass overly permissive tokens to backend servers
3. **Credential translation**: Support servers with different authentication mechanisms

Traditional API gateway authorization falls short because:
- Most gateways only authorize at the endpoint level, not per-operation (tool)
- OAuth2 token exchange (RFC 8693) requires complex integration
- Combining multiple authentication methods in a single policy is difficult
- Injecting trusted metadata into requests requires cryptographic verification

This is exactly the kind of complex, multi-faceted security challenge that Kuadrant's AuthPolicy is designed to solve.

## Why Kuadrant?

[Kuadrant](https://kuadrant.io) is a policy engine for Gateway API that extends Envoy with declarative, Kubernetes-native policies for authentication, authorization, and rate limiting. What makes it particularly well-suited for MCP Gateway protection?

### 1. **Declarative, Composable Policies**

AuthPolicy uses a multi-phase pipeline that separates concerns:
- **Authentication**: Validate credentials (JWT, API keys, etc.)
- **Metadata**: Fetch additional context (ACLs, external credentials)
- **Authorization**: Make access decisions using fetched data
- **Response**: Inject headers or modify responses

This separation makes complex flows readable and maintainable.

### 2. **Built on Standards**

Kuadrant is built on:
- [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io/) for routing
- [Envoy](https://www.envoyproxy.io/) for the data plane
- [Authorino](https://github.com/Kuadrant/authorino) for the policy engine

This means it works with multiple Gateway API providers (Istio, Envoy Gateway) and integrates with existing Envoy ecosystems.

### 3. **Powerful Expression Languages**

AuthPolicy supports [Common Expression Language (CEL)](https://cel.dev/) as well as [Open Policy Agent](https://www.openpolicyagent.org) for dynamic policy logic, enabling sophisticated authorization rules without custom code.

### 4. **Extensibility Through Metadata**

The metadata phase can call external HTTP services, enabling integration with secret stores (Vault), ACL systems, and other external policy decision points.

Let's see how these capabilities solve the MCP Gateway security challenges.

## Solution 1: Identity-Based Tool Filtering with Wristbands

### The Challenge

When an agent calls `tools/list`, the gateway returns all available tools. But we want to filter this list based on the authenticated user's permissions. The MCP Gateway needs to:
1. Receive trusted permission data
2. Verify it hasn't been tampered with
3. Filter tools efficiently

### The Kuadrant Solution

We use AuthPolicy's **wristband** feature to create a cryptographically-signed JWT containing the user's permitted tools:

```yaml
apiVersion: kuadrant.io/v1
kind: AuthPolicy
metadata:
  name: mcp-auth-policy
  namespace: gateway-system
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: Gateway
    name: mcp-gateway
    sectionName: mcp
  when:
    - predicate: "!request.path.contains('/.well-known')"
  rules:
    # Phase 1: Authentication
    authentication:
      'keycloak':
        jwt:
          issuerUrl: https://keycloak.example.com/realms/mcp

    # Phase 2: Authorization
    authorization:
      'allow-tool-list':
        patternMatching:
          patterns:
            - predicate: request.headers['x-mcp-method'] in ["tools/list","initialize","notifications/initialized"]

      'authorized-tools':
        opa:
          rego: |
            allow = true
            # Extract tool permissions from JWT resource_access claim
            tools = { server: roles |
              server := object.keys(input.auth.identity.resource_access)[_];
              roles := object.get(input.auth.identity.resource_access, server, {}).roles
            }
          allValues: true

    # Phase 3: Request modification
    response:
      success:
        headers:
          x-authorized-tools:
            wristband:
              issuer: 'authorino'
              customClaims:
                'allowed-tools':
                  selector: auth.authorization.authorized-tools.tools.@tostr
              tokenDuration: 300
              signingKeyRefs:
                - name: trusted-headers-private-key
                  algorithm: ES256
```

**What's happening here:**

1. **Authentication**: Validates the JWT from Keycloak
2. **Authorization with OPA**: Uses Open Policy Agent to extract tool permissions from the JWT's `resource_access` claim (a Keycloak feature where each MCP server is a client and each tool is a role)
3. **Wristband creation**: Creates a new JWT signed with ES256 containing:
   ```json
   {
     "allowed-tools": "{\"server1.mcp.local\":[\"greet\",\"time\"],\"server2.mcp.local\":[\"headers\"]}",
     "iss": "authorino",
     "exp": 1760004918
   }
   ```
4. **Header injection**: Adds this wristband as the `x-authorized-tools` header

The MCP Broker then validates this header's signature and filters the tool list. Because it's cryptographically signed, the broker can trust it came from the authorized policy engine.

### Why This is Powerful

- **Zero trust**: The broker doesn't trust the client's token directly - it trusts Authorino's signed assertion
- **Flexible permissions**: The OPA policy can extract structured metadata, including permissions from any JWT claim structure
- **Efficient**: Permissions are computed once and cached in the wristband for the duration of the request
- **Auditable**: The wristband is a JWT, so it can be logged and inspected

## Solution 2: OAuth2 Token Exchange with RFC 8693

### The Challenge

AI agents typically have broad OAuth2 access tokens covering all services. Passing these tokens to every MCP server creates a privilege escalation risk - a malicious server could use the token to access unauthorized resources.

We need to:
1. Exchange the broad token for a narrow one scoped to each MCP server
2. Verify the new token has the correct audience
3. Check the user is authorized for the specific tool being called
4. Replace the token in the Authorization header

### The Kuadrant Solution

AuthPolicy's metadata phase can call external HTTP services, making OAuth2 token exchange a simple declarative configuration:

```yaml
apiVersion: kuadrant.io/v1
kind: AuthPolicy
metadata:
  name: mcps-auth-policy
  namespace: gateway-system
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: Gateway
    name: mcp-gateway
    sectionName: mcps
  rules:
    # Phase 1: Authentication
    authentication:
      'keycloak':
        jwt:
          issuerUrl: https://keycloak.example.com/realms/mcp

    # Phase 2: Metadata - fetch scoped token
    metadata:
      oauth-token-exchange:
        http:
          url: https://keycloak.example.com/realms/mcp/protocol/openid-connect/token
          method: POST
          credentials:
            authorizationHeader:
              prefix: Basic
          sharedSecretRef:
            name: token-exchange
            key: oauth-client-basic-auth
          bodyParameters:
            grant_type:
              value: urn:ietf:params:oauth:grant-type:token-exchange
            subject_token:
              expression: request.headers['authorization'].split('Bearer ')[1]
            subject_token_type:
              value: urn:ietf:params:oauth:token-type:access_token
            audience:
              expression: request.host  # Target MCP server
            scope:
              value: openid

    # Phase 3: Authorization - verify token and tool access
    authorization:
      'token':
        opa:
          rego: |
            # Use exchanged token if available, otherwise original
            scoped_jwt := object.get(object.get(object.get(input.auth, "metadata", {}),
                "oauth-token-exchange", {}), "access_token", "")
            jwt := j { scoped_jwt != ""; j := scoped_jwt }
            jwt := j { scoped_jwt == ""; j := split(input.request.headers["authorization"], "Bearer ")[1] }
            claims := c { [_, c, _] := io.jwt.decode(jwt) }
            allow = true
          allValues: true

      'scoped-audience-check':
        patternMatching:
          patterns:
            - predicate: |
                has(auth.authorization.token.claims.aud) &&
                type(auth.authorization.token.claims.aud) == string &&
                auth.authorization.token.claims.aud == request.host

      'tool-access-check':
        patternMatching:
          patterns:
            - predicate: |
                request.headers['x-mcp-toolname'] in
                  (has(auth.authorization.token.claims.resource_access) &&
                   auth.authorization.token.claims.resource_access.exists(p, p == request.host) ?
                   auth.authorization.token.claims.resource_access[request.host].roles : [])

    # Phase 4: Response - inject scoped token
    response:
      success:
        headers:
          authorization:
            plain:
              expression: "Bearer " + auth.authorization.token.jwt
```

**The flow:**

1. **Authenticate** the incoming request's JWT
2. **Metadata phase** calls Keycloak's token exchange endpoint (RFC 8693), passing:
   - The original token as the subject
   - The target MCP server hostname as the audience
   - The `mcp-gateway` client credentials for authorization
3. **Authorization phase** does three checks:
   - Extracts claims from the exchanged token (or falls back to original)
   - Verifies `aud` claim matches the target server (`:authority` header)
   - Verifies the user has access to the specific tool (`x-mcp-toolname` header)
4. **Response phase** replaces the Authorization header with the scoped token

### Why This is Powerful

- **Declarative token exchange**: No custom code needed for RFC 8693
- **Chained authorization**: Multiple authorization checks can reference earlier phases
- **Dynamic audience**: Uses CEL expressions to set audience based on request headers
- **Least privilege**: Each server receives only the token it needs

### CEL Expressions in Action

The power of CEL is evident in the authorization predicates. For example, the tool access check:

```cel
request.headers['x-mcp-toolname'] in
  (has(auth.authorization.token.claims.resource_access) &&
   auth.authorization.token.claims.resource_access.exists(p, p == request.host) ?
   auth.authorization.token.claims.resource_access[request.host].roles : [])
```

This single expression:
1. Checks if the JWT has a `resource_access` claim
2. Checks if that claim has an entry for the current host
3. Extracts the roles array for that host
4. Checks if the requested tool name is in that array
5. Returns an empty array as fallback if any step fails

Without CEL, this would require custom code or a complex OPA policy.

### OPA's built-in functions make it all easier

The possibility to embed OPA's Rego built-in capabilities into the AuthPolicy made it easy to decode the scope token for extracting claim, with fall back to the broad token for resilient policy evaluation.

The next authorization steps thereafter became straightforward with the CEL expressions refering to `auth.authorization.token.claims`.

## Solution 3: Vault Integration for Credential Translation

### The Challenge

External MCP servers often don't support OAuth2. GitHub's MCP server requires a Personal Access Token (PAT). Other services use API keys. We need to:
1. Fetch the appropriate credential for each user and server
2. Use it instead of OAuth2 when available
3. Fall back to token exchange when not

### The Kuadrant Solution

AuthPolicy's metadata phase can fetch from multiple sources with priorities. We fetch from Vault first, then fall back to OAuth2 token exchange:

```yaml
metadata:
  # Priority 0: Try Vault first
  vault:
    http:
      urlExpression: |
        "http://vault.vault.svc.cluster.local:8200/v1/secret/data/" +
        auth.identity.preferred_username + "/" + request.host
      method: GET
      credentials:
        customHeader:
          name: X-Vault-Token
      sharedSecretRef:
        name: token-exchange
        key: vault-token
    priority: 0

  # Priority 1: Fallback to token exchange if Vault has no entry
  oauth-token-exchange:
    when:
      - predicate: |
          !has(auth.metadata.vault.data) ||
          !has(auth.metadata.vault.data.data) ||
          !has(auth.metadata.vault.data.data.token) ||
          type(auth.metadata.vault.data.data.token) != string
    http:
      # ... token exchange config ...
    priority: 1
```

The response injection uses conditional logic:

```yaml
response:
  success:
    headers:
      authorization:
        plain:
          expression: |
            "Bearer " + (
              (has(auth.metadata.vault.data) &&
               has(auth.metadata.vault.data.data) &&
               has(auth.metadata.vault.data.data.token) &&
               type(auth.metadata.vault.data.data.token) == string) ?
              auth.metadata.vault.data.data.token :
              auth.authorization.token.jwt
            )
```

**The flow:**

1. **Vault lookup** at path `/v1/secret/data/{username}/{server}` (e.g., `/v1/secret/data/alice/github.mcp.local`)
2. If found, skip token exchange (via the `when` predicate)
3. If not found, fall back to OAuth2 token exchange
4. Response injection uses Vault token if available, otherwise exchanged token

### Why This is Powerful

- **Heterogeneous authentication**: Single policy handles OAuth2, PATs, and API keys
- **User-specific credentials**: Each user can have their own PATs for external services
- **Priority system**: Clear precedence rules for metadata sources
- **Conditional execution**: The `when` predicate prevents unnecessary token exchange

## The Complete Picture: Defense in Depth

When all three solutions are combined, you get defense in depth with multiple security layers:

```
┌──────────────────────────────────────────────────────┐
│                MCP Client (AI Agent)                 │
│      OAuth2 Token (broad scopes, multiple aud)       │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│          Gateway API + Kuadrant AuthPolicies         │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Authentication Phase                           │ │
│  │  - Validate JWT signature                       │ │
│  │  - Extract identity claims                      │ │
│  └───────────────────────┬─────────────────────────┘ │
│                          │                           │
│                          ▼                           │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Metadata Phase                                 │ │
│  │  Priority 0: Check Vault for PAT/API key        │ │
│  │  Priority 1: Exchange token (RFC 8693)          │ │
│  └───────────────────────┬─────────────────────────┘ │
│                          │                           │
│                          ▼                           │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Authorization Phase                            │ │
│  │  - OPA: Extract tool permissions                │ │
│  │  - CEL: Verify audience scope                   │ │
│  │  - CEL: Check tool-level access                 │ │
│  └───────────────────────┬─────────────────────────┘ │
│                          │                           │
│                          ▼                           │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Response Phase                                 │ │
│  │  - (Broker) Create x-authorized-tools wristband │ │
│  │  - (Router) Inject scoped token or Vault PAT    │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────┬──────────────────────┬─────────────────┘
              │                      │
              ▼                      ▼
      ┌───────────────┐      ┌───────────────┐
      │  MCP Broker   │      │  MCP Router   │
      │               │      │  (ext_proc)   │
      │  - Validates  │      │               │
      │    wristband  │      │  - Sets       │
      │  - Filters    │      │    x-mcp-*    │
      │    tool list  │      │    headers    │
      └───────────────┘      └───────┬───────┘
                                     │ Scoped token or PAT
                                     ▼
                             ┌───────────────┐
                             │ Backend MCP   │
                             │   Servers     │
                             └───────────────┘
```

Each layer enforces a different security invariant:
1. **Authentication**: Only valid JWT holders proceed
2. **Metadata**: Credentials are scoped/exchanged before authorization
3. **Authorization**: Access decisions use correct token and permissions
4. **Response**: Injected data is cryptographically signed and verifiable

## Kuadrant's Advantages for This Use Case

### 1. **Declarative Configuration**

The entire security policy is defined in YAML, making it:
- Version controlled
- Auditable
- Testable
- Self-documenting

Compare this to writing custom Envoy filters or external auth services - you'd need hundreds of lines of code to achieve the same functionality.

### 2. **Separation of Concerns**

The multi-phase pipeline naturally separates:
- **Identity verification** (authentication)
- **Context gathering** (metadata)
- **Access decisions** (authorization)
- **Request/response modification** (response)

This mirrors how security teams think about authorization, making policies easier to reason about.

### 3. **Composability**

AuthPolicy uses Gateway API's [defaults and overrides](https://docs.kuadrant.io/latest/kuadrant-operator/doc/overviews/auth/#defaults-and-overrides) pattern:
- Define global policies at the Gateway level
- Override specific rules at the HTTPRoute level

For example, you could set different OAuth2 scopes for different MCP servers by attaching route-specific AuthPolicies.

### 4. **Integration Ecosystem**

The metadata phase's HTTP callout capability enables integration with:
- Secret stores (Vault, AWS Secrets Manager)
- External ACL systems
- Policy decision points (OPA, custom services)
- Rate limit checks
- Audit logging endpoints

All without writing custom code.

### 5. **Expression Language Power**

CEL expressions can:
- Navigate complex JSON structures
- Perform string manipulation
- Evaluate conditional logic
- Access request and auth context

This eliminates the need for custom authorization code for most use cases.

## Real-World Benefits

Organizations using this pattern have seen:

- **Reduced attack surface**: Backend servers never see overly permissive tokens
- **Simplified client code**: AI agents don't handle credential translation or token exchange
- **Centralized policy**: All authorization logic lives in Gateway API resources
- **Better auditability**: AuthPolicy changes are tracked in Git and Kubernetes audit logs
- **Faster development**: New MCP servers can be added without changing client code or broker logic

## Demo of the solution in action

Watch a demo of all 3 solutions in action:

<iframe width="560" height="315" src="https://www.youtube.com/embed/_ETWYIBAbOg?si=jWKN-SBhjMSgXJ-R" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

<br/>

## Try It Yourself

The MCP Gateway repository includes a complete working example with Kuadrant:

```bash
# Create a Kind cluster with Istio Gateway API and Kuadrant
git clone https://github.com/kagenti/mcp-gateway && cd mcp-gateway
make local-env-setup

# Set up OAuth + token exchange + Vault example
make oauth-token-exchange-example-setup

# Open MCP Inspector to test
make inspect-gateway
```

This creates:
- Keycloak realm with users, groups, and tool permissions
- HashiCorp Vault with example PATs
- Three test MCP servers with different auth requirements
- AuthPolicy resources implementing all three patterns

You can experiment by:
- Adding/removing user permissions in Keycloak
- Storing credentials in Vault
- Modifying the AuthPolicy CEL expressions
- Adding new MCP servers with custom auth rules

## Key Takeaways

1. **AuthPolicy is more than authentication**: The metadata and response phases enable sophisticated credential management and request modification.

2. **CEL is powerful**: Common Expression Language provides the flexibility of custom code with the safety of declarative config.

3. **Standards-based integration**: OAuth2 token exchange (RFC 8693) and Gateway API patterns make this solution portable across environments.

4. **Defense in depth**: Multiple authorization layers (authentication, metadata validation, tool-level checks, cryptographic verification) provide strong security guarantees.

5. **MCP is just one use case**: The patterns demonstrated here apply to any scenario requiring fine-grained authorization across aggregated backends with heterogeneous authentication.

## Conclusion

Protecting AI agent tool access is a complex challenge that combines traditional API gateway concerns with novel requirements like tool-level authorization and credential translation. Kuadrant's AuthPolicy provides a powerful, declarative solution that handles this complexity without custom code.

The MCP Gateway case study demonstrates how Kuadrant can:
- Enforce identity-based tool filtering with cryptographic verification
- Implement OAuth2 token exchange to reduce token scope
- Integrate with secret stores for credential translation
- Combine multiple authentication methods in a single policy
- Provide defense in depth through multi-phase authorization

If you're building systems that aggregate APIs with different authentication requirements and need fine-grained access control, Kuadrant's AuthPolicy is worth exploring. The declarative, composable approach scales from simple JWT validation to sophisticated multi-phase authorization flows like those demonstrated here.

### Learn More

- [Kuadrant Documentation](https://docs.kuadrant.io/)
- [AuthPolicy Reference](https://docs.kuadrant.io/latest/kuadrant-operator/doc/reference/authpolicy/)
- [MCP Gateway Repository](https://github.com/kagenti/mcp-gateway)
- [MCP Gateway Authorization Guide](https://github.com/kagenti/mcp-gateway/blob/main/docs/guides/authorization.md)
- [Gateway API Documentation](https://gateway-api.sigs.k8s.io/)
- [Common Expression Language (CEL)](https://github.com/google/cel-spec)
- [Open Policy Agent](https://www.openpolicyagent.org)
