---
title: "DNC Transit Effect? (Part 2)"
date: 2025-01-08T10:47:51-06:00

featured: true
description: "Presenting the regression results"
tags: ["data science", "econometrics", "panel data"]
image: ""
pubtype: "Model"
link: "https://github.com/eric-mc2/DNCTransit"
weight: 500
math: true
draft: true
plotly: true
sitemap:
  priority : 0.8
---

A few weeks ago I fumbled an interview question on statistical modeling. That
hurt my pride, so I decided to take on a little modeling project. 

> **Does the exogeneous shock of the 2024 Democratic National Convention in Chicago induce significant impacts on public transit usage?**

In a [previous post](../transit-panel/index.html), I collected Chicago open transit data
and [designed](../dnc-effect/index.html) a quasi-experiment to measure the causal
impact of the DNC on ridership.

# Regression

Now for the results ...

## Fixed Effects Model

The fixed effects specification is great when you don't have enough control variables.
It controls for all the ways that units are different at baseline -- all 
time-invariant variables.

The equation includes an indicator for "during DNC", day-of-the-week dummies,
time trend, and unit fixed effects:

$$ \log(\text{rides}_{it}) \sim \beta_0 + \beta_1\text{DNC}_t + \beta_2 \text{dotw}_t + \beta_3 t + \alpha_i $$

The convenience of FE is also a downside: many helpful covariates, including 
the treatment "indicator", distance to DNC, do not vary with time. These factors
get subsumed in the unit fixed effect term \(\alpha_i\), meaning we can't estimate
them separately.
Without being able to isolate the *location* of the DNC, this model only
speaks to city-wide effects during the DNC. 

With this major caveat in mind, let's run the model (separate models per transit mode[^1]):

{{< import-md-table file="static/uploads/fe.md" >}}

The results show a -5.1%, -7.8%, and +3.0% percentage point change in uber, train, and bike ridership
during the DNC compared to other summer days. This supports the
hypothesis that the anticipated traffic suppressed city-wide mobility (except for
bikes which are less affected by traffic).

## Difference in Difference

The difference in difference model isolates *both* the *area* and *time* of the DNC.
First it compares near-DNC ridership during the DNC to near-DNC ridership before the DNC.
This allows near-DNC areas to partially control for themselves. 

$$\Delta \text{nearby} = E(\text{rides} | \text{nearby}, \text{during DNC}) 
    - E(\text{rides} | \text{nearby}, \text{not during DNC})$$

It does the same comparison
for far-from-DNC areas. 

$$\Delta \text{not nearby} = E(\text{rides} | \text{not nearby}, \text{during DNC}) 
    - E(\text{rides} | \text{not nearby}, \text{not during DNC})$$

The difference between these comparisons isolates the *spatial*
and *temporal* effects at the same time.

$$\text{DiD} = \Delta \text{nearby} - \Delta \text{not nearby} $$

In the formal model I include time trend, day-of-the-week dummies, distance to nearest transit, and
quadratic lat/long terms[^2].

$$ \log{rides_{it}} \sim \beta_0 + \beta_1 \text{DNC}_t + \beta_2 \text{nearby}_i + 
    \beta_3 \text{DNC}_t \text{nearby}_i + 
    X_{it} + u_{it} $$

{{< import-md-table file="static/uploads/did.md" >}}

These results show a baseline difference in transit usage between convention 
and non-convention areas. The city-wide temporal effects agree directionally 
with the fixed-effect model: a -6.0%, -11.4%, and +1.2%
percentage-point change in rideshares, train, and bike ridership. However, the
interaction of near and during DNC shows positive effects across all transit modes:
+21.4%, +101.8%, and +26.9% percentage-point
changes in rideshares, train, and bike ridership. 

### Parallel Trends

The diff-in-diff model operates on the "parallel trends" assumption: the 
control group and (unobserved) counterfactual treatment group must have similar
slopes during the treatment period. In practice, since we cannot observe the counterfactual group,
we check whether the treatment and control groups have similar slopes prior to treatment.
And we ask "do we believe this relationship would hold in the next period"?

Plotting pre-treatment rides, the group trends are very consistent
in the long-term and even show similar patterns on a weekly scale. 
We also don't see any anticipatory effects leading up to the DNC event.

![Parallel trends assumption](/img/parallel_trends.jpeg "Parallel trends assumption.")

# Conclusion

TODO

# Discussion

TODO

In the [next post](../dnc-attendance/index.html), I'll evaluate whether I really find this model believable or not.

# Footnotes

[^1]: See [first](../dnc-effect/index.html#footnotes) footnote.

[^2]: Omitted for visual clarity.