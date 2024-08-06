# Kuadrant.io

## Installation

You will need:

* Node.js 
* NPM
* NPX
  * npm install -g npx

# Building
`npx @11ty/eleventy`

# Serving
`npx @11ty/eleventy --serve`

# Publishing
Published via GH action, see `.github/workflows/eleventy_build.yml`

# Blog

Blog posts are stored as markdown files in `src/blog/`.
The name of the file doesn't matter.
Metadata is included at the top of the file like this:

```markdown
---
title: My blog post
date: 2024-08-02
author: Me
---
```

This will ensure the blog post title shows up in the post list, grouped by year and sorted by date.
The title, author and date will also render in a styled manner at the top of the post page.

If you want to include images, you can create a folder in the `src/blog/` folder, and put the markdown file there, along with any images.
Then you can insert an image like this:

```njk
{% image "./myimage.png", "My image" %}
```

The post list template is at `src/_includes/postslist.njk`.
The post page template is at `src/_includes/layouts/post.njk`.
