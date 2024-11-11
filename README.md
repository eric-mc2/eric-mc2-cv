# eric-mc2-cv

Code and content for public static site

Organization:
```
repo-root/
    archetypes/ (templates for pre-populating .md files with `hugo new`)
    content/ (markdown files for site)
    data/ (json for site)
    i18n/ (internationalization. not really using this. will delete)
    layouts/ (html for rendering .md)
        */
            single.html (main content page per .md in content)
            *Summary.html (list item preivew of a single .md content)
    public/ (hugo site builds to here. points to deployment repo. push to deploy)
    static/ (media files to deploy)
    hugo.toml (global config)
```

Dev Instructions:

1. Edit content and styling here.
2. Run `hugo server --noHTTPCache --disableFastRender` to preview.
3. Run `hugo -t <theme-name>` to build the site.
4. cd to public/, commit, push to remote (eric-mc2.github.io) to deploy.
5. cd to repo-root/, commit, push to remote (eric-mc2-cv) to save changes.
