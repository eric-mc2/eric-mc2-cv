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

I'll follow the standard economic practice of creating a quasi-experiment
out of a policy implemented with *some* 
randomness.

> *I exploit the exogeneous shock of the 2024 Democratic National Convention in Chicago, (ie. the addition of tens of thousands of politically active Democrats) to test whether a statistically significant change in public transit is observed.*

Supposing this setup is statistically valid (FOOTNOTE), I expect public transit
ridership to *increase* due to the DNC. This is because the Democratic coalition
generally lives in urban areas, supports "green" policy, government spending, etc.

***Disclaimer***: I don't really have a stake in whether Democrats in general use transit or not,
but I like this setup for a few reasons:

- if *NO* effect is found, that is also interesting
    - it suggests a gap between talk and action in the Democratic leadership
    - (in most experiments null results are boring)
- the premise is kinda click-baity
- if the setup is not statistically valid, I can practice demonstrating that too
    - (poorly tested statistics can have lasting effects on society!)
    
# At First Glance

The [report](https://cdn.choosechicago.com/uploads/2024/10/TE-DNC-Impact.pdf) 
says 50,000 delegates visited and spent $58.7M within Chicago off-site of the convention itself.
This would be a small blip in city-wide average daily CTA ridership (800,000).

But the convention event is localised to the United Center and McCormick place.
When we only look at CTA routes serving this part of the city, the average
daily ridership reduces to 325,000. An influx
of 50,000 riders would mean a 15% day-over-day increase in this area.

Breaking this down further, daily ridership is 136k for bus routes and 189,000 for train lines.
Selecting only nearby train *stations* (similar data is not available for bus *stops*), 
average daily boardings are 11,000. To round out this picture, 
there are 6,000 and 33,000 average daily bike and rideshare
trips in areas near the United Center and McCormick place.

With these totals in mind, I'd expect the DNC delegation to significantly increase
ridership nearby the convention centers, no matter what transit mode they choose.

{{< plotly json="/json/avg-daily-rides.json" height="500px" >}}

# The data

I have [constructed a panel dataset](../transit-panel/index.html) of transit ridership among train (CTA), bus (CTA), rideshare (uber, lyft, etc),
and bikeshare (Divvy). The data is aggregated to daily ridership totals at
different spatial aggregations:

- Per Station: train, bike
- Per Route: train, bus
- Per Census Tract: train, bike, uber
- Per Community Area: train, bike, uber

## Points of Interest

**Convention Centers**

I use the City of Chicago buildings shapefile to find the footprint of the 
United Center and McCormick Place, the two official sites of the DNC. Proximity
to these locations will constitute the "treatment" group in the model.

<!-- TODO: What about the security perimeter?-->
I compute a buffer around each building and find all intersecting transit stations, routes, and tracts. 
For robustness, I computed 400m, 800m, and 1600m buffers. To pick which catchement size to use, I was forced to choose
one mile buffer, because the smaller sizes had too few intersecting stations and routes.

![Bus ridership is not known per stop.](/img/panel_sample.jpeg "Transit serving convention areas.")

To test the sensitivity of this specification, I modeled:

$$\text{rides}_i \sim \text{within 400m}_i + \text{within 800m}_i + \text{within 1600m}_i$$

I found that the effect was not monotonic as the buffer size increased. (Note that
this equation specifies the marginal contribution of increasing the buffer size).
In other words, the results will be very sensitive to the choice of buffer size.

**Airport**

I coded CTA stations/lines serving O'Hare and Midway airports. I plan to include
as part of the treatment group in an alternate model specification.

## Time-like Features

**Conference Dates**

The DNC itself occurs between August 19-22. This constitutes the "treatment period"
in the model. For a robustness check I will consider extending this period by 
1 or 2 days (travel/tourism days). I may also run the model with random placebo
dates, or perhaps dates aligned with major concerts such as Lollapalooza, Suenos Festival, etc.

**Day of the Week**

Commuting patterns have strong weekday/weekend polarity. CTA ridership is drastically
higher on weekdays, while on weekends Uber ridership is higher. I'll need to control
for this in the regression.

{{< plotly json="/json/scaled-ts.json" height="500px" >}}

## Spatial Aggregation

**Train Stops -> Lines**

There are two sources of uncertainty in aggregating station-level data to line-level data.
First, this data does not indicate the direction of travel (e.g. N vs S). As a result,
this interpretation of line ridership disregards direction and assumes passengers
are equally likely to be anywhere along the line. Second,
the data does not indicate the actual line boarded at hub stations serving multiple lines.
To approximate this choice, I simply divide each station total by the number
of lines served by the station.

**Lines vs Point of Interest**

I code a *binary* variable indicating if train lines, bus routes, or tracts
*intersect* a point of interest (convention
centers or airports). This lends to the simplistic interpretation that the line
*"serves"* the point of interest.

Obviously this leaves a lot of uncertainty unaddressed. How far does the line
travel away from the point of interest? What proportion of the line is somewhat
"close" to the point of interest? How is ridership distributed along the line?
With out a better model of rider destinations (ideally a source-destination matrix),
I can't really address this with more accuracy.

**Gravity and Catchement Models**

A real urban mobility researcher would probably use some kind of diffusion
model, saying that rider origins are normally distributed around each station. 
This might be more realistic but I don't have the capacity to estimate and
incorporate this kind of complexity.

## Other Spatial Features

**Transit Density**

For the tract-level dataset, I spatially join tracts vs train stations and bus stops
to find the distance to the nearest transit option. Could be a helpful covariate.

**Location**

I include the stop/line/tract centroid longitude and latitude as a quadratic
term in the model to capture basic city-wide demographic factors:

$$
\sim \beta_1\text{lon} + \beta_2\text{lat} + \beta_3\text{lon}*\text{lat} + \beta_4\text{lon}^2 + \beta_5\text{lat}^2
$$

(For numeric stability, I scale lon/lat to zero-mean unit variance.)

# The Sample

**Weekends**

Since the DNC itself only occurs during weekdays, it is perfectly co-linear with
a weekday variable, breaking the regression procedure. To fix this co-linearity
problem, I will drop observations on Friday, Saturday, and Sunday from the model. 
(Ridership on these days doesn't convey any information about the "treatment"
because the DNC doesn't even happen on these days.)

For this same reason, I use *daily* observations. Aggregating the data to weeks
would include extraneous variance due to weekends. It would also *attenuate* the
treatment effect since the DNC only occurs on 4/7 days of the week -- the other
3/7 days would require a form of "[noncompliance](https://en.wikipedia.org/wiki/Local_average_treatment_effect#Non-compliance_framework)" correction. 

**Baseline Dates**

I use data from the summer months, June, July, and August. Restricting the data
to this set makes sense for two reasons. First, I avoid needing to incorporate
more complex modeling of seasonality. Second, transit has been on a long-term
rebound since the pandemic, which is less noticeable on short time-scales: 
I avoid needing to incorporate a parameter to account for this long-term trend.


**Boardings vs Trips**

CTA train and bus data only provides the locations where riders *board* transit,
not where they *exit*. Bike and rideshare data provides per-trip board *and* exit
locations. For strict parity, I'd want to only consider *boarding* locations, but
keeping the exit data gives a fuller picture of transit usage. In this scheme,
bike and rideshare data are double-counted compared to train and bus: this 
isn't an issue for regression as the difference in scale will be absorbed
by the "transit" coefficient.

## Baseline Characteristics 

Here is a completness chart showing which days/units are missing data. Some
community areas are regularly missing bike or uber data. Uber data would be missing due to anonymization.
Without knowing the details of the anonymization rules, we can generally say
there are triggered when fewer rides happen. For now I will drop both such data
points but will impute them as zero rides as a robustness check. (Community areas with no 'L' service
are excluded from this figure.)

![Missing Data](/img/missingness.jpg#scaledown)

Here is a balance table for the community area panel:

{{< import-md-table file="static/uploads/comm-balance.md" >}}

And for the route/line panel:

{{< import-md-table file="static/uploads/line-balance.md" >}}

# TODO:

*This blog post isn't finished!* I still have to write-up:

- power analysis (minimum statistically detectable effect)
- regression models
- robustness checks and checking model assumptions

^^ Most of that work is already completed in [these](https://github.com/eric-mc2/DNCTransit/tree/main/notebooks/exploratory/2024/11/gut-check.ipynb) [notebooks](https://github.com/eric-mc2/DNCTransit/tree/main/notebooks/exploratory/2024/11/panel-models.ipynb).


# Why you shouldn't trust this

**Power**

- may not have enough relevant observations to precisely estimate effect of DNC

**Treatment Mis-Specification**

- assumes riders cannot transfer train lines

**Control Mis-Specification**

- the control group should be "like" the treatment group, but I use the entire
    city as a comparison. it's not apples-to-apples. a better control group might
    be a handful of the major event/cultural institutions like Soldier Field, 
    Wrigley Field, Guaranteed Rate Field, Art Institute. or finding matched pairs
    based on covaraites.

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