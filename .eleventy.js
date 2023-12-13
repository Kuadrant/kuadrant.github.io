const markdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const string = require('string')
const slugify = s => string(s).slugify().toString()
const eleventyAsciidoc = require("eleventy-plugin-asciidoc");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");


module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("static");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPlugin(eleventyAsciidoc);

  eleventyConfig.addPassthroughCopy("src/.well-known");

  let markdownItOptions = {
    html: true,
    breaks: true,
    linkify: true
  };

  eleventyConfig.setLibrary(
    'md',
    markdownIt(markdownItOptions).use(markdownItAnchor, {
      slugify: s => slugify(s),
      permalink: markdownItAnchor.permalink.headerLink()
    })
  );
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  return {
    dir: {
      input: "src",
      output: "_site"
    }
  }
};
