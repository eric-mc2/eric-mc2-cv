# eric-mc2-cv

Code and content for public static site

Organization:
While this site is in development, it will be organized as one folder
per hugo theme, per site. Duplication of data and assets are necessary
since theme structures are not standardized. In this case I prefer folder duplication
as opposed to git branches so as to preview and edit two themes simultaneously.

```
/
    theme-x/
        top-level-configs
        content/
        public/ (points to deployment repo)
        themes/
            x/ (cloned from gohugo/x)
    theme-y/...
    theme-z/...
```

Instructions:

1. Create new theme:
    1. Create new theme folder and site with `hugo new site theme-z`
    2. Fork a theme and add it as a submodule to theme-z/themes
    3. Add eric-mc2.github.io as a submodule to theme-z/public
2. make edits in theme-z
3. Run `hugo server --noHTTPCache --disableFastRender` to preview
4. Commit changes to this repo and to the forked theme
5. Run `hugo -t <theme-name>` to build the site.
6. cd to public/ and push to remote (eric-mc2.github.io) to deploy
