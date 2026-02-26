---
title: "Introducing the Kuadrant Developer Portal: Powered by the new Backstage plugin"
date: 2026-02-26
author: Rachel Lawton
---

# Introducing the Kuadrant Developer Portal: Self-Service API Access Management for Kubernetes

We're excited to announce the **Developer Preview** of the Kuadrant Developer Portal, available **end of February 2026**. This new Backstage plugin brings comprehensive API access management to your developer portal. Platform engineers and API owners can now provide secure API access to consumers.

<div style="margin: 0 auto; width: 560px; max-width: 100%;">
<iframe width="560" height="315" src="https://www.youtube.com/embed/Zeh_KHn1BI0?si=An8uMVFImHKhcw9W" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

<br/>

## What is the Kuadrant Developer Portal?

The Kuadrant Developer Portal is a set of Backstage plugins that enables **self-service API access management** for Kubernetes-native APIs. It bridges the gap between APIs running on Kubernetes with Kuadrant policies and internal developer portals, creating a streamlined workflow for API discovery, access requests, and key management.

Instead of managing API keys manually, the portal provides:

- **For API Consumers**: A self-service portal to discover APIs with descriptions, documentation, and OpenAPI specifications, see available service tiers and rate limits, request access, and receive credentials once approved (shown once and must be saved immediately)
- **For API Owners**: Tools to publish API products, choose between automatic and manual approval modes, review pending requests with requester context and use case, and set documentation links for self-service
- **For API Admins**: Cross-team oversight and governance with the ability to view and manage all API products across the organization, approve or reject any API key request for centralized governance, and troubleshoot issues on behalf of API owners
- **For Platform Engineers**: Infrastructure setup including deploying the Developer Portal Controller and Backstage plugin, configuring AuthPolicy and PlanPolicy resources, and establishing RBAC guardrails that enable self-service without platform team involvement in individual requests

## Key Capabilities

### 1. API Discovery and Catalog Integration

Published API products automatically sync from Kubernetes to the Backstage catalog. APIs appear in the catalog alongside other Backstage resources.

API consumers can:

- Browse available APIs
- View documentation and OpenAPI specifications
- See available plan tiers and their rate limits
- Find contact information for API support

The catalog integration provides a unified view of your platform's capabilities.

### 2. Access Plans with Rate Limiting

Platform engineers can define rate limits on the cluster using a `PlanPolicy`. For example: bronze with 10 requests/day, silver with 50/day, gold with 100/day. These plans are automatically discovered and displayed in the portal.

API consumers select the plan that matches their needs when requesting access. API owners can make informed approval decisions based on the requested plan and use case.

### 3. Complete API Key Lifecycle Management

The developer portal handles the full lifecycle of API keys:

- **Request**: Consumers select an API, optionally choose a plan tier, and provide a use case justification
- **Review**: Owners view pending requests in an approval queue with full context (requester, tier, use case)
- **Approve/Reject**: Single or bulk approval workflows with confirmation dialogs
- **Provision**: Approved requests automatically generate Kubernetes Secrets with API keys
- **Use**: Consumers view and copy their API keys with show-once security
- **Manage**: Edit pending requests, revoke keys, or delete unused access

All operations are secured with granular RBAC permissions and ownership verification.

### 4. Approval Workflows

The portal supports two approval modes:

- **Manual Approval**: API owners review each request and make approval decisions based on the requester's identity and use case
- **Automatic Approval**: Trusted consumers can receive immediate access without manual review

The approval queue provides filtering by status, API product, and plan tier. Bulk approval capabilities enable efficient processing of multiple requests.

### 5. Role-Based Access Control (RBAC)

Each persona has 22 granular permissions controlling create, read, update, delete, and approve operations, with resource-level scoping for fine-grained access control.

## Technical Architecture

For more information about Kuadrant plugins architecture please see the [Kuadrant plugin](https://github.com/R-Lawton/kuadrant-backstage-plugin/blob/main/docs/plugin-architecture.md) architecture doc.

## How It Works

### Platform Engineer Setup

```
┌─────────────────────────────────────────────────────────┐
│ Kubernetes Cluster                                      │
│                                                         │
│  Gateway + HTTPRoute → AuthPolicy → PlanPolicy          │
│  (API endpoint)       (API keys)   (bronze/silver/gold) │
└─────────────────────────────────────────────────────────┘
```

Platform engineers deploy APIs with Gateway API resources, configure Kuadrant AuthPolicy for API key authentication, and optionally define PlanPolicy with tiered rate limits.

### API Owner Publishes Product

```
┌────────────────────────────────────────────────────────┐
│ Backstage UI - Kuadrant Page                           │
│                                                        │
│  [Create API Product]                                  │
│   ├─ Select HTTPRoute: getting-started-toystore        │
│   ├─ Name: toystore-api                                │
│   ├─ Description: E-commerce product catalog API       │
│   ├─ Approval Mode: Manual                             │
│   ├─ Plan Tiers: Discovered from PlanPolicy            │
│   │   • Bronze: 10 requests/day                        │
│   │   • Silver: 50 requests/day                        │
│   │   • Gold: 100 requests/day                         │
│   └─ Publish: Published → Syncs to Backstage catalog   │
└────────────────────────────────────────────────────────┘
```

API owners link their existing HTTPRoute to an API Product in the Backstage UI. Plan tiers with rate limits are automatically discovered and displayed from the cluster.

### Consumer Requests Access

```
┌─────────────────────────────────────────────────────────┐
│ Backstage Catalog - Toystore API                        │
│                                                         │
│  [API Keys Tab]                                         │
│   [Request API Access]                                  │
│    ├─ Plan Tier: Silver (50 requests/day)               │
│    └─ Use Case: "Integration with checkout service"     │
│                                                         │
│  Status: Pending                                        │
└─────────────────────────────────────────────────────────┘
```

Consumers discover the API in the catalog, view available tiers, select a plan, and submit a request with justification.

### Owner Approves Request

```
┌─────────────────────────────────────────────────────────┐
│ Backstage UI - Approval Queue                           │
│                                                         │
│  Pending Requests                                       │
│   ┌───────────────────────────────────────────────┐     │
│   │ API: Toystore API                             │     │
│   │ Requester: team-checkout                      │     │
│   │ Tier: Silver (50/day)                         │     │
│   │ Use Case: "Integration with checkout service" │     │
│   │                                               │     │
│   │ [Approve] [Reject]                            │     │
│   └───────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

Owners review the request context and approve. This triggers automatic Kubernetes Secret creation.

### Consumer Uses API Key

Consumers view their approved key (with show-once security), copy it, and see code examples for immediate use.

## Why Kuadrant Developer Portal?

### Kubernetes-Native Architecture

Built on Kuadrant's Gateway API, the portal integrates naturally with your existing Kubernetes infrastructure. No additional databases, message queues, or external dependencies. Everything runs on Kubernetes using CRDs and the Gateway API standard.

### Self-Service Developer Experience

Reduce operational toil by enabling developers to discover APIs, request access, and retrieve credentials without filing tickets or waiting for manual provisioning. API owners maintain control through approval workflows while developers get faster access.

### Enterprise-Grade Security

Granular RBAC permissions, ownership-based resource isolation, show-once API key viewing, and full audit trails ensure secure API access management that meets enterprise requirements.

### Backstage Integration

As a Backstage plugin, the portal fits naturally into your existing developer portal ecosystem. APIs appear in the catalog alongside other entities, permissions integrate with Backstage RBAC, and the UI follows Backstage design patterns.

### Flexible Rate Limiting

Optional tiered access plans with configurable rate limits (daily, weekly, monthly, yearly, or custom windows) let you offer different service levels based on consumer needs. From experimental bronze tiers to production-ready gold tiers.

## Try It Out

The Kuadrant Developer Portal will be available for **Developer Preview at the end of February 2026**.

The plugins work with existing Red Hat Developer Hub or Backstage instances. You'll need a Kubernetes cluster with the Kuadrant operator installed and Gateway API CRDs.

Visit our [Installation Guide](docs/installation.md) for step-by-step setup instructions including Kubernetes RBAC configuration, frontend setup, and catalog integration.

Follow our [Getting Started Tutorial](docs/getting-started.md) for an end-to-end walkthrough. The tutorial demonstrates the complete workflow from platform engineer setup to API consumer usage, showing all key capabilities of the developer portal.

For questions or to give feedback join the Kuadrant [Slack channel](https://kubernetes.slack.com/archives/C05J0D0V525)

## Additional Resources

- **[RBAC Permissions Guide](docs/rbac-permissions.md)**: Detailed permission model and role definitions
- **[Kuadrant Documentation](https://docs.kuadrant.io/)**: Full Kuadrant operator documentation
- **[GitHub Repository](https://github.com/kuadrant/kuadrant-backstage-plugin)**: Source code and issue tracking
