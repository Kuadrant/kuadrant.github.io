# [kudarant.io](https://kuadrant.github.io) Website

## Development

### Requirements

 - [Hugo extended version](https://github.com/gohugoio/hugo/releases) - v0.101 at the time of this writting
 - [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)


### Dependencies
 
 - Make sure these 3 npm packages are installed: `postcss` `postcss-cli` & `autoprefixer`

    Using `npm install`

### Starting local dev

 `~/bin/hugo server`

#### If you're changing some of the scss stuff

 `~/bin/hugo server --disableFastRender`


## How this works

 - All the docs are git submodules in `/externals`, with the doc part symlinked from `/content/en/docs/` to their respective location
 - The navigation and other tweaks from the default [docsy theme](https://www.docsy.dev/docs/) are achieved with maintaining data structures in `/data`
 - `/layouts` has our customizations
 