#Voog Developer Toolkit

This Node version of the previous [Developer Toolkit](http://github.com/Voog/voog-kit) aims to be functionally identical, but more approachable to modern front-end developers. Powered by [kit-core](http://github.com/Voog/kit-core), the developer toolkit library.

## Prerequisites

At least Node 4.x and NPM 2.14.x.

## Installation

```bash
$ npm install -g voog-kit
```
This makes the voog-kit main script globally available. The script is named "voog", but also aliased to "kit".

Voog-kit works with configuration files, either in the current folder, in the home folder, or in an explicitly defined location. Without the file, there is no way to tell what site you're working on.

The global file's structure should minimally be as follows:
```json
{
  "sites": [{
    "host": "< your site's host >",
    "token": "< your personal API token >",
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

`Pull` downloads layouts and assets from your Voog site, saving them in their corresponding folders:
* layouts/ and components/ for markup files (saved with .tpl extension)
* images/ for image files (.jpg, .png etc.)
* javascripts/ for .js files
* stylesheets/ for .css files
* assets/ for everything else

### push

`Push` uploads the files to your site, overwriting the previous version. You can provide relative paths as specific files to push, e.g `kit push layouts/blog.tpl`, which pushes only the blog layout.

### add

`Add` creates a new file and uploads it to the site. For example, `kit add javascripts/main.js` creates an empty "main.js" file and pushes it to the site.

### remove

`Remove` deletes the file, locally and from the site as well. For example, `kit remove javascripts/main.js` deletes the "main.js" file and removes it from the site.

### watch

`Watch` starts a file monitor that watches the six folders for any changes: creating, modifying and deleting files also uploads or removes the changed files.

### sites

`Sites` lists all sites that are defined in the currently active configuration file.
