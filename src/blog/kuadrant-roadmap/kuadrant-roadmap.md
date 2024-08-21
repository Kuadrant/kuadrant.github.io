---
title: Introducing the Kuadrant Roadmap and Process
date: 2024-08-20
author: Craig Brookes, David Martin
---

**Disclaimer:** This is not intended to be a perfect system but just an evolution and iteration. It can and should be improved over time.

The [Kuadrant Backlog](https://github.com/orgs/Kuadrant/projects/18/views/22) gives us a sorted view of all backlog items across the different repositories, areas, and features. These terms are explained in detail below.
Here's an example of what the backlog looks like: 

{% image "./backlog.png", "Kuadrant backlog view in github" %}

For releases, like the [Kuadrant v1 milestone release](https://github.com/orgs/Kuadrant/projects/18/views/23), a board view, grouped by area is available.
Here's what that looks like:

{% image "./release.png", "Kuadrant release view in github" %}

## Key Concepts

### Areas

An area is broad by design and can contain many features. Areas are a defined set and should remain as small as possible. The idea is to make things more consumable from a community/external perspective.
e.g. I am interested in rate limiting. I see rate limiting as an area and within that area I see multiple logically grouped pieces of work.

This can be visualised in github using a [filter of the backlog project view](https://github.com/orgs/Kuadrant/projects/18/views/22?sliceBy%5Bvalue%5D=Rate+Limiting).

*What if something could go into more than one area?*

    Don’t overthink it. Choose an area and put it there. It can be changed later if need be. We don’t have 3 dimensional boards yet 😀

*Why are there features that are also areas?*

    Observability is a good example of this. The DNS area needs observability features. Observability is a feature of most components and areas. Observability is also something that we are “generally delivering to persona use cases” and so there are some things that fit better into an area to be focused on independently (API focused observability, Alert and dashboard templates etc that may be fed from the observability features in the other areas).

### Features

A feature is a tightly coupled set of issues that deliver a certain “thing” for the project and at some point will be considered “done”. Feature may be a contentious term, but I didn’t have a better term at this point. Technically there can be a large number of features. The feature option is just a string.
Here's an example of a feature [filtered view of the backlog for Azure Support](https://github.com/orgs/Kuadrant/projects/18/views/22?sliceBy%5BcolumnId%5D=73323580&sliceBy%5Bvalue%5D=Azure+Support).

*Where does this leave Epics?*

    Still valuable ….

### Iterations

An iteration in GitHub is the name given to identify a period of time. It is a useful tool for understanding what is happening within a given period of time and also what we have committed to and planned and will ideally make it in the next iteration (or release) of the project.
Why use an iteration?

* Allows a shared timebox for the next iteration of the project. Everyone is working with the same iteration to the same date and knows there will be a release at the end of the iteration.
* Improves visibility into what is happening within a given time frame
* Breaks down a large period of time (months until November) into smaller easier chunks that us humans can get our heads around.
* We work in 3-week interactions. This gives us a total of 5 iterations between now and KubeCon NA 2024

### Estimates

* Estimates are exactly that. No one will come chasing you if you get an estimate wrong.
* Estimates will help us gauge how much we can complete in a given iteration and also in a given large period of time. 
* Suggested Estimate Values to keep things simple:
  * 5:  1-2 days effort
  * 8:  3-5 days effort
  * 13: anything from 5 days to 2 weeks effort
* If an issue is larger than a 13 and can’t be completed within an iteration, then really it should be looked at closely to see if it can be broken down further. A 13 point issue should also probably be looked carefully to see can it be broken down further

### Releases

While we release an increment with the end of each iteration. The release field is more of a milestone release. e.g v1. This release version should be added to any work that is a “must do” for v1. 

## Using The Views

### Adding New Stuff

#### Areas

If a new area is discovered, it can be discussed on Slack or community call as to why it is big enough for a new area all of its own. That said it won't be a heavy-weight process to add a new area.

#### Features

The expectation is that these will naturally occur as work is planned and outlined. It is just a string so there is no real limitation on it.

#### Adding New Issues

It's important that the right area, feature and version is assigned. This is just a suggestion. If you are adding a new issue, it can be helpful to go to the feature option on the view and then click the “add new issue” at the bottom of the list as this will auto fill the feature and area.

### An Iteration

An iteration is 3 weeks long. It can be broken down into a weekly cycle like below.
The goal at the end of each iteration is to do a release of the project.

| Week 1                          | Week 2                          | Week 3                          |
|---------------------------------|---------------------------------|---------------------------------|
| Refine/ Prioritise / Estimate   | Refine/ Prioritise / Estimate   | Refine/ Prioritise / Release    |

### Prioritisation

The backlog view allows you to drag items up and down the list. I find it useful to add ```area:DNS,TLS``` so the areas are limited down to those I want to focus on.

*How do I decide what should be prioritised?*

    If unsure, ask. Generally use common sense. Is this an item that is in the scope of v1?

### Refinement

Refinement calls should focus on refining the understanding on an issue and focus on its definition so that at the end of the discussion you can set its status to TODO as this means it is ready to be worked on. 
So when doing a refinement in a particular area you can use the following query:
 ```area:DNS,TLS no:status``` It will keep the order and grouping but filter down to specific areas. Some teams find it useful at this stage to also estimate the issue. Some do the estimate during the planning stage

### Workflow

We don’t plan for an iteration. Instead the continuous refinement and prioritisation will ensure the most important items are at the top of the backlog. When you take on a piece of work, you take it from the top (or as close as possible to the top depending on feature)
