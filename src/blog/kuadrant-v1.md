---
title: Kuadrant v1
date: 2024-11-28
author: Jason Madigan
---

**Update:** Kuadrant [v1.0.1](https://github.com/Kuadrant/kuadrant-operator/releases/tag/v1.0.1) is now available, with some small bugfixes.

## Kuadrant v1!

We're thrilled to announce the release of Kuadrant [v1.0.0](https://github.com/Kuadrant/kuadrant-operator/releases/tag/v1.0.0)! This marks a major milestone in the Kuadrant project after its recent acceptance into [CNCF's sandbox](https://www.cncf.io/sandbox-projects/).

### What is Kuadrant?

Kuadrant is a set of Kubernetes-native controllers, services, and APIs that provide gateway policies for existing [Gateway API](https://gateway-api.sigs.k8s.io/) providers in both single and multi-cluster environments. It builds on top of Kubernetes [Gateway API](https://gateway-api.sigs.k8s.io/) and technologies such as Istio and Envoy to introduce provider-agnostic Gateway Policies for Kubernetes.

### Why v1 Matters

Reaching v1 signifies our project's stability, maturity, and production-readiness. With v1, we believe Kuadrant is now ready to power key workloads in Kubernetes environments.

### What's new in v1?

Here are some key highlights from this release:

#### CRD Graduation to v1

`AuthPolicy`, `DNSPolicy`, `RateLimitPolicy`, and `TLSPolicy` have now graduated to `v1` in their CRDs, signalling their readiness for production use. We now consider these APIs stable, and commit to enabling migration paths in subsequent API upgrades.

See the following documentation for API reference and usage examples:

- `AuthPolicy`: [Overview](https://docs.kuadrant.io/1.0.x/kuadrant-operator/doc/overviews/auth/)
- `DNSPolicy`: [Overview](https://docs.kuadrant.io/1.0.x/kuadrant-operator/doc/overviews/dns/)
- `RateLimitPolicy`: [Overview](https://docs.kuadrant.io/1.0.x/kuadrant-operator/doc/overviews/rate-limiting/)
- `TLSPolicy`: [Overview](https://docs.kuadrant.io/1.0.x/kuadrant-operator/doc/overviews/tls/)


#### CEL Support
[CEL](https://cel.dev/) (Common Expression Language) introduces a powerful and flexible way to define conditions and predicates in [`AuthPolicy`](https://github.com/Kuadrant/authorino/blob/main/docs/features.md#common-feature-common-expression-language-cel) and [`RateLimitPolicy`](https://docs.kuadrant.io/1.0.x/kuadrant-operator/doc/reference/ratelimitpolicy/#predicate). With CEL, you can evaluate custom boolean logic, extract and manipulate request data, and conditionally apply policies in expressive, dynamic ways. CEL's rich syntax includes string operations (e.g., `split`, `indexOf`), type-safe expressions, and robust support for combining logical operators.

**Example: Dynamic Authorization Rules in an `AuthPolicy`**

With CEL, you can configure AuthPolicy conditions to enforce access control based on dynamic request attributes. The following example demonstrates a Gateway deny-all policy with a CEL-based exception for requests to the `/health` path:

```yaml
apiVersion: kuadrant.io/v1
kind: AuthPolicy
metadata:
  name: my-gateway-auth
  namespace: gateways
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: Gateway
    name: my-gateway
  defaults:
   when:
     - predicate: "request.path != '/health'"
   rules:
    authorization:
      deny-all:
        opa:
          rego: "allow = false"
    response:
      unauthorized:
        headers:
          "content-type":
            value: application/json
        body:
          value: |
            {
              "error": "Forbidden",
              "message": "Access denied by default by the gateway operator. If you are the administrator of the service, create a specific auth policy for the route."
            }
```

For much more detailed examples, see this [document](https://github.com/Kuadrant/authorino/blob/main/docs/features.md#common-feature-conditions-when).

**Example: User-Specific Rate Limiting in RateLimitPolicy**

CEL can also simplify rate-limiting rules. Here's an example limiting general users to 1 request every 3 seconds while giving a specific user, "bob" a higher limit of 2 requests per 3 seconds:

```yaml
apiVersion: kuadrant.io/v1
kind: RateLimitPolicy
metadata:
  name: toystore
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: HTTPRoute
    name: toystore
  limits:
    "general-user":
      rates:
        - limit: 1
          window: 3s
      counters:
        - expression: auth.identity.userid
      when:
        - predicate: "auth.identity.userid != 'bob'"
    "bob-limit":
      rates:
        - limit: 2
          window: 3s
      when:
        - predicate: "auth.identity.userid == 'bob'"
```




#### On-cluster Gateway DNS Health Checks

`DNSPolicy` now supports DNS health checks for `Gateway` resources. This allows you to define HTTP-based health checks for targetted `Gateway` listeners with specific (i.e. non-wildcard) hostnames. These health checks evaluate the health of configured endpoints, ensuring that unhealthy enpoints are unpublished or excluded from DNS records. 

An example:

Suppose you have a `Gateway` called `external` with a listener for `example.com` and want to ensure only healthy endpoints are published. You can define a `DNSPolicy` with the following configuration:

```yaml
apiVersion: kuadrant.io/v1
kind: DNSPolicy
metadata:
  name: gateway-dns
spec:
  healthCheck:
    failureThreshold: 3
    interval: 5m
    path: /health
  ...
   targetRef:
    group: gateway.networking.k8s.io
    kind: Gateway
    name: external  
```

This policy sets up a health check that probes the `/health` endpoint on `example.com` every 5 minutes. If `3` consecutive checks fail, the `DNSRecord` for `example.com` will be marked unhealthy. Depending on the policy's configuration, the IP will either be excluded from DNS records (say, if it's part of a multi-value A record) or unpublished altogether. This ensures that only healthy endpoints are routed through DNS.


To read more about `DNSPolicy` and health checks, see our [DNS health checks documentation](https://docs.kuadrant.io/1.0.x/kuadrant-operator/doc/user-guides/dns/dnshealthchecks/)

#### Policy Machinery Integration

Our core components now implement [policy-machinery](https://github.com/Kuadrant/policy-machinery), providing a powerful way to calculate and visualise the "state of the world" for policy-attachment based policies on Kubernetes clusters. No more guessing where policies and their behaviours originate from. Policy machinery and visualisation through the console plugin make it easier than ever to reason about policy effects, behaviours and origins.

#### Shift to the Sail Operator

With v1, we recommend installing Istio using the new Istio [Sail Operator](https://istio.io/latest/blog/2024/introducing-sail-operator/) instead of `istioctl`. Our guides and documentation for getting started have been amended to incorporate this change.


#### Envoy Gateway support

We've recently added [support](https://github.com/Kuadrant/kuadrant-operator/issues/325) for [Envoy Gateway](https://gateway.envoyproxy.io/) as a Gateway API implementation, complementing the Istio support we’ve provided so far. Until now, Kuadrant relied exclusively on Istio as a Gateway API provider, leveraging its robust extension mechanisms, such as [Wasm Plugins](https://istio.io/latest/docs/reference/config/proxy_extensions/wasm-plugin/). However, recent advancements in Envoy Gateway, including the introduction of [`EnvoyPatchPolicy`](https://gateway.envoyproxy.io/contributions/design/envoy-patch-policy/) and [Wasm Extensions](https://gateway.envoyproxy.io/v1.1/tasks/extensibility/wasm/), enable us to achieve similar functionality with Envoy Gateway.

Our [installation guides](https://docs.kuadrant.io/1.0.x/kuadrant-operator/doc/install/install-kubernetes/#optional-install-envoy-gateway-as-a-gateway-api-provider) for Kubernetes now include optional steps to choose between Istio or Envoy Gateway as your preferred Gateway API provider.


#### Wasm-based Auth

Although primarily an "under the hood" enhancement, this change is significant and worth highlighting.

Previously, [Authorino](https://github.com/Kuadrant/authorino), which implements `AuthPolicy`, relied on Istio's [AuthorizationPolicy](https://istio.io/latest/docs/reference/config/security/authorization-policy/) to provide authorization in the request flow. Starting with v1, this mechanism has been replaced with an [EnvoyFilter](https://istio.io/latest/docs/reference/config/networking/envoy-filter/) and [Wasm Extensions](https://github.com/Kuadrant/wasm-shim), aligning its implementation with how `RateLimitPolicy` operates.

`RateLimitPolicy` has long utilised a Wasm-shim as an intercept point to apply rate-limiting logic in Envoy. By adopting a similar Wasm-shim-based approach, `AuthPolicy` now gains improved flexibility and extensibility. This update also simplifies our architecture by standardising the mechanisms used across our core policies, ensuring both consistency and better alignment.

#### SectionName Support

Added support for [SectionName](https://gateway-api.sigs.k8s.io/reference/spec/#gateway.networking.k8s.io%2fv1.SectionName) throughout our policy set, allowing users to apply policies to specific sections of Gateways.

#### New Console Plugin

For [OpenShift](https://www.redhat.com/en/technologies/cloud-computing/openshift) / [OKD](https://okd.io/) console users, a new Console Plugin is available for managing policies and visualising [policy-machinery](https://github.com/Kuadrant/policy-machinery) "state of the world". We plan to make some of this functionality available through other means for Kubernetes users in the near future.


#### Other, smaller changes

In addition to the above, many more smaller fixes and enhancements are captured by our [release changelogs](https://github.com/Kuadrant/kuadrant-operator/releases/tag/v1.0.0)). Take a look at our associated component release notes too for smaller changes not covered in detail here.

### Components in this release

The individual components that make up this v1.0.0 release of the Kuadrant Operator:

| **Component**       | **Version**                                                                                       |
|---------------------|---------------------------------------------------------------------------------------------------|
| Authorino Operator  | [v0.16.0](https://github.com/Kuadrant/authorino-operator/releases/tag/v0.16.0)                    |
| Limitador Operator  | [v0.12.1](https://github.com/Kuadrant/limitador-operator/releases/tag/v0.12.1)                    |
| DNS Operator        | [v0.12.0](https://github.com/Kuadrant/dns-operator/releases/tag/v0.12.0)                          |
| Wasm Shim           | [v0.8.1](https://github.com/Kuadrant/wasm-shim/releases/tag/v0.8.1)                               |
| Console Plugin      | [v0.0.14](https://github.com/Kuadrant/console-plugin/releases/tag/v0.0.14)                        |

### Thank you and how to get involved

We are always looking for ways to extend the community and encourage contributions. We thank all of our community contributors for helping make v1 happen! 

To find out more and get involved:

- Check out the [documentation](https://docs.kuadrant.io)
- Explore the Kuadrant [repositories](https://github.com/kuadrant/)
- Engage with the [community](https://kuadrant.io/community/)
