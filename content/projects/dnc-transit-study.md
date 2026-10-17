---
title: "DNC Transit Study"
date: 2026-08-12T12:00:00-06:00
featured: true
description: "Did delegates take Uber or CTA?"
tags: ["data science", "econometrics", "panel data"]
image: "/img/coef_plot.jpeg"
pubtype: "Model"
weight: 500
math: true
plotly: true
sitemap:
  priority : 0.8
---

*Top-Line Result:*

Chicago hosted the 2024 Democratic National Convention from August 19-22, with official events primarily at the United Center
and McCormick Place. Over those four days, 64,000 train rides, 148,000 rideshares, and 10,000 bikeshares occurred
in proximity to the venues, of which **22,000 train rides, 31,000 rideshares, and 3,000 bikeshares** 
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

A secondary goal of this project was to experientially[^8] learn about statistical modeling in a policy setting. By design,
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

## Observed Data and Treatment "Selection"

The panel constitutes the DNC dates (August 18 - 21), plus three months' prior, capturing baseline summertime transit patterns.
I compute the distance of each transit stop and tract centroid to the United Center and McCormick Place buildings.
Any point within a mile of the building or any tract !!TODO!! is considered part of the treatment group. All other
train stations, bike docks, and census tracts within the Chicago city limits are considered part of the control group.

{{< imgresize src="/img/perimeters.png" alt="Sample" width="75%" >}}
Left-to-right close-ups of train, bike, and uber treatment area. 
Red = treatment group, black = control group. 
Blue = DNC security perimeter and 1 mile buffer. 
{{< /imgresize >}}

{{< import-html-table file="static/uploads/balance.html" >}}

# Power Analysis

## Back of the Envelope

A look at the raw transit counts helped specify the design units and treatment designation. 
According to the [official DNC impact report](https://cdn.choosechicago.com/uploads/2024/10/TE-DNC-Impact.pdf), 
**50,000** delegates visited and spent **$58.7M** city-wide. Is this exogeneous shock large enough to be statistically observable?
Yes, by narrowing the region in which we assume it will have a direct effect. 
If we assume the shock is evenly distributed across the whole city, it would not be observable, as daily aggregate 
CTA train ridership is **589,000 +/- 178,000**. Considering train routes passing through DNC venues, the signal-to-noise
ratio improves, since those routes serve **189,000** passengers per day. Finally, the exogeneous shock ought to be
quite noticeable compared to the specific train stations, tracts (Uber rides), and bike stations nearest the venues, as these serve
**11,000**, **33,000**, and **6,000** daily passengers respectively -- far fewer than the **50,000** additional expected passengers. 
By this back-of-the-envelope math, type II errors are avoidable if "treatment" is defined in this way.

## Minimum Detectable Effect

Turning to a more formal analysis. I compute the minimal detectable effect size (MDE) by estimating the classic 2x2
difference-in-difference contrasts. To express the minimal detectable exogeneous shock, 
I multiply by the pre-treatment baseline outcome and number of treatment days.
 
$$\hat \beta = (\overline{logy}_{1,1} - \overline{logy}_{1,0}) - (\overline{logy}_{0,1} - \overline{logy}_{0,0}) $$
$$ \text{MDE}_{\%} = \exp(z_{1-\alpha/2} + z_{1-power}) \exp(SE(\hat \beta)) - 1 $$
$$ \text{MDE}_{\text{total}} =  \text{MDE}_{\%} * \bar y_{1,0} * T_{\text{treat}} $$

{{< import-md-table file="/static/uploads/mde_simple.md" >}}

The difference in difference comparison yields more statistical power than the back of the envelope calculation.
Assuming most delegates use these three observable transit modes, their arrivals far exceed the statistical type II threshold.

# Regression Model

For the main regression specification, I use a difference-in-difference model with two-way fixed effects,

$$\log y_{it} = \beta_1 D_{it} + \beta_2 D_{it} M_i + \alpha_i + \gamma' t M_i +  \epsilon_{it} \tag{1}$$

where \(y_{it}\) are the number of rides, \(D_{it}\) is the treatment indicator for unit i at time t,
\(M_i\) indicates the transit mode, \(\alpha_i\) are unit fixed effects, \(\gamma' t M_i\) are time fixed
effects interacted with transit mode, and \(\epsilon_{it}\) is the idiosyncratic error term. Standard 
errors are clustered two ways per unit and per timestep[^7].

Conceptually, diff-in-diff models proceed in three stages. First, the model measures how the control group changes over time.
Second, the model measures how the treatment group changes over time. Third, it compares the two group's changes. 
If the treatment group changes much more or much less than the control group, then the model rejects the null hypothesis.
If the two groups' trajectories are similar, then the model fails to reject the null hypothesis. 

The fixed effect terms in the equation above exploit the panel data structure (repeated observations of a fixed sample) and ensure that
each unit is compared to itself and the group average, accountingn for the fact that different transit modes and different
units have different absolute ridership levels (e.g. central business district traffic is much higher than residential). 
The time x transit fixed effects controls for transit-specific daily shocks (such as service outages or weather)
which differently affect different transit modes. 

## Parallel Trends

To first order, both treatment and control are flat in the pre-event period. The two groups also follow each other's
high-frequency variation pretty closely. The identifying assumption of difference in difference model is parallel linear
trends in the pre period. Averaging out the high-frequency variation, this is definitely satisfied.

{{< imgresize src="/img/parallel_trends.png" alt="Parallel Trends Test" width="60%" >}}
Daily rides for an average train station, bike dock, and census tract. Gray region denotes DNC event.
{{< /imgresize >}}

The impact of the DNC is visible during the event period, where the group trends diverge, but the magnitude of this
change is on par with the typical high-frequency variation of the time series. This begs the question if spurious effects
exist in the pre-period, and if the event period is also coincidentally 'significant'. I test this condition with a placebo
test in a following [section](#Robustness-Checks) of the report.

## Results

The effect of the DNC on ridership was a **53%, 26%, and 32%** increase across train, Ubers, and bikeshares. Compared to
each mode's own baseline, each increase is statistically significant. However, despite the point estimates being far apart,
the estimates have a high variance so the between-mode comparison is not significant. 

These percentage changes translate to an aggregate increase of **22,000 train rides, 31,000 Uber rides, and 3,000 bike rides**
near DNC venues and during the event. As noted in the introduction, these are a fraction of the raw observed rides,
or even the observed week-over-week change, because this method nets out the baseline venue traffic and any common city-wide
shocks to traffic during the event. 

{{< import-html-table file="/static/uploads/did_study.html" >}}

# Robustness Checks

## Model Specifications

I run a battery of alternative model specifications and sub-samples of the data to test potential confounders.

1. The main model (Eq 1).
2. A more parsimonious fixed effect structure, keeping only the non-interacted unit and time components (Eq 2).
3. Omits the CTA Green Line Damen stop, which was closed for construction until August 5. 
4. The sample from (3), using the model specification from Eq 2.
5. Sub-samples the panel to only include units within 1 mile of the United Center, McCormick Place, Wrigley Field, Soldier Field, and Rate Field.
6. The sample from (5), using the model specification from Eq 2.

$$\log y_{it} = \beta_1 D_{it} + \beta_2 D_{it} M_i + \alpha_i + \delta_t + \epsilon_{it} \tag{2}$$

Motivating (3), the timing of the Damen Green Line stop's re-opening, one week before the DNC, is a likely confounder. Unfortunately the Damen stop is also the closest stop to the United Center.
Motivating (5), the DNC venue areas are likely dissimilar to Chicago in general. By restricting the sample to other major sporting venues, the control group is more apt. 

{{< import-html-table file="static/uploads/did_battery.html" >}}

All alternatives except (5) retain a statistically significant main effect (for the Uber rides reference category). 
All alternatives also fail to reject the null hypothesis contrasting the transit modes 
(i.e. there is no evidence that one mode was preferred over another).
The total effect (CATE) for train remains significant for all models except (5). The total effect for bikes remains significant
for all models except (6).

## Placebo Test

TODO: START HERE. KEEP WRITING

I tested 8 virtual treatment windows prior to the actual DNC event. The 
actual DNC effects were much larger than the virtual periods.

I should pick the model I like best for the placebo test.

<img src="./img/placebo_stadium.jpeg" width="400" />


# Discussion

These results should not be extrapolated to other cities or even other venues in Chicago. The current study is an exercise
in precisely attributing the effects of a policy which was clearly non-random in its selection. The United Center and McCormick Place
were selected as venues precisely for their ability to accomodate large crowds, a classic case of selection-on-the-dependent-variable. 
However. The parallel trends test, placebo test, and alternate specifications all give credibility to the internal 
validity of the results.

[^1]: https://democrats.org/news/dnc-announces-chicago-to-host-2024-democratic-national-convention/
[^2]: https://www.duckworth.senate.gov/news/in-the-news/how-chicago-landed-the-2024-democratic-national-convention
[^3]: https://www.nytimes.com/2023/04/11/us/politics/democratic-national-convention-chicago.html
[^4]: Train ridership numbers only count trip starting points. Rideshare and bikeshare ridership count both starting and ending points. 
[^5]: https://www.buzzfeednews.com/article/leticiamiranda/amazon-hq2-finalist-cities-incentives-airport-lounge
[^6]: I describe the panel data preparation in more detail [here](../transit-panel/index.html). 
[^7]: I test variations of this model in the [robustness](#Robustness-Checks) section.
[^8]: Code available on my [github](https://github.com/eric-mc2/DNCTransit).

<!--
I should do an expanded model with 1 day extra.

Should I add spatial weights? Wouldn't be too hard. It basically models a partial exposure to treatment based on proximity.

Should I do a sensitivity analysis or code treatment as gaussian of distance from centroid to DNC?
-->

# Conclusion

Um I ran a model. It has these results. I doesn't address these things. It has these limitations.
Don't over-state reasons they shouldn't trust you. 