---
layout: layout.njk
title: Contributing Guide
eleventyNavigation:
  key: Contributing
  order: 3
  icon: bx-user-plus
---
# Contributors Guide

<!--- variables for repeated links --->
[SlackChannelURL]: https://kubernetes.slack.com/archives/C05J0D0V525
[MailingList]: mailto:kuadrant@googlegroups.com

Welcome to the Kuadrant contributors guide! We are delighted that you are interested in getting involved in our project 🎉

As you get started, you are in the best position to give us feedback on areas of our project that we need help with such as:

* Gaps or inaccuracies in our [getting started](https://docs.kuadrant.io/latest/getting-started-single-cluster/) guide or [documentation](https://docs.kuadrant.io/)
* Problems found while setting up your local development environment

If anything doesn't make sense, or doesn't work when you run it, please feel free to either open a Github issue against the relevant component repository or reach out to us on our public [Slack channel][SlackChannelURL] or via the Kuadrant [mailing list][MailingList].

## Ways to Contribute

We welcome many different types of contributions covering areas such as:

* New features
* Bug fixes
* Documentation updates
* Release management
* Discussions, feedback and/or guidance on [Slack][SlackChannelURL]/[Mailing List][MailingList]
* Get involved with [feature, RFCs and architecture proposals](https://github.com/Kuadrant/architecture/tree/main/rfcs)

### Community Calls

Each week we host a Kuadrant Community call which provides an open forum to discuss all things Kuadrant. Anyone is welcome to come along to this meeting to propose a topic, join in on discussions or just listen in to gain some context into what's going on in the project. For further details on how to join the call, see the Events and Meetings section on the website community [page](https://kuadrant.io/community/#events-and-meetings-calendar). 

Missed a meeting? Don't worry! All of our Community calls are recorded and available from our [YouTube channel](https://www.youtube.com/playlist?list=PL2UsztbUdPcffkAukDbPJBLppSG6JUa2Q).

## Find an Issue

A list of good first issues can be found from the Kuadrant Github [projects board](https://github.com/orgs/Kuadrant/projects/18/views/7). These issues are categorised per component.

### Assigning an Issue

If you're interested in working on an issue, start by leaving a comment to let others know — please don't assign yourself straight away. Once you've had a chance to confirm it's a good fit and you're ready to start, then mark yourself as an assignee and update the status to `In Progress`.

If an issue already has someone assigned, either let them run with it or drop a comment to see if they'd be open to pairing — but please don't assign yourself over someone who's already working on it. There are plenty of great issues to go around and we're sure you'll find something that's a great fit. If something looks like it may have been abandoned (no activity for a few weeks), drop us a message on [Slack][SlackChannelURL] and we can help figure out next steps.

On the rare occasion that there are no good first issues available, that's OK! There is likely still something for you to work on. If you want to contribute but you don't know where to start or can't find a suitable issue, you can reach out via the [Public Slack channel][SlackChannelURL] for suggestions and/or guidance.

### Participating in LFX Mentoring?

Welcome! If you've spotted a task listed as part of an LFX Mentoring proposal, please wait for the official programme channels to be set up before starting work. Mentees are selected through the formal process and notified through official channels — jumping in ahead of that, even with good intentions, can create confusion and duplicated effort. Once you're officially onboarded, your mentor will guide you on where to begin.

## Communication

We want Kuadrant to be a welcoming and sustainable place to contribute — for newcomers and maintainers alike. A few things that help keep things running smoothly:

**How reviews work**
Once you've opened a PR or posted a question, please give the team time to respond. Maintainers are often working across multiple projects alongside other responsibilities. The right place to follow up is in the GitHub issue or PR thread — a single comment after a week or so without a response is perfectly fine. Please avoid sending repeated messages or direct messages to individual maintainers asking for reviews; it puts pressure on volunteers and isn't the norm here.

**Keep discussions in the open**
We encourage keeping conversations in public channels — GitHub issues, PRs, and the [Slack channel][SlackChannelURL] — rather than in direct messages. This keeps things visible to the whole community, helps others with similar questions, and means you're more likely to get a timely response.

**Get in touch**
The best way to reach us with a question is to ask on:

* Our [Public Slack channel][SlackChannelURL]
* The Kuadrant [mailing list][MailingList]

## Using AI Tools

AI-assisted development is welcome and can be a great productivity boost. That said, please make sure any AI-generated code or content is something you've understood, tested, and verified actually solves the problem. Contributions that haven't been checked work the same as any other — if the tests don't pass or the issue isn't addressed, the PR won't be merged regardless of how it was written.

## Signing Commits

Licensing is important to open source projects. It provides some assurances that
the software will continue to be available based under the terms that the
author(s) desired. We require that contributors sign off on commits submitted to
our project's repositories. The [Developer Certificate of Origin
(DCO)](https://probot.github.io/apps/dco/) is a way to certify that you wrote and
have the right to contribute the code you are submitting to the project.

You sign-off by adding the following to your commit messages. Your sign-off must
match the git user and email associated with the commit.

    This is my commit message

    Signed-off-by: Your Name <your.name@example.com>

Git has a `-s` command line option to do this automatically:

    git commit -s -m 'This is my commit message'

If you forgot to do this and have not yet pushed your changes to the remote
repository, you can amend your commit with the sign-off by running 

    git commit --amend -s 

## Submitting Pull Requests

When submitting a pull request against one of the Kuadrant component repositories, should the PR address a particular Github issue please make sure to reference it in the PR description. That said, it is not mandatory for a PR to have an associated issue referenced. In the event of a standalone PR that doesn't have an associated issue, please add a detailed description of the changes included. Adding *What* and *Why* sections is a good start. For example, *What* is the purpose of this change and *Why* is it required and/or being implemented in this way?

If you used AI tools to help write your contribution, please review the [Using AI Tools](#using-ai-tools) section before submitting.

The Kuadrant project owners and maintainers strive to review and/or respond to all newly submitted PRs in a timely manner, however, if you're finding it difficult to get someone to review your PR, please post in our public [Slack channel][SlackChannelURL] or [mailing list][MailingList]

Finally, it is recommended that you squash your changes into a single commit where possible. If this is not feasible please ensure that your commits are representing a logical piece of work that can be reviewed independently within the PR.

## Reporting Issues

To report an issue in the Kuadrant project, you can create a Github issue in the relevant component repository e.g. [Limitador](https://github.com/Kuadrant/limitador), [Kuadrant Operator](https://github.com/Kuadrant/kuadrant-operator), [Authorino](https://github.com/Kuadrant/authorino) etc. If you are unsure of which component to log against, reach out via [Slack][SlackChannelURL] or [mail][MailingList]. The more information you can provide the easier it will be to help resolve the issue, so please don't be shy on details.

<!--- WIP
## Pull Request Lifecycle

[Instructions](https://contribute.cncf.io/maintainers/github/templates/required/contributing/#pull-request-lifecycle)

⚠️ **Explain your pull request process**

--->
