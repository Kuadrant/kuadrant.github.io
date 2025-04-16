---
title: Alpha support for DNSPolicy using CoreDNS
date: 2025-04-15
author: Craig Brookes
---

Kuadrant now offers an Alpha or "Preview" level integration with [CoreDNS](https://coredns.io/) as one of our DNS providers for the [DNSPolicy API](https://docs.kuadrant.io/latest/kuadrant-operator/doc/reference/dnspolicy/). This will allow you to define how you want your DNS to work for your gateway API based gateways whether that is a single gateway or multiple gateways across multiple clusters. The aim with this early support and release is to get this feature into users hands and allow them to experiment, ideally submit feature requests and discover what is missing and any changes we may need to make to our current design.


### Why does this matter?

Until now, the Kuadrant DNS operator has only ever integrated with cloud DNS providers (route53, GCP and Azure). With the addition of CoreDNS as an option, you can now delegate a zone from any edge recursive DNS resolver to a set of CoreDNS instances on your own infrastructure. This means that if you have your own edge DNS server you can keep all of your DNS internally managed but still get the features offered by Kuadrant's and DNSPolicy.


## What can you do with the CoreDNS integration?

Kuadrant has developed its own plug-in for CoreDNS. This currently allows us to support GEO, Weighted and Geo + Weighted DNS responses based on our existing DNSRecord and DNSPolicy resources. The plug-in is required in order to source the DNS records and meta-data from our existing custom resources. So you can use all the features of DNSPolicy with a CoreDNS provider with the exception of health checks and wildcard hosts currently (these will be added in the near future).



## How does it work

To find out more about how it works under the hood, take a look the the [design doc](https://github.com/Kuadrant/architecture/blob/main/docs/design/core-dns-integration.md)


## Getting Started

To get started, take a look at the guide we have prepared. [CoreDNS Guide](https://github.com/Kuadrant/kuadrant-operator/blob/main/doc/user-guides/dns/core-dns.md)

## Whats next

- Support for Wildcard hosts
- Support for HealthChecks
- Exploring what is possible with more advanced policies leveraging on cluster metrics, data and CEL based conditions.

You can track what we are doing for the next iteration of CoreDNS support [here](https://github.com/Kuadrant/dns-operator/issues/447)