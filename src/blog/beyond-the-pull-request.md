---
title: "Beyond the Pull Request: What I Learned From My First Open Source Internship"
date: 2026-09-15
author: Krishna Kukadia
---

A reviewer pointed out that although my change recorded the response status, it did not actually solve the larger problem behind the issue. I thought I had fixed the bug. I hadn't.

That was my first Envoy [pull request](https://github.com/envoyproxy/envoy/pull/44157), back when I was just trying to figure out what working on a large open source project actually looked like. I had written plenty of code before, but mostly for classes and personal projects. [Envoy](https://github.com/envoyproxy/envoy) was different. I was working in a codebase I did not design, trying to understand behavior I did not write, and submitting changes to people who knew the project far better than I did.

The bug itself was in how the TCP proxy handled non-2xx responses to HTTP CONNECT requests. The response status was being consumed before Envoy recorded the transport failure reason, so useful information about why a tunnel was rejected was lost. I traced where the status disappeared and stored it before the response was reset. Then I added unit and integration tests. The code change was small, it was the review where I learned the most.

The reviewer was looking at the full behavior of the system. My fix recorded the response status, but that status still was not crossing the internal listener boundary back to the caller. I had been staring so hard at where the information got lost that I never stepped back and asked whether recording it was actually enough. We agreed to keep my change as a small improvement, and handle the deeper response propagation problem separately.

A contribution, as it turned out, was not just writing code and opening a pull request. It's about understanding the problem and finding the right place to change it, then testing what I have done. It meant explaining the fix under review, and sometimes discovering my understanding of the problem was wrong from the start. That experience made me want to spend more time contributing to open source.

### I Wanted to Go Deeper

That led me to the LFX Mentorship [program](https://mentorship.lfx.linuxfoundation.org), which ran from June to August with Kuadrant's [MCP Gateway](https://github.com/Kuadrant/mcp-gateway). My internship was not with Envoy directly, but my earlier Envoy work turned out to be directly relevant. I'm grateful to the Linux Foundation and the Cloud Native Computing Foundation for creating programs like LFX that give students the opportunity to get involved in real open source projects and take their first steps into the open source community.

MCP Gateway extends Envoy to work with the Model Context Protocol. MCP messages use JSON-RPC payloads, which a standard layer-7 proxy cannot easily use for routing or policy decisions. The existing architecture used an `ext_proc` filter to parse MCP traffic, pulling out things like the tool name and method, and making them available to Envoy as HTTP headers. That information could then drive routing, stateful sessions, and authorization through Kuadrant's [Authorino](https://github.com/Kuadrant/authorino).

Before touching the main project, I needed to understand how all of these pieces fit together. My first contribution was a small documentation change covering the development environment and Make targets, which was mostly an excuse to poke around the codebase without breaking anything. Soon after, the real question of the internship took shape: could some of the MCP parsing be moved into Envoy itself using its native MCP filter?

### The Answer Was "Almost"

My original brief was blunt: native Envoy MCP filter as a replacement for `ext_proc` parsing.

I spent a long time understanding the existing flow: what `ext_proc` and the native filter each provided, and where the boundaries between Envoy and MCP Gateway should sit. It was not as simple as swapping one component for another, and I wrote about that investigation for Kuadrant in [Replacing ext-proc with Envoy's Native MCP Filter (Almost)](https://kuadrant.io/blog/envoy-native-mcp-filter/). The "almost" mattered. Moving functionality into Envoy was possible in some places, but it did not mean every responsibility could just disappear from MCP Gateway. This was the first time I felt the difference between implementing something and making an architectural decision.

### Designing Before Implementing

Later, resource federation was added to the scope: letting MCP resources from multiple servers get exposed through a single gateway. That sounds simple until you ask what happens when two upstream servers both expose a resource at `/docs`. The gateway needed to know which server `/docs` actually belonged to. That meant rewriting resource URIs, validating prefixes, and making sure authorization still worked after the rewrite. And that's before you even get to ask what happens when one of the upstreams fails.

I started with a design [document](https://github.com/Kuadrant/mcp-gateway/pull/1261), and for the first time I wasn't just hunting for the right function to modify. A lot of that design got hashed out with my mentors: URI rewriting, resource prefixes, authorization handling, and how it should all fit the existing architecture. I would propose an approach, get feedback, change it, defend a decision when I had a reason, or realize I'd missed something entirely. The design review was part of the implementation, not something bolted on afterward.

### Coding Agent Couldn't Solve This One

Not every problem got solved by reading enough code. While implementing resource federation, I hit an end-to-end test that kept failing for reasons I could not figure out, and the coding agent could read the code faster than I could and suggest fixes, but it still couldn't tell me why the test was wrong. That wasn't the only place the coding agent's confidence outran its accuracy. It once wrote a test named `TestFetchResourcesFromServer_NilResult` that passed easily and tested absolutely nothing: the mock behind it had a fallthrough case that meant the guard it claimed to check never actually ran, and a human reviewer caught it, not the test.

None of these failures were exotic, which is what made them dangerous: the code was good enough that skipping the step where I actually understood it was easy to do. When I got stuck on the resource federation test, I brought it to my mentors (David Martin and Patryk Stefanski), and the useful part wasn't the answer, it was working through what the test was actually exercising and where the failure was really coming from. That context is what got me unstuck, not another generated diff. The resulting work included JWT authorization, resource URI rewriting and prefix validation, and end-to-end coverage against a real Kind-based environment, and it reshaped how I think about coding agents: they make exploration and implementation faster, but when a problem depends on project-specific context, someone who actually knows the system beats another generated fix.

### What Changed

Looking back at that first Envoy pull request next to the later MCP Gateway work, the biggest change wasn't that I got better at writing code. I got better at figuring out what code should be written, and that story about coding agents changed more than how I reviewed its code, it changed how I worked with it in the first place. I started building a workflow around the idea that agents should have to show their work, staying grounded in truth instead of assuming a function exists or a test covers something without checking, and treating "this should work" and "I traced this and it works" as two different claims.

AI is useful because it can accelerate understanding. It becomes a problem when it replaces understanding. Agents can generate a function, but that doesn't remove your responsibility to know where that function lives in the system and what assumptions surround it. At the beginning I was mostly asking *how do I make this work?* Later I was asking where a behavior should live, what happens if an upstream fails, whether something fits the existing architecture, and how it would affect the next person who touched it. My first instinct was usually to start changing code; the internship slowly taught me to resist that instinct and ask what I was actually solving first, and to get comfortable saying "I don't know yet" and investigating before asking for help.

### Beyond the Pull Request

The pull requests are the easiest part of the internship to point to. But what I'll actually remember is everything around them: an unfamiliar codebase, a bug traced through Envoy, a reviewer showing me I'd only solved part of the problem, architecture hashed out with my mentors, an E2E test I couldn't crack, a feature designed before a line of it existed.

None of that would have happened without my mentors, David and Patryk. I'm grateful for the time they spent reviewing my work, checking in, and pushing back when my assumptions didn't hold up. They taught me how to think about the problems behind the code, not just how to get a PR merged.

I used to think contributing meant finding an issue and writing code until something merged. Now I know the pull request is the least interesting part of it.
