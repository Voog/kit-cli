#Voog Developer Toolkit

This Node version of the previous [Developer Toolkit](http://github.com/Voog/voog-kit) aims to be functionally identical, but more approachable to modern front-end developers. Powered by [kit-core](http://github.com/Voog/kit-core), the developer toolkit library.

## Prerequisites

At least Node 4.x and NPM 2.14.x.

## Installation

```bash
$ npm install -g voog-kit
```
This makes the voog-kit main script globally available. The script is currently named "kit2".

Instead of local `.voog` files, there should be one global JSON-formatted `.voog` file that holds all the information about your projects. This is possibly also used by other Voog developer tools in the future.

The global file's structure should minimally be as follows:
```json
{
  "projects": [{
    "host": "< your site hostname here >",
    "token": "< your token here >",
    "path": "< full path to the project's working directory >",
    "name": "< a short name for the site here (optional)"
  }, {
    ...
  }, ...]
}
```

## Usage

The main commands to use voog-kit are `pull`, `push` and `watch`. These commands can only be used in folders that are defined in the global `.voog` file as a project's `path`.

## Commands

### pull

`Pull` downloads layout files from your Voog site, saving them in their corresponding folders:
* layouts/ and components/ for markup files (saved with .tpl extension)
* images/ for image files (.jpg, .png etc.)
* javascripts/ for .js files
* stylesheets/ for .css files
* assets/ for everything else

### push

`Push` uploads the files to your site, overwriting the previous version. You can provide relative paths as specific files to push, e.g `push layouts/blog.tpl`, which pushes only that file.

### watch

`Watch` starts a file monitor that watches the six folders for any changes: creating, modifying and deleting files also uploads or removes the changed files.

