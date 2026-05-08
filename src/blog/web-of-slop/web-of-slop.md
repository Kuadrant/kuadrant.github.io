---
title: "The Web of Slop: AI-Driven Astroturfing in Open Source"
date: 2026-05-08
author: David Martin
---

There's plenty of coverage about AI slop hitting open source: low-quality pull requests, junk issues, the maintenance burden they create. Jeff Geerling has [written about it](https://www.jeffgeerling.com/blog/2026/ai-is-destroying-open-source/). The curl project shut down its bug bounty over it. GitHub is [shipping features](https://www.theregister.com/2026/02/03/github_kill_switch_pull_requests_ai/) to help maintainers deal with it. The term ["AI Slopageddon"](https://www.kunalganglani.com/blog/ai-slopageddon-open-source-crisis/) captures the volume problem well.

What I've been seeing is a bit different, and I haven't seen it named yet.

## The pattern

I'm a maintainer on the [MCP Gateway](https://github.com/kuadrant/mcp-gateway) project, an Envoy-based gateway for MCP servers. We had an [open issue](https://github.com/Kuadrant/mcp-gateway/issues/710) for auditing MCP tool calls via Envoy access logs. Two comments appeared within a few days of each other, both from accounts with no history in the project.

{% image "./mcp-gateway-comment-1.png", "First comment on the MCP Gateway auditing issue" %}

{% image "./mcp-gateway-comment-2.png", "Second comment on the MCP Gateway auditing issue" %}

Same structure both times: acknowledge the approach in one sentence, identify a "gap", pitch their project as the complement, close with a tidy summary. Neither account had any prior interaction with MCP Gateway.

On their own, these could pass as genuine community input. What gave them away was the template: validate, gap, pitch, summary. Two different accounts, two different projects, same playbook.

I checked where else these accounts comment. One promotes its project across issues in crewAI, autogen, openai-agents-python, agentops, and MCP Gateway. The other does the same across agent governance repositories. Both created their promoted projects in early 2026. Both carpet-bomb relevant issues across high-visibility repos.

## A more sophisticated version

The same pattern shows up in a more elaborate form on [kube-agentic-networking](https://github.com/kubernetes-sigs/kube-agentic-networking), a Kubernetes SIG project I'm involved with. An account opened a [detailed proposal issue](https://github.com/kubernetes-sigs/kube-agentic-networking/issues/243) for receipt-based admission control, complete with schema definitions, IETF draft references, and info on four implementations!

{% image "./kan-issue-opener.png", "Proposal issue on kube-agentic-networking" %}

The IETF draft was authored by the same person who opened the issue. Three of the four "independent implementations" are by that same person, published under two different company names. The fourth is by the second account that later showed up to validate the proposal. Anyone can submit an individual Internet-Draft to the IETF datatracker with no peer review or endorsement, but dropping "IETF draft" in a GitHub issue implies a level of credibility that isn't there.

Within hours, the second account appeared to validate and extend the proposal, agreed on the approach, offered to co-author a reference implementation, and dropped links to their own product's API endpoints.

{% image "./kan-comment-exchange.png", "Choreographed exchange on kube-agentic-networking" %}

The original author responded enthusiastically, accepting every suggestion and proposing they collaborate. It reads like two independent experts converging on a shared design, exactly the kind of organic technical discourse you'd want on a SIG issue.

But the proposal author's GitHub account was created mid-2025 and already has over a hundred followers and dozens of repositories. The validating commenter promotes their own governance platform across multiple repos, including their own. Both accounts appear across the same constellation of AI governance repositories, commenting on each other's projects, filing issues that reference each other's work, building a web of cross-references that looks like community adoption.

This is what makes the pattern effective. The discussion looks legitimate enough that it's reasonable to engage with it. That's the whole point: create something that passes the smell test so the promoted projects gain credibility by association with a real community.

## The web of slop

This isn't new. SEO comment spam, blog spam, and astroturfing on forums have existed for decades. What's different now is that the comments are contextually accurate (they reference specific technical details from the issue, use the right terminology, propose plausible integration points), and the accounts look real (followers, repos, activity histories that used to require human effort to build).

Most importantly, the cross-referencing creates artificial consensus. Multiple accounts across multiple repositories all pointing to the same projects, agreeing with each other's proposals. It manufactures the appearance of community demand. A maintainer seeing "oh, multiple people have independently suggested this" is seeing a mirage.

Others have named parts of this. "AI slop" covers the content quality problem. ["Dead GitHub Theory"](https://news.ycombinator.com/item?id=46682139) describes the authenticity crisis. The ["fake star economy"](https://www.startuphub.ai/ai-news/cybersecurity/2026/github-fake-stars-reputation-as-a-service/) covers manufactured popularity signals. What I haven't seen named is the network structure: accounts that cross-reference, validate, and promote each other to manufacture credibility at scale. I'm calling it the **web of slop**.

## What we're doing about it

In the [Kuadrant](https://kuadrant.io) project, a few practical things:

- **Check the account.** When someone with no prior engagement pitches a project in a comment, check where else they comment. If they're running the same pitch across dozens of repos, minimise it as spam.
- **Don't engage.** Replying, even to say "thanks but no thanks", validates the approach and makes the links more visible to search indexing. Minimise and move on.
- **Share examples.** Once you've seen the template, you spot it quickly. The best defence is the team recognising the pattern.
