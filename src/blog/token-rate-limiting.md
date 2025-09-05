---
title: Introducing TokenRateLimitPolicy for LLM API Protection
date: 2025-07-10
author: Jason Madigan
---

We're excited to announce a new `TokenRateLimitPolicy` API in Kuadrant as `v1alpha1`, designed specifically for protecting Large Language Model (LLM) APIs through token-based rate limiting.

## Rate-limiting and LLMs

Traditional rate limiting (for example, that of our `RateLimitPolicy`) counts requests, but LLM APIs have varying computational costs based on token consumption per inference request. Platform Engineers and SRE teams making models (be they in-cluster, or hosted elsewhere) available for internal or external usage are likely to want to protect these resources from over consumption, given their expense.

## `TokenRateLimitPolicy`

The `TokenRateLimitPolicy` introduces rate limiting that:
- **Counts tokens consumed** - Automatically extracts token usage from OpenAI-style LLM responses
- **Enables tiered access** - Combined with an `AuthPolicy`, enables different token limits for different user groups  
- **Works with OpenAI-compatible APIs** - Supports standard token usage response formats

## How It Works

Here is a simple example that sets different daily token limits for user tiers:

```yaml
apiVersion: kuadrant.io/v1alpha1
kind: TokenRateLimitPolicy
metadata:
  name: llm-token-limits
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: Gateway
    name: api-gateway
  limits:
    free:
      rates:
        - limit: 20000
          window: 24h
      when:
        - predicate: request.path == "/v1/chat/completions"
        - predicate: >
            request.auth.identity.metadata.annotations["kuadrant.io/groups"].split(",").exists(g, g == "free")
      counters:
        - expression: auth.identity.userid
    gold:
      rates:
        - limit: 200000
          window: 24h
      when:
        - predicate: request.path == "/v1/chat/completions"
        - predicate: >
            request.auth.identity.metadata.annotations["kuadrant.io/groups"].split(",").exists(g, g == "gold")
      counters:
        - expression: auth.identity.userid
```

The policy automatically extracts the `usage.total_tokens` field from OpenAI-style LLM API downstream responses. Currently, only non-streaming responses are supported (where `stream: false` or is omitted in the request). 

For example, a typical response from `/v1/chat/completions`:

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-3.5-turbo-0613",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I assist you today?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 85,
    "total_tokens": 100
  }
}
```

The `TokenRateLimitPolicy` reads the `usage.total_tokens` value (100 in this example) and counts it against the user's configured limit.

## Getting Started

Check out our comprehensive [TokenRateLimitPolicy tutorial](/doc/user-guides/tokenratelimitpolicy/authenticated).

## What's Next

This is our first alpha release of `TokenRateLimitPolicy`. We're actively working on:
- Support for streaming responses (currently only non-streaming responses are supported)
- Custom token extraction paths to support more inference endpoints
- Token budget alerts and notifications
- Observability and metrics

We'd love your feedback! Try out the new policy and let us know your thoughts through our [community channels](https://kuadrant.io/community/).

## Learn More

- [TokenRateLimitPolicy Tutorial](/doc/user-guides/tokenratelimitpolicy/authenticated)
- [API Reference Documentation](https://docs.kuadrant.io/latest/reference/tokenratelimitpolicy/)
- [Kuadrant on GitHub](https://github.com/kuadrant)
