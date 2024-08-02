const { DateTime } = require("luxon");
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

  eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
		// Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
		return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(format || "dd LLLL yyyy");
	});

  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
		// dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
		return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
	});

  return {
    dir: {
      input: "src",
      output: "_site"
    }
  }
};
