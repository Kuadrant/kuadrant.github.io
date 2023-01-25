---
title: "Rate limiting and Authnz for OpenShift Service Mesh with Kuadrant"
releases: "v0.2.0"
slug: "kuadrant-v0.2"
linkTitle: "Kuadrant v0.2.0"
date: "2023-01-24"
---

First public release of Kuadrant is out!
<!--more--> 

## Rate Limit your services in the mesh like the old days

Rate limiting is a critical aspect of managing traffic in a mesh network, and we're excited to announce that it's now easier than ever to implement in OpenShift Service Mesh (OSSM) with [Kuadrant](https://kuadrant.io). Developed by Red Hat, Kuadrant is a Kubernetes-native solution that integrates seamlessly with OpenShift Service Mesh and provides robust rate limiting and authorization capabilities to help you maintain control over your cluster's resources.

Kuadrant bundles [Limitador](https://github.com/Kuadrant/limitador), the rate limiting service, and [Authorino](https://github.com/Kuadrant/authorino), our lightweight authorization service, which are leveraged within Red Hat OpenShift application services today. The Kuadrant Operator, available from [Operator Hub](https://operatorhub.io/operator/kuadrant-operator), will take care of all the wiring and deployments of the services required for applying Rate Limits and Authorization Policies to your infrastructure. 

Once installed, Policy Custom Resource Definitions let cluster operators apply a cluster-wide Rate Limit policy to protect the infrastructure from DDoS attacks; while application developers can use advanced features to control usages of their API endpoints based on API keys handed out to their users. Kuadrant supports a wide range of use cases, from simple Rate Limiting to ones that span across authorization and identity-based Rate Limits. 

## Advanced Authnz workflows in OSSM

OpenShift Service Mesh already offers support for protecting APIs based on built-in Envoy filters for simple, opinionated use-cases such as JSON Web Token (JWT) authentication and authorization based on limited condition matchers, via Istio Authorization Policies. However, as developers, we are frequently asked to go the extra mile in order to support more complex real-world use cases while not giving up on the benefits of relying on proven standards and patterns for implementing authentication and authorization properly.

This is where Authorino, enabled by Kuadrant on OpenShift Service Mesh, comes in. Kuadrant Authorization Policies will not only handle the wiring of auth filtering for your network traffic but will also open up options for authentication and authorization based on API keys (for simpler and quicker onboarding), Kubernetes RBAC (for a truly Kubernetes-native setup), and Open Policy Agent (OPA) (for full-power, complex authorization rules), among others.

Here’s a practical example. Imagine you have an API that you want to be accessed by users authenticated by an Single-Sign On (SSO) server that implements OpenID Connect (OIDC) but also consumed within the cluster by other workloads authenticated using Kubernetes Service Account tokens. Moreover, say you want to enforce Role-Based Access Control (RBAC) with permissions (roles and role bindings) managed as Kubernetes resources; plus rate limit requests to your API per user. You can achieve all that with a [single Kuadrant AuthPolicy](http://kuadrant.io/docs/kuadrant-operator/user-guides/authenticated-rl-with-jwt-and-k8s-authnz.html) custom resource.

## Gateway API & Policy attachment

Kuadrant leverages the [Kubernetes Gateway API](https://gateway-api.sigs.k8s.io/), which is currently under development by the community. This API introduces a range of new network resources, including the Gateway, which represents an ingress point into your cluster, and the HTTPRoute, which connects a Gateway to a Kubernetes service for HTTP traffic. The API introduces [more new resources](https://gateway-api.sigs.k8s.io/concepts/api-overview/#resource-model), but most importantly all these resources are role-oriented. Managing the Gateway resource, for example, would be more targeted at cluster operators, while the HTTPRoute is targeted at application developers deploying Services on the cluster. 

OpenShift Service Mesh 2.2 added support for the [Kubernetes Gateway API as a tech preview](https://docs.openshift.com/container-platform/4.10/service_mesh/v2x/servicemesh-release-notes.html#new-features-red-hat-openshift-service-mesh-2-2). Leveraging that very same API, Kuadrant uses the [Policy Attachment](https://gateway-api.sigs.k8s.io/references/policy-attachment/) mechanism of the Gateway API to provide both Rate Limiting and Authorization. The Kuadrant policies, which are custom resources, represent the policy to apply to the network resource it points to, e.g. a RateLimitPolicy attached to an HTTPRoute that routes traffic to a given back-end service to a maximum given rate of 100 requests per second. 

## Secure Your Services in the Mesh with Kuadrant: A Hands-On Guide

### Pre requisites

* [OpenShift cluster](https://docs.openshift.com/container-platform/4.11/welcome/index.html)
* [oc CLI tool](https://docs.openshift.com/container-platform/4.2/cli_reference/openshift_cli/getting-started-cli.html#cli-installing-cli_cli-developer-commands)
* Admin privileges to the OpenShift cluster
* The following [operators installed](https://docs.openshift.com/container-platform/4.11/operators/user/olm-installing-operators-in-namespace.html#olm-installing-from-operatorhub-using-web-console_olm-installing-operators-in-namespace) in the cluster 
  * [Red Hat OpenShift distributed tracing platform](https://catalog.redhat.com/software/operators/detail/5ec54a5c78e79e6a879fa271)
  * [Red Hat OpenShift Service Mesh](https://catalog.redhat.com/software/operators/detail/5ec53e8c110f56bd24f2ddc4)

### Limitations
As of today, but will be addressed in the near future

* 1 Kuadrant instance (CR) per cluster
* 1 AuthPolicy and RateLimitPolicy per network resource
* Namespace of policies needs to be the same of its target network resources
* Gateways that'll be managed by Kuadrant should be already in the cluster
 
### Diagram of what we'll be doing

![diagram with architecture of demo](/img/blog/releases/v0.2.0/deployment.png)


### Prepare your service mesh

**1. Login to your cluster**

```sh
export CLUSTER_DOMAIN=<openshift-cluster-domain>
oc login --token=<secret> --server=https://api.$CLUSTER_DOMAIN:6443
```

**2. Install [Gateway API](https://gateway-api.sigs.k8s.io/concepts/api-overview/)**

```sh
kubectl get crd gateways.gateway.networking.k8s.io || { kubectl kustomize "github.com/kubernetes-sigs/gateway-api/config/crd?ref=v0.4.0" | kubectl apply -f -; }
```

**3. Create the service mesh control plane (SMCP)**

Create the namespace where the SMCP will be installed:
```sh
kubectl create namespace istio-system
```

Apply the `ServiceMeshControlPlane` custom resource:

```sh
kubectl apply -n istio-system -f -<<EOF
apiVersion: maistra.io/v2
kind: ServiceMeshControlPlane
metadata:
  name: istiocontrolplane # set the ISTIOOPERATOR_NAME env var in the Kuadrant Operator deployment if this is named otherwise
spec:
  runtime:
    components:
      pilot:
        container:
          env:
            PILOT_ENABLE_GATEWAY_API: "true"
            PILOT_ENABLE_GATEWAY_API_DEPLOYMENT_CONTROLLER: "true"
            PILOT_ENABLE_GATEWAY_API_STATUS: "true"
  version: v2.3
  policy:
    type: Istiod
  telemetry:
    type: Istiod
  addons:
    prometheus:
      enabled: false
    kiali:
      enabled: false
    grafana:
      enabled: false
EOF
```

**4. Deploy the gateway**

```sh
kubectl apply -n istio-system -f -<<EOF
apiVersion: gateway.networking.k8s.io/v1alpha2
kind: Gateway
metadata:
  labels:
    istio: ingressgateway
  name: istio-ingressgateway
spec:
  gatewayClassName: istio
  listeners:
  - name: default
    port: 80
    protocol: HTTP
    allowedRoutes:
      namespaces:
        from: All
  addresses:
  - value: istio-ingressgateway.istio-system.svc.cluster.local
    type: Hostname
EOF
```

### Set up Kuadrant

**1. Install the Kuadrant Operator**
[Install Kuadrant](https://docs.openshift.com/container-platform/4.11/operators/user/olm-installing-operators-in-namespace.html#olm-installing-from-operatorhub-using-web-console_olm-installing-operators-in-namespace) from the your OpenShift cluster UI

![](/img/blog/releases/v0.2.0/operatorhub.png)

**2. Request a Kuadrant instance**

Create the namespace:

```sh
kubectl create namespace kuadrant
```

Apply the `Kuadrant` custom resource:
```sh
kubectl apply -n kuadrant -f -<<EOF
apiVersion: kuadrant.io/v1beta1
kind: Kuadrant
metadata:
  name: kuadrant
spec: {}
EOF
```

### Add an application to protect

**1. Deploy an example application**

Create the namespace where the application, its networking objects and protection policies will be installed:
```sh
kubectl create namespace toystore
```

As an example, one could use our testing multiuse "echo" API, and call it "toystore":
```sh
kubectl apply -n toystore -f https://raw.githubusercontent.com/Kuadrant/kuadrant-operator/3e05cf590dab0faeca63c4b13b88771676beddc2/examples/toystore/toystore.yaml
```

**2. Onboard the application into the mesh**

Add the application namespace (toystore) to the mesh:

```sh
kubectl apply -n toystore -f -<<EOF
apiVersion: maistra.io/v1
kind: ServiceMeshMember
metadata:
  name: default
spec:
  controlPlaneRef:
    namespace: istio-system
    name: istiocontrolplane
EOF
```

Annotate the deployment for the Istio sidecar injection:

```sh
kubectl patch -n toystore deployment/toystore -p '{"spec": {"template":{"metadata":{"annotations":{"sidecar.istio.io/inject":"true"}}}} }'
```

Route the application through the gateway:

```sh
kubectl apply -n toystore -f - <<EOF
apiVersion: gateway.networking.k8s.io/v1alpha2
kind: HTTPRoute
metadata:
  name: toystore
  labels:
    app: toystore
spec:
  parentRefs:
    - name: istio-ingressgateway
      namespace: istio-system
  hostnames: ["*.toystore.apps.$CLUSTER_DOMAIN"]
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: "/toy"
          method: GET
      backendRefs:
        - name: toystore
          port: 80
EOF
```

**3.Expose the application**

Expose the application for N/S traffic:

```sh
oc expose -n istio-system service/istio-ingressgateway --port 8080 --name toystore --hostname=api.toystore.apps.$CLUSTER_DOMAIN
```

Make sure the application is reachable (unprotected for now):

```sh
curl http://api.toystore.apps.$CLUSTER_DOMAIN/toy -i
# HTTP/1.1 200 OK
```

### Protect the application with Kuadrant

**1. Require API keys to authenticate to the application**

Let's keep things simple and protect the application with API keys.

Create API keys for users Bob and Alice:

```sh
kubectl -n toystore apply -f -<<EOF
---
apiVersion: v1
kind: Secret
metadata:
  annotations:
    secret.kuadrant.io/user-id: bob
  name: bob-key
  labels:
    authorino.kuadrant.io/managed-by: authorino
    app: toystore
stringData:
  api_key: IAMBOB
type: Opaque
---
apiVersion: v1
kind: Secret
metadata:
  annotations:
    secret.kuadrant.io/user-id: alice
  name: alice-key
  labels:
    authorino.kuadrant.io/managed-by: authorino
    app: toystore
stringData:
  api_key: IAMALICE
type: Opaque
EOF
```

Create a Kuadrant `AuthPolicy` custom resource to configure the authentication:

```sh
kubectl -n toystore apply -f - <<EOF
---
apiVersion: kuadrant.io/v1beta1
kind: AuthPolicy
metadata:
  name: toystore
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: HTTPRoute
    name: toystore
  rules:
  authScheme:
    identity:
    - name: friends
      apiKey:
        allNamespaces: true
        selector:
          matchLabels:
            app: toystore
      credentials:
        in: authorization_header
        keySelector: APIKEY
    response:
    - json:
        properties:
          - name: userID
            valueFrom:
              authJSON: auth.identity.metadata.annotations.secret\.kuadrant\.io/user-id
      name: rate-limit-apikey
      wrapper: envoyDynamicMetadata
      wrapperKey: ext_auth_data
EOF
```

Verify that the endpoint is now protected:

```sh
curl http://api.toystore.apps.$CLUSTER_DOMAIN/toy -i
# HTTP/1.1 401 Unauthorized
```

You should be able to access the application supplying either Alice's or Bob's API Key:

```sh
curl -H 'Authorization: APIKEY IAMBOB' http://api.toystore.apps.$CLUSTER_DOMAIN/toy -i
# HTTP/1.1 200 OK
```

**2. Rate limit the application** 

Let's rate limit per API key (also known as "authenticated rate limiting"):

| User | Limit |
| ------------- | ----- |
| `Bob` | **2** reqs / **10** secs (0.2 rps) |
| `Alice` | **5** reqs / **10** secs (0.5 rps) |

```sh
kubectl -n toystore apply -f -<<EOF
---
apiVersion: kuadrant.io/v1beta1
kind: RateLimitPolicy
metadata:
  name: toystore
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: HTTPRoute
    name: toystore
  rateLimits:
  - configurations:
      - actions:
          - metadata:
              descriptor_key: "userID"
              default_value: "no-user"
              metadata_key:
                key: "envoy.filters.http.ext_authz"
                path:
                  - segment:
                      key: "ext_auth_data"
                  - segment:
                      key: "userID"
    limits:
      - conditions:
          - "userID == bob"
        maxValue: 2
        seconds: 10
        variables: []
      - conditions:
          - "userID == alice"
        maxValue: 5
        seconds: 10
        variables: []
EOF
```

*Note that it may take up to a couple of minutes depending on your cluster to the RLP to be applied.*

Only 2 requests out of every 10 are allowed for Bob:

```sh
while :; do curl --write-out '%{http_code}' --silent --output /dev/null -H 'Authorization: APIKEY IAMBOB' -X GET http://api.toystore.apps.$CLUSTER_DOMAIN/toy | egrep --color "\b(429)\b|$"; sleep 1; done
```

Only 5 requests out of every 10 are allowed for Alice:

```sh
while :; do curl --write-out '%{http_code}' --silent --output /dev/null -H 'Authorization: APIKEY IAMALICE' -X GET http://api.toystore.apps.$CLUSTER_DOMAIN/toy | egrep --color "\b(429)\b|$"; sleep 1; done
```


### Thanks for giving Kuadrant a try! 
Be sure to share any feedback or issues you might encounter through [Github](https://github.com/orgs/Kuadrant) or [Slack](https://join.slack.com/t/kuadrant/shared_invite/zt-16ggrm41h-z1HLYGkRxJ6l_oZVU~eQzQ).
