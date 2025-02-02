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
math: true
plotly: true
sitemap:
  priority : 0.8
---

A few weeks ago I fumbled an interview question on statistical modeling. That
hurt my pride, so I decided to take on a little modeling project. 

With all the local [hubbub](https://www.chicagotribune.com/2024/08/13/cta-democratic-national-convention-crowds/) around the DNC security perimeter, I remember mostly staying home to avoid getting snarled in traffic.
This got me wondering how the rest of the city responded to the convention. How
did the visiting delegates fare? Did they use public transit? (Chicago
was picked to highlight its [transportation and infrastructure](https://democrats.org/news/dnc-announces-chicago-to-host-2024-democratic-national-convention/)
after all.)

> **Does the exogeneous shock of the 2024 Democratic National Convention in Chicago induce significant impacts on public transit usage?**

On face value I expect public transit
ridership to *increase* due to the DNC. This is because the Democratic coalition
generally lives in urban areas, supports "green" policy, government spending, etc.

*Disclaimer*: I don't really have a stake in whether Democrats in general use transit or not,
but I like this setup for a few reasons:

- if *AN* effect is found, that is interesting
    - (statistics are designed to be cautious about stating effects)
- if *NO* effect is found, that is also interesting
    - (it suggests the economic impact was smaller than reported, or that delegates took Ubers!)
- if the whole setup is not statistically valid, I can practice critiquing my own bad statistics
    - (poorly tested statistics can have lasting effects on society!)
    
# At First Glance

Can we even test this? Is the DNC a big enough event compared to normal commuting patterns?

The [official DNC impact report](https://cdn.choosechicago.com/uploads/2024/10/TE-DNC-Impact.pdf) 
says 50,000 delegates visited and spent $58.7M outside of the convention within Chicago.
The **city-wide** average daily CTA ridership is 790,000 +/- 140,000 so it would be hard to
detect these extra rides against the normal rhythm of the city.

But we know convention event is localised to the United Center and McCormick place.
When we only look at CTA **routes** *that pass through these areas*, the average
daily ridership is 325,000 +/- 52,000. This breaks down to 136,000 bus and 189,000 train rides.
So the anticipated impact is getting more noticeable.

Selecting only nearby train **stations** (ridership data is not available per bus **stop**), 
average daily boardings are 11,000. Any fraction of those 50,000 delegates ought to
make a huge spike in this context.

What are the delegates' other travel options? Walking, driving, Metra, biking, and rideshares.
Data is available for the latter: there are 6,000 and 33,000 average daily **bike** and **rideshare**
trips in *areas* near the United Center and McCormick place.

With these totals in mind, I'd expect the DNC delegation to significantly increase
ridership nearby the convention centers, no matter what transit mode they choose.

{{< plotly json="/json/avg-daily-rides.json" height="500px" >}}

# The data

The [City of Chicago](https://data.cityofchicago.org/) provides daily ridership
totals for train (CTA), bus (CTA), rideshare (uber, lyft, etc), and bikeshare (Divvy). 
The original data is published at varying spatial aggregations:

- Train: per station
- Bike: per station
- Bus: per route
- Rideshares: per tract / community area

I unified these sources into a [panel dataset](../transit-panel/index.html),
keeping the nominal spatial unit of each transit mode[^1]. Unfortunately I cannot
include busses in this analysis because the data is not granular enough to identify
rides near the convention centers.

## Treatment Zone

The next step is to label transit rides as *near* or *not near* the convention centers.

**Convention Centers**

I use the City of Chicago buildings shapefile to find the footprint of the 
United Center and McCormick Place, the two official sites of the DNC. Proximity
to these locations will constitute the "treatment" group in the model.

<!-- TODO: What about the security perimeter?-->
I compute a buffer around each building and find all intersecting transit stations, routes, and tracts. 
For robustness, I tested 400m, 800m, and 1600m buffers. To pick which catchement size to use, I was forced to choose
one mile buffer, because the smaller sizes had too few stations and routes nearby.

![Bus ridership is not known per stop.](/img/panel_sample.jpeg "Transit serving convention areas.")

To test the sensitivity of the buffer, I modeled:

$$\text{rides}_i \sim \text{within 400m}_i + \text{within 800m}_i + \text{within 1600m}_i$$

Average rides per spatial unit varied irregularly as the buffer size increased,
meaning results are very sensitive to the buffer size.

**Using Community Areas vs Tracts**

I chose to use tract-level data for rideshares. Here's my reasoning. Tracts mean:

* ✅ a larger sample size (more units of observation)
* ⛔️ more noise (smaller units => more variation across units/time)
* ✅ less bias (smaller units => 50% less spatial non-compliance on edge of buffer)
* ⛔️ fewer rides (smaller units => 23% more privacy redactions)

Overall the attenuation bias seemed like the most important consideration[^2].

![Intersected community areas](/img/comms_sample.jpeg "Intersected community areas")

## Time-like Features

**Conference Dates**

The DNC itself occurs between August 19-22. This constitutes the "treatment period"
in the model[^3][^4].

**Day of the Week**

Commuting patterns have strong weekday/weekend polarity. CTA ridership is drastically
higher on weekdays, while on weekends Uber ridership is higher. 

{{< plotly json="/json/scaled-ts.json" height="500px" >}}

Due to the restricted time frame of the DNC, I *drop observations from Friday - Sunday*.
(Ridership on these days doesn't convey any information about the "treatment"
because the DNC only occurs on Monday - Thursday.)

## Other Spatial Features

**Transit Density**

I coded the distance from the tract centroid to the *nearest* train, bus, and bike stop.
These distances will help control for varying transit density, commercial density, and
transit mode preferences.

$$
\sim \beta_1 d(\text{unit}_i, \text{train}) + \beta_2 d(\text{unit}_i, \text{bus}) + \beta_3 d(\text{unit}_i, \text{bike})
$$

**Location**

I include the stop/tract centroid longitude and latitude as a quadratic
term in the model to help control for basic city-wide spatial variation:

$$
\sim \beta_1\text{lon} + \beta_2\text{lat} + \beta_3\text{lon}*\text{lat} + \beta_4\text{lon}^2 + \beta_5\text{lat}^2
$$

(For numeric stability, I scale lon/lat to zero-mean unit variance.)

<!-- ## Spatial Aggregation

**Train Stops -> Lines**

Unfortunately, the CTA does not publish the number of *exits* per station, so
I cannot directly count the number of *arrivals* to the DNC by train. 

I considered aggregating station *boardings* along each *line*, but decided against
it for the same reason I am excluding bus data.

**Stops -> Tracts:**

This is straightforward. Stops cannot belong to more than one tract.

(You might argue that stops should be represented as cirles, not points, because
people walk to them. Therefore we should attribute rides to tracts within those circles.
To keep things simple I will not go to this level of detail.) -->

<!-- For the line-level panel, aggregating station-level ridership to lines introduces
two sources of uncertainty. First, the data does not indicate the actual line 
boarded at hub stations serving multiple lines. To approximate this choice, 
I simply divide each station total by the number of lines served by the station.
Second, the data does not indicate riders' exit stations, direction of travel,
or length of trip. If it did, I could model density along each route, but without this data I am 
forced to assume equal ridership along the route.  -->

<!-- **Lines vs Point of Interest** -->

<!-- I code a *binary* variable indicating if train lines, bus routes, or tracts
*intersect* a point of interest (convention
centers or airports). This lends to the simplistic interpretation that the line
*"serves"* the point of interest. -->

<!-- Obviously this leaves a lot of uncertainty unaddressed. How far does the line
travel away from the point of interest? What proportion of the line is somewhat
"close" to the point of interest? How is ridership distributed along the line?
With out a better model of rider destinations (ideally a source-destination matrix),
I can't really address this with more accuracy. -->

# The Sample

**Temporal Aggregation**

I keep observations at the *daily* level. Aggregating to weekly would pull non-DNC
dates into the treatment period, attenuating the treatment effect.

**Time Frame**

I use data from the *summer* months, June, July, and August. Restricting the data
to this set makes sense for two reasons. First, I avoid needing to incorporate
more complex modeling of seasonality. Second, transit is on a steady rebound 
reaching 65% of pre-pandemic levels. Though I do model a linear *time* covariate,
the rebound suggests that disaggregated transit usage is in flux as commuter preferences
and capacity continue to adjust. Therefore, previous summers are not a good baseline. 

**Boardings vs Trips**

CTA train and bus data only provides the locations where riders *board* transit,
not where they *exit*. Bike and rideshare data provides per-trip *board and exit*
locations. For strict parity, I ought to drop *exit* data, but I won't.
Keeping it gives a fuller picture of transit usage[^5][^6].

## Pre-Regression Checks

<!-- Here is a completness chart showing which days/units are missing data. Some
community areas are regularly missing bike or uber data. Uber data would be missing due to anonymization.
Without knowing the details of the anonymization rules, we can generally say
there are triggered when fewer rides happen. For now I will drop both such data
points. (As a robustness check, I'll run the model with these imputed as zero.)  -->

<!-- ![Missing Data](/img/missingness.jpg#scaledown) -->

**Statistical Power**

<!-- TODO: should i motivate this using Mansky bounds? -->
<!-- /Users/eric/Documents/School/UChicago/UChicago Spring 2021/Program Eval/slides/PPHA_34600_01_2021.pdf -->

Before running the regression, I want to do a *slightly* more rigorous version
of the time series [gut check](#at-first-glance). Looking at the distribution of
daily ridership let's ask: what is the minimum number of additional rides to 
significantly change the mean? First I compute the sample variance and standard error[^7], SE,
to get the minimum detectable effect size:

$$ \text{MDE} = (z(1-\alpha / 2) + z(\beta)) * SE $$

Multiplying the MDE by the number of (treated) observations yields the minimum detectable total "shock"
to the system. 

{{< import-md-table file="static/uploads/mde.md" >}}

Let's interpret the first row of this table: 

* a bike rack near the DNC will serve an average of 50 rides per day
* ridership would need to increase by 151% to be statistically significant
* this translates to 954 extra rides over the course of the DNC
* *note*: column 1 cannot simply be multiplied by column 2 to produce column 3 (because I log-transform ridership for the model)

Corraborating the first [time series plot](#at-first-glance), if a decent fraction of
delegates take transit, this regression design should be able to detect an effect.

**Selection Balance**

Here is a balance table for the three separate transit modes:

{{< import-md-table file="static/uploads/balance.md" >}}

The imbalance in ridership, transit service density, and unit size corroborate 
the selection effect at play: the convention sites were chosen for their
ability to accomodate lots of visitors (duh). These sites are *unlike* the rest of Chicago. 
Luckily with the diff-in-diff framework, the convention sites partially control for themselves.
Is that enough to believe in this model? I'll come back to this question later.

# Regression

This post is already long. I'll present the formal regression model and results
in the [next post](../dnc-effect-results/index.html).

# Footnotes

[^1]: Given this approach I will not be able to compare effect sizes *between* transit modes.
Not until they are at least at the same aggregation.

[^2]: Even at the tract level, 50% of "nearby" tract land area is outside the buffer. 
As a robustness check, I should vary the spatial intersection threshold from 0% to 100% and test
the sensitivity of the results.

[^3]: For a robustness check I should add a 1 or 2 day buffer (travel/tourism days). 

[^4]: See [placebo test](../dnc-attendance/index.html#placebo-test).

[^5]: Note this mechanically doubles the ridership levels of bike/rideshare vs train.
I account for this by running separate models per transit mode, and by reporting percentage
changes instead of level changes.

[^6]: If delegates prefer to commute to the DNC via train and commute back via Uber, 
I'd only observe the return trips. This complicates comparisons between transit modes.

[^7]: This was more complicated than I expected. The panel is unbalanced in two
ways, which would underestimate the standard error if unaccounted for. First,
some units have as much as 12x more observations than other units, due to data availability. 
Second, I've included 15x more non-DNC days as DNC days, in order to improve the baseline
estimates. Instead of the typical \(SE = \sigma / \sqrt n\) calculation, I use the
pooled \(SE = \sigma \sqrt{\sum{1/n_i}}\). 