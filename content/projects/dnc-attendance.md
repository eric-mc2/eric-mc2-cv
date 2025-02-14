---
title: "DNC Transit Effect? (Part 3)"
date: 2025-02-01T10:47:51-06:00
featured: true
description: "Navigating the challenges of selection bias"
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

# Recap

In a [previous post](../dnc-effect/index.html) I proposed a statistical model
to estimate whether the 2024 Chicago DNC affected public transit usage across Chicago.

The learning objective was to was to try to construct a believable model from a real-life
event -- or to convince myself that the model is too flawed to be trustworthy.

I gathered [ridership data](../transit-panel/index.html) for train, bike, and rideshares, plus the dates and
locations of the DNC. Then I [estimated](../dnc-effect-results/index.html) two regression models: a fixed-effects model
and a difference-in-difference model. The results indicate that the DNC caused
ridership to increase near the convention centers. However, mobility across
the rest of Chicago also declined during that week.

Do we belive this design? I'll list several issues that I thought of. 

# Problems with this model

(Key: 😡 = dealbreaker; 🙁 = bad but maybe fixable; 🫤 = not a dealbreaker)

**Control Mis-Specification - 😡**

- the control group should be "like" the treatment group, but I use the entire
    city as a comparison. it's not apples-to-apples. a better control group might
    be a handful of the major event/cultural institutions like Soldier Field, 
    Wrigley Field, Art Institute. or using finding matched pairs based on covariates.

**Selection Bias - 😡**

- the convention centers were explicitly chosen for their ability to accomodate visitors (via transit)
    - this is mostly a problem for external validity (over-estimating the result if repeated elsewhere),
    which is not the point here

<!-- We can't control for selection on observables because first we don't literally
    know the selection mechanism so we can't perfectly control for it,
    and second we can find similar-ish non-treated units but there aren't
    non-treated units at the united center, right, so we don't have common support.
     -->
    
**Substitutability of Transit - 🙁**

- Travelers have different options for transit. Their choice depends on location, time of day,
    distance cost and reliability of other options. I don't like that I'm modeling
    these modes independently right now, but unifying them would be a rabbit hole.

**Spillover into control - 🙁**

- DNC visitors might stay in chicago longer than the official convention dates, 
    which would attenuate any effect
    - we can mitigate this by using placebo dates or by an event study design
- DNC visitors may visit other parts of the city, attenuating the effect
    - we can mitigate this by maybe searching for spikes in other areas 
    (but introduces a multiple testing issue)

*Since the effects were statistically significant, I am not worried about these
attenuation biases.*

**Spillover into treatment - 🙁**

- drawing buffers around the event centers weakens our identification strategy 
    (marginally nearby transit might be spuriously related to the DNC itself)

*This concern can be mitigated (for tract-level model) with a robustness check, 
by varying whether the buffer must contrain 100% of tract land area, 75%, 50%, etc.*

**Confounding Variables - 🙁**

- the security perimeter around the event centers may actually suppress ridership

*It will be hard to disentagle the security effect (-) from the DNC effect (+).
One way might be to test the sensitivity of the model to varying buffer sizes 
(smaller than the perimeter, equal to the perimeter, larger than the perimeter).*

**Gravity and Catchement Models - 🫤**

- Theoretically I'm interested in true origins and destinations, not the "first/last stop"
    of transit, which is the data I have. For rideshares, the two are probably the same.
    But for trains and bikes we can assume people need to walk the last mile,
    which may mean crossing census tract boundaries. This is why I haven't
    aggregated station-level ridership to tract level. I'd want to model some
    cross-tract spillover e.g. via a gaussian.

# Fixing the Selection Problem

## Matched Pairs

One way to mitigate selection bias is to choose control units that are "like"
treatement units' at baseline. I can model

$$ P(\text{near convention} | X) $$ 

and then find other units with high probabilities that were in fact not near the DNC.
Unfortunately, I don't have a strong theoretical definition of "likeness", nor
the data to measure it. Ideally I'd like to operationalize "ability to handle large crowds".
I didn't see maximum fire code capacity in Chicago's building footprint dataset. 
But I can measure attendance at crowded events.

## Attendance Model

I'll compare the DNC locations (United Center and McCormick Place) to Chicago's
other major event venues. I chose Wrigley Field, Guaranteed Rate Field, and Soldier Field
because per-game sports attendance data is readily available[^1]. I also pull in
conference event data for McCormick Place[^2].

Now the control group is more "similar" in terms of its transit patterns. 
I'll include event attendance as a variable in the regression. 

One drawback of this method is that I can only now compare "event days", drastically
reducing the sample size. Worse, Soldier Field and Guaranteed Rate Field do not have
games during the DNC, reducing the active control group just to transit options near
Wrigley Field.

![Event timeline](/img/attendance_timeline.jpeg "Event timeline.")

The sample sizes are just too small.

## Stadium Model

On second thought, using attendance as a regression variable makes it hard to 
interpret our treatment effect. Ceteris peribus, I'd be modeling
the effect of the DNC *in excess of the DNC attendees*. That's not at all what I want.

Why not drop the attendance term, but keep the reduced sample of *transit near stadiums*
on *all game/non-game days*. Now the treatment and control are much more similar
in terms of transit density:

{{< import-md-table file="static/uploads/balance-stadium.md" >}}

I estimate the same difference in difference model as before:

$$ \log{rides_{it}} \sim \beta_0 + \beta_1 \text{DNC}_t + \beta_2 \text{near DNC}_i + 
    \beta_3 \text{DNC}_t \text{near DNC}_i +
    X_{it} + u_{it} $$

{{< import-md-table file="static/uploads/did-stadium.md" >}}

In the control group we observe a (non-causal)
-10.8%, -13.5% (NS), -9.1% (NS) percentage-point change in rideshare, train, and bike 
rides, which agrees directionally with the un-subsetted data. The
causal effect of the DNC on rideshares, train, and bike rides 
near the DNC is a +31.6%, +145.5% (NS), and +56.7% percentage-point change,
an increase in magnitude.

As a robustness check on this model, I plot the parallel trends and run a placebo 
test, shifting the simulated treatment period back across 8 x 4-day windows.
38% of the simulated models returned statistically significant main effects,
but the actual DNC effects (x's) were much larger than the simulated effects (box & whisker).

![Placebo Test](/img/placebo_stadium.jpeg "Placebo Test.")

# Conclusion

I attempt to overcome selection effect bias by a pseudo-matched pairs method,
comparing transit ridership near large event centers in Chicago. The results
agree directionally and give credence to the original experimental design.

# Footnotes

[^1]: CSV's downloaded from the [sports-reference](https://www.baseball-reference.com/teams/CHC/2024-schedule-scores.shtml) family of websites.

[^2]: Scraping events listed on [tradefest.io](https://tradefest.io/en/selection/events-at-mccormick-place-convention-center) 