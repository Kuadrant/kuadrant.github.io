const markdownIt = require("markdown-it");
const eleventyAsciidoc = require("eleventy-plugin-asciidoc");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");


module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("static");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPlugin(eleventyAsciidoc);


  let options = {
    html: true,
    breaks: true,
    linkify: true
  };

  eleventyConfig.setLibrary("md", markdownIt(options));
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
};
