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
Make sure the folder name is the same as the markdown file name so that the url allows relative image links to work. For example, if the folder is `src/blog/mypost/` and the markdown file is `mypost.md`, then the url will be `/blog/mypost/`. If they are different, like `src/blog/mypost/MyPost.md`, the url will be `/blog/mypost/MyPost/` and relative image links will give a 404.

To insert an image, use the image helper function:

```njk
{% image "./myimage.png", "My image" %}
```

Images will sized automatically for the site, but also include a link to the original size.
This can be helpful if sufficient detail is not visible in a shrunk down image.

The post list template is at `src/_includes/postslist.njk`.
The post page template is at `src/_includes/layouts/post.njk`.
