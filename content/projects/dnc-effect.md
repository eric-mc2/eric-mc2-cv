---
title: "Do Democrats Really Support Public Transit?"
date: 2024-11-19T10:47:51-06:00
featured: true
description: "A half-serious econometric model"
tags: ["data science", "econometrics", "panel data"]
image: ""
pubtype: "Model"
link: "https://github.com/eric-mc2/DNCTransit"
weight: 500
sitemap:
  priority : 0.8
---

A few weeks ago I fumbled an interview question on statistical modeling. That
hurt my pride, so I decided to take on a little modeling project. 

Economists don't usually get to run their own controlled experiments, but they seem to
keep their ears perked for cases when a policy is implemented with *some* 
randomness. That's what I'm doing here. 

> *I exploit the exogeneous shock of the 2024 Democratic National Convention in Chicago, (ie. the addition of tens of thousands of politically active Democrats) to test whether a statistically significant change in public transit is observed.*

Supposing this setup is statistically valid (FOOTNOTE), I expect public transit
ridership to *increase* due to the DNC. This is because the Democratic coalition
generally lives in urban areas, supports "green" policy, government spending, etc.

I don't really have a stake in whether Democrats in general use transit or not,
but I like this setup for a few reasons:

- if *NO* effect is found, that is also interesting
    - it suggests a gap between talk and action in the Democratic leadership
    - (usually null results are boring)
- the premise is kinda click-baity
- if the setup is not statistically valid, I can practice demonstrating that too
    - (poorly tested statistics can have lasting effects on society)
    
# The data

I have a panel dataset of transit ridership among train (CTA), bus (CTA), rideshare (uber, lyft, etc),
and bikeshare (Divvy). The data is aggregated to daily ridership totals and spatially 
aggregated three different ways:

- Per Station: train, bike
- Per Route: train, bus
- Per Census Tract: train, bike, uber

See my [Transit Panel](./transit-panel.md) post for how this dataset was constructed.

## Points of Interest

I use the City of Chicago buildings shapefile to find the footprint of the 
United Center and McCormick Place, the two official sites of the DNC. Proximity
to these locations will be one of the main exploratory variables in the model.

<!-- TODO: What about the security perimeter?-->
I compute a buffer around each building and find all intersecting transit stations, routes, and tracts. 
For robustness, I computed 400m, 800m, and 1600m buffers. To pick which catchement size to use, I was forced to choose
one mile buffer, because the smaller sizes had too few intersecting stations and routes.

![Transit serving catchement](/img/panel_sample.jpeg "Bus ridership is not known per stop.")

To test the sensitivity of this specification, I modeled:

$$\text{rides}_i \sim \text{within 400m}_i + \text{within 800m}_i + \text{within 1600m}_i$$

I found that the effect was not monotonic as the buffer size increased. (Note that
this equation specifies the marginal contribution of increasing the buffer size).
In other words, the results will be very sensitive to the choice of buffer size.

# Why you shouldn't trust this

**Power**

- a few thousand riders is a drop in the bucket compared to normal trends

**Selection Bias**

- the convention centers were explicitly chosen for their ability to accomodate visitors via transit
    - i don't think this is bad because we dont really need external validity. we don't actually
    expect other sites in Chicago to have a similar response.
    

**Spillover into control**

- DNC visitors might stay in chicago longer than the official convention dates, 
    which would attenuate any effect
    - we can mitigate this by using placebo dates or by an event study design
- DNC visitors may visit other parts of the city, attenuating the effect
    - we can mitigate this by maybe searching for spikes in other areas 
    (but introduces a multiple testing issue)

**Spillover into treatment**

- drawing buffers around the event centers weakens our identification strategy 
    (marginally nearby transit might be spuriously related to the DNC itself)

**Confounding Variables**

- the security perimeter around the event centers may actually suppress ridership
    - we can mitigate this by drawing larger buffers, but this weakens our identification strategy 
    (transit outside the perimeter might be spuriously correlated)