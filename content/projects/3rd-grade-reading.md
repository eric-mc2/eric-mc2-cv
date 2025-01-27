---
title: "Texas School Reading Scores"
date: 2024-12-27T00:00:00-06:00
featured: true
pubtype: Viz
description: "Dashboard of student achievement and community indicators."
tags: ["data science", "data visualization", "storytelling", "dashboard", "Observable Framework", "javascript"]
image: ""
link: "https://github.com/eric-mc2/reading-scores-demo"
weight: 500
sitemap:
  priority : 0.8
---

View app on [Observable Cloud](https://reading-scores-demo.observablehq.cloud/3rd-grade-reading-scores/)

This was an interview take-home project. The prompt was "Make a dashboard for a 
school district leader, comparing standardized test scores 
(3rd grade reading level meets grade level) to household income and poverty
at the zip code level. Don't do statistical analysis." Links were provided to
school-level test scores, school locations, and zip-level Census ACS data.

# Features

* Search by zip or school district name.
* Find similar communities based on economic factors (k nearest neighbors).
* Highlight community of interest's rank (state-wide and compared to similar communities).
* Designed to compare test scores and economic factors without implying causality.

# Demo

![Demo](/img/staar-demo.gif)

