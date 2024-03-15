# eric-mc2-cv

Code and content for public static site

Organization:
I haven't figured out how to re-use content across hugo themes
because they all require different directory structures and key-value mappings.
So we'll do one sub-folder per site, one theme per site. Running `hugo -t` will
build the site into the public folder, which we can commit to the deployment repo
when we're ready to update.
```
/
    theme-x/
        top-level-configs
        content/
        themes/
            x/ (cloned from gohugo/x)
    theme-y/...
    theme-z/...
    public/ (points to deployment repo)
```
