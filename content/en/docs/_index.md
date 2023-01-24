---
title: "Kuadrant Documentation"
linkTitle: "Docs"
slug: "docs"
---

## Architecture

Kuadrant build on top of Kubernetes [Gateway API](https://gateway-api.sigs.k8s.io/) and [Istio](https://istio.io/) to operate cluster ingress gateways to apply rate limits and authorization policies.

![Architecture](/docs/kuadrant-operator/images/kuadrant-architecture.svg)

## Use cases
  - [Simple rate limiting for API owners](/docs/kuadrant-operator/user-guides/simple-rl-for-api-owners.md)
  - [Authenticated rate limiting for API owners](/docs/kuadrant-operator/user-guides/authenticated-rl-for-api-owners.md)
  - [Gateway rate limiting for cluster operators](/docs/kuadrant-operator/user-guides/gateway-rl-for-cluster-operators.md)
  - [Authenticated rate limiting with JWTs and Kubernetes authnz](/docs/kuadrant-operator/user-guides/authenticated-rl-with-jwt-and-k8s-authnz.md)

## Authorino
  - [Getting started](/docs/authorino/getting-started.html)
  - [Architecture](/docs/authorino/architecture.md)
  - [Features](/docs/authorino/features.md)
  - [Terminology](/docs/authorino/terminology.md)
  - [User guides](/docs/authorino/user-guides.html)
  - [Contributing to Authorino](/docs/authorino/contributing.md)

## Limitador
  - [Server configuration](/docs/limitador-server/configuration.html)

## Contributing to Kuadrant
  - [Developer's Guide](/docs/kuadrant-operator/development.md)
