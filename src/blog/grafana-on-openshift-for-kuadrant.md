---
title: Installing Grafana on Openshift for Kuadrant Observability. 
date: 2024-11-08
author: David Martin
---

To make the most out of Kuadrant on OpenShift, you can install Grafana and import example dashboards for enhanced observability. This guide demonstrates how to install and configure Grafana using the Grafana Operator on OpenShift, specifically using `oc` commands. We'll also set up datasources to pull metrics from the OpenShift Thanos Query instance.

## Prerequisites

- **OpenShift version 4.17** (commands tested on this version)
- **Kuadrant installed** on your OpenShift cluster
- `oc` CLI tool installed and configured
- User with `cluster-monitoring-view` role

## Installing the Grafana Operator

Grafana can be installed and managed on OpenShift using the [Grafana Operator](https://grafana.github.io/grafana-operator/). The operator is available via the `community-operators` source in OpenShift.

Create a `Subscription` to install the Grafana Operator:

```bash
cat << EOF | oc apply -f -
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  labels:
    operators.coreos.com/grafana-operator.openshift-operators: ""
  name: grafana-operator
  namespace: openshift-operators
spec:
  channel: v5
  installPlanApproval: Automatic
  name: grafana-operator
  source: community-operators
  sourceNamespace: openshift-marketplace
EOF
```

> **Note:** The `v5` channel introduces changes that are **not** backward compatible with version 4 of the operator.

## Creating a Grafana Instance

Next, create a Grafana Custom Resource (CR):

```bash
cat << EOF | oc apply -f -
apiVersion: grafana.integreatly.org/v1beta1
kind: Grafana
metadata:
  labels:
    dashboards: grafana
  name: grafana
  namespace: openshift-operators
spec:
  config:
    auth:
      disable_login_form: 'false'
    log:
      mode: console
    security:
      admin_password: secret
      admin_user: root
  route:
    metadata: {}
    spec: {}
  version: 10.4.3
EOF
```

> **Note:** For simplicity, the admin username and password are set inline as `root` and `secret` respectively. Adjust these values as needed for your environment.

## Configuring Grafana DataSource

The source of metrics for Kuadrant dashboards will be the Thanos Query instance in the OpenShift cluster. This Thanos instance provides important cluster metrics, as well as any metrics pushed from the user-workload Prometheus instance (which includes metrics from the gateway and Kuadrant components).

> **Note:** User workload monitoring needs to be enabled to include metrics from user workloads. See the [Openshift documentation](https://docs.openshift.com/container-platform/4.17/observability/monitoring/enabling-monitoring-for-user-defined-projects.html) for how to do this.

To allow Grafana to access Thanos Query, you can either use a user token or create a ServiceAccount token. In this guide, we'll use the token of the currently logged-in user.

> **Note:** The user/serviceaccount must have the `cluster-monitoring-view` role. Depending on the type of account used, the token may expire after a set amount of time. For more information on accessing Thanos Query in an OpenShift cluster, refer to the [OpenShift documentation](https://docs.openshift.com/container-platform/4.15/observability/monitoring/accessing-third-party-monitoring-apis.html#accessing-metrics-from-outside-cluster_accessing-monitoring-apis-by-using-the-cli).

Retrieve the user token and Thanos Query hostname:

```bash
TOKEN=$(oc whoami -t)
HOST=$(oc -n openshift-monitoring get route thanos-querier -o jsonpath={.status.ingress[].host})
```

Create the Grafana datasource:

```bash
cat << EOF | oc apply -f -
apiVersion: grafana.integreatly.org/v1beta1
kind: GrafanaDatasource
metadata:
  name: thanos-query-ds
  namespace: openshift-operators
spec:
  datasource:
    access: proxy
    isDefault: true
    jsonData:
      httpHeaderName1: 'Authorization'
      timeInterval: 5s
      tlsSkipVerify: true
    secureJsonData:
      httpHeaderValue1: 'Bearer ${TOKEN}'
    name: thanos-query-ds
    type: prometheus
    url: 'https://${HOST}'
  instanceSelector:
    matchLabels:
      dashboards: grafana
EOF
```

> **Note:** The token is included in plaintext in the `secureJsonData` section. For different authentication methods and best practices, consult the [Grafana Operator documentation](https://grafana.github.io/grafana-operator/docs/quick-start/).

## Accessing Grafana

Retrieve the Grafana route to access the UI:

```bash
oc -n openshift-operators get routes grafana-route -o jsonpath="https://{.status.ingress[].host}"
```

Open the provided URL in your web browser and log in using the credentials set earlier (`root`/`secret`).

## Importing Kuadrant Dashboards

Import the Kuadrant dashboards into Grafana as detailed in the [Kuadrant documentation](https://docs.kuadrant.io/latest/kuadrant-operator/doc/observability/examples/).

If you have a gateway configured with Kuadrant policies, you should see activity on the various dashboards.

## Further Reading

- [Metrics](https://docs.kuadrant.io/latest/kuadrant-operator/doc/observability/metrics/)
- [Dashboards and Alerts](https://docs.kuadrant.io/latest/kuadrant-operator/doc/observability/examples/)
- [Tracing](https://docs.kuadrant.io/latest/kuadrant-operator/doc/observability/tracing/)
- [Deploying Grafana on Openshift (using older v4 channel)](https://cloud.redhat.com/experts/o11y/ocp-grafana/)
