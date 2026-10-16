---
title: "DNC Transit Study"
date: 2026-08-12T12:00:00-06:00
featured: true
description: "Did delegates take Uber or CTA?"
tags: ["data science", "econometrics", "panel data"]
image: "/img/coef_plot.jpeg"
pubtype: "Model"
link: "https://github.com/eric-mc2/DNCTransit"
weight: 500
math: true
plotly: true
sitemap:
  priority : 0.8
---

*Top-Line Result:*

Chicago hosted the 2024 Democratic National Convention from August 19-22, with official events primarily at the United Center
and McCormick Place. Over those four days, 64,000 train rides, 148,000 rideshares, and 10,000 bikeshares occurred
in proximity to the venues, of which 22,000 train rides, 31,000 rideshares, and 3,000 bikeshares 
can be attributed to the convention. There is no evidence that convention-goers preferred any transit mode at different
rates than baseline commuters.

# Introduction

This project aims to measure the partial economic impact of the 2024 Chicago Democratic National Convention. Major spotlight events such as the DNC, the NFL draft, or on a greater scale the Olympics, promise "once-in-a-generation
opportunities for job creation" to constituents [^1], and raise the profile of a city on the national and global stage. 
Balancing these promises, events face local pushback for expropriating public spaces for long periods and 
to deliver meaningful engagement with local economies. What incentives a city should offer a major corporation, 
such as Amazon[^5] or the Bears, for a more permanent investment are a related, and under-studied thread.

{{< img-grid cols="2" width="50%" images="/img/olympics.jpg,/img/nascar.jpg" >}}

In the case of the DNC, much of the local conversation anticipated interruptions due to the heightened security perimeter
surrounding the event spaces, which cordoned off several blocks (182 acres) to pedestrian and vehicular traffic. Residents
and businesses inside the perimeter expected security checks and decreased foot traffic, 
while city-wide residents expected backups along I-290 and leading to the I-90 / I-290 interchange. 

{{< img-grid cols="2" images="/img/traffic_2.png,/img/security_1.png" >}}

{{< imgresize src="/img/dnc_security_map.webp" alt="Security Perimeter" width="50%" />}}

Chicago's voting history as a Democratic stronghold and its location among Midwestern battleground states
were cited as primary factors to enter and win its convention bid[^2]. 
Other cities under consideration included Atlanta, Houston and New York City.
Chicago's hospitality sector, public transportation, venue capacity, and logistics also gave it an edge up[^3]. 
With President Biden still seeking re-election at the time of the decision, his achievement with the
Bipartisan Infrastructure Law was also at the top of the conversation and political platform for the upcoming election.

Viewing the DNC as a major tourism event promising an economic lift and highlighting green urban solutions,
my research question focuses on convention-goer's transit choices (Uber vs public transit). 
I employ standard methods from econometrics and social science, validating attendence figures from the official
[impact report](https://cdn.choosechicago.com/uploads/2024/10/TE-DNC-Impact.pdf), and extending its 
environmental sustainability analysis.

> **Does the exogeneous shock of the 2024 Democratic National Convention in Chicago significantly impact mobility?**

A secondary goal of this project was to experientially learn about statistical modeling in a policy setting. By design,
this experiment is a win-win. If a significant result is found, that's interesting. If no significant result is found,
that could be interesting too, especially results like "DNC touts green infrastructure, favors Ubers to convention".
Finally, if the experiment or data is insufficient, that's a learning opportunity to 
design and evaluate better experiments in the future

# Data

The panel dataset in this project represents daily ridership per transit station. 
I pulled ridership data from the City of Chicago, CTA, RTA, and Divvy data portals to include as many transit
modes as possible, finally using train, Uber (rideshare), and Divvy (bike) data. Unfortunately 
I could not find (or afford) walking or driving data, and public bus and commuter rail data were too coarse to use.
In this writeup I'll say "Uber" as a short-hand for all rideshare operators.

Train ridership is available as daily station counts of passenger entries. Bike data is available as individual trip-level rows,
including exact start and end times and start and end points. To match the granularity of train data, I aggregated these
to daily station (bike dock) counts of trip start-points and endpoints. Uber data is available as individual trip-level
rows, including exact start and end times and coded by census tract. I aggregated this data to daily tract counts
of start-points and endpoints. To retain a fuller picture of transit patterns, I kept and consolidated start and end points
so that all transit modes describe daily rides visiting an area. The train data is comparatively under-counted in this setup.
For modeling, I kept each transit mode in its natural geometry (fixed train station points, fixed bike dock points, uber census tracts).[^6]

| **Modality**          | **Included/Excluded** | **Challenges**                          |
|-----------------------|-------------------|-----------------------------------------|
| Train                 | x                 | easy (Socrata API / sodapy)             |
| Uber/Lyft             | x                 | medium (300M rows; query optimization)  |
| Divvy (bikes)         | x                 | hard (gps drift; unstable ids)          |
| Bus                   |                   | too coarse                              |
| Metra (commuter rail) |                   | too coarse                              |
| Walking / Biking      |                   | vendored/unavailable                    |
| Driving               |                   | vendored/unavailable                    |

Geographic data came from:

- transit routes and stops (Socrata API / sodapy)
- Census tracts (pygris)
- Building footprints (Socrata API / sodapy)
- DNC security perimeter (hand-drawn polygons)

## Panel Selection

The panel constitutes the DNC dates (August 18 - 21), plus three months' prior, capturing baseline summertime transit patterns.
I compute the distance of each transit stop and tract centroid to the United Center and McCormick Place buildings.
Any point within a mile of the building or any tract !!TODO!! is considered part of the treatment group. All other
train stations, bike racks, and census tracts within the Chicago city limits are considered part of the control group.

{{< imgresize src="/img/perimeters.png" alt="Sample" width="75%" >}}
Left-to-right close-ups of train, bike, and uber treatment area. 
Red = treatment group, black = control group. 
Blue = DNC security perimeter and 1 mile buffer. 
{{< /imgresize >}}

{{< import-html-table file="static/uploads/balance.html" >}}

holaa;a

[^1]: https://democrats.org/news/dnc-announces-chicago-to-host-2024-democratic-national-convention/
[^2]: https://www.duckworth.senate.gov/news/in-the-news/how-chicago-landed-the-2024-democratic-national-convention
[^3]: https://www.nytimes.com/2023/04/11/us/politics/democratic-national-convention-chicago.html
[^4]: Train ridership numbers only count trip starting points. Rideshare and bikeshare ridership count both starting and ending points. 
[^5]: https://www.buzzfeednews.com/article/leticiamiranda/amazon-hq2-finalist-cities-incentives-airport-lounge
[^6]: I describe the panel data preparation in more detail [here](../transit-panel/index.html). 


# Gut Checks

## Statistical Power

Before getting to the statistics, let's look at some raw numbers to see if measurement is even possible. 
According to the [official DNC impact report](https://cdn.choosechicago.com/uploads/2024/10/TE-DNC-Impact.pdf), 
**50,000** delegates visited and spent **$58.7M** city-wide.

<div style="display: flex; justify-content: center;">
<img src="./img/chevron.jpg" style="width: 200px; height:50px">
</div>

Daily aggregate CTA train ridership is **589,000 +/- 178,000**. The event is a blip on the scale of the whole city.

<div style="display: flex; justify-content: center;">
<img src="./img/chevron.jpg" style="width: 200px; height:50px">
</div>

Daily train boardings on **routes** passing through DNC is **189,000**. This is getting close to an observable effect, if one exists.

<div style="display: flex; justify-content: center;">
<img src="./img/chevron.jpg" style="width: 200px; height:50px">
</div>

Daily train boardings on **stations** near DNC is **11,000**. 
Bike and Uber rides near DNC are **6,000** and **33,000**. The effect of 50,000 delegates should
clearly be seen across all three modalities at this level. The study can likely
overcome Type 2 errors.

![](./img/stations_and_lines.jpeg)

## Parallel Trends

Now let's plot the pre-event trends in ridership. In practice, 
ridership near the DNC is much lower than
the city average. For this visualization, I'll normalize each line
to represent changes in ridership on a percent scale (compared to Day 1),
helping trends stand out visually. Difference in difference models
do not require equal levels between groups; what we are looking for 
are unequal trends.

![](./img/data/parallel_trends.jpeg)

The parallel trends assumption passes visual inspection in the pre-event period.
And during the event (shaded region), a lift in DNC-related rides is visible,
corroborating the previous gut check.

## Regression Model

I split the data into three parts per transit modality, and regress the effect of the DNC on 
each modality separately. The units of analysis are daily train rides per station, daily bike rides per station,
and daily uber rides per tract. Since the models are separate, I use both ingress and egress
for the bike and uber models, while the train model is limited to ingress.

The specification is:

$$log(rides_{it}) = \alpha_i + \gamma_t + \beta D_{it} + \epsilon_{it}$$

where $D_{it}$ indicates treatment (near the convention AND during the convention). 
Standard errors are clustered at the unit level. 

[//]: # (Or clustered at the community area level??)

## Treatment - Control Balance

The unit fixed effects design nets out any time-invariant differences between treatment and
control group, such as proximity to other transit hubs or points of interest. But the construction
of the sample has a clear selection on observables problem. And we should talk about that.

## Treatment Selection

The DNC took place mostly at the United Center, with the McCormick Place as a satellite location.
I code any transit stops or tracts within 1 mile of these locations as part of the "treatment" group.

| | Train | Uber | Bike |
| --- | --- | --- | --- |
| Near DNC | a | b | c |
| Not Near DNC | d | e | f |

These locations are not randomly selected at all. They are possibly the two best places in the City to accomodate
large events. This breaks the external validity of the design. It means that another randomly selected
venue would not have the same expected results. But the design is still internally valid: ie. we can still
accurately measure the effects of this specific event. 

As a robustness check, I will run a restricted sample including only the DNC areas, plus the 4 other major stadiums
in Chicago. The non-DNC stadiums are also a much more apt control group. 

[//]: # (Yes this is worth doing because unit FE only control for baseline differences,
but they don't control for how those areas respond to shocks. So yes, its a more credible 
sample.)

## Sample size

Somehow I should discuss the sample size and standard errors and R2 and other shit, no?
Does the poor sample size just increase my p values and that's it?

# Results

I find a causal **X% increase in Ubers** and a **38.2% increase bike rides**
and a **0% non-significant difference in train rides** due to the convention. 
Chicago-wide there were a non-causal **X% decrease in Ubers**, **Y% decrease in train rides**, 
and **Z% decrease in bike rides** observed during the event, but not isolated to the event itself.

Using a difference-in-difference regression design, I find a causal 53% lift in train ridership, a 26% lift in rideshares, and a 32% lift in bikeshares
servicing the convention venues. For context, the rest of Chicago observed a non-causal 7% decrease in train ridership,
3% decrease in rideshares, and 2% increase in bikeshares.

Using a difference in difference design, I find a causal **X% increase in Ubers** and a **38.2% increase bike rides**
and a **0% non-significant difference in train rides** due to the convention. 
Chicago-wide there were a non-causal **X% decrease in Ubers**, **Y% decrease in train rides**, 
and **Z% decrease in bike rides** observed during the event, but not isolated to the event itself.


Also show a regression table.

|                         | Uber Trips | Train Departures | Bike Trips |
|-------------------------|------------|------------------|------------|
| Coefs | a | b | c |


[//]: # (TOOD: This doesn't make any sense. How does the parallel trends chart show a huge lift and barely any drop and you're saying there's a drop?)

## Restricted models

1. Excluding Damen station.
2. Only stadiums. 
3. Only large buildings?

<!--
I should do an expanded model with 1 day extra.

Should I add spatial weights? Wouldn't be too hard. It basically models a partial exposure to treatment based on proximity.

Should I do a sensitivity analysis or code treatment as gaussian of distance from centroid to DNC?
-->

# Placebo Test

I tested 8 virtual treatment windows prior to the actual DNC event. The 
actual DNC effects were much larger than the virtual periods.

I should pick the model I like best for the placebo test.

<img src="./img/placebo_stadium.jpeg" width="400" />

# Conclusion

Um I ran a model. It has these results. I doesn't address these things. It has these limitations.
Don't over-state reasons they shouldn't trust you. 