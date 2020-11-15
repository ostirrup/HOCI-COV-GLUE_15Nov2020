# Reporting tool algorithm specifications
### COG-UK HOCI project

Owner: oliver.stirrup@ucl.ac.uk

## Overview
The purpose of this document is to provide an overview of the inputs, data processing and outputs of the reporting tool sequence matching and probability score algorithm. A brief description is given of the probability model used, and the assumptions required. The outputs of the algorithm specified will be used as inputs for report generation, how they will be summarised is specified in a separate document (Reporting tool output specification).

The sequence matching and probability score algorithm will be run one-at-a-time for each sequence corresponding to an enrolled case in the COG-UK HOCI study. The term “focus sequence” refers to the institution-sampled sequence (and associated meta-data) on which the sequence matching and probability score algorithm is being run. If a batch of sequences corresponding to enrolled cases has been received on the same day, then these should all be uploaded to the reporting tool (along with any other available institution-sampled and community-sampled sequences) before the algorithm is run on each focus sequence.

## Classification of sequences within algorithm
As part of the operation of the tool, we use the metadata to assign sequences to categories representing broadly where the individual may be part of a COVID19 transmission network.

Therefore, input data for the sequence matching and probability score algorithm within the reporting tool can be split into three categories based purely on the metadata:
* Unit reference set : individual could be involved with transmission on the same unit (ward / ICU etc) as the focus sequence
* Institution reference set : individual could be involved with transmission in the same institution as the focus sequence
* Community reference set : individual could be involved with transmission outside of the focus sequence institution.

It is possible for samples to be members of multiple reference sets. For example an outpatient may be involved in COVID19 transmission at the institution they attended, or in transmission outside of any institution.

Each of these three datasets comprise subsets of the uploaded institution-sampled and community-sampled sequences and associated meta-data for each site. 

### Unit reference set
This data set comprises all institution-sampled sequences, excluding the focus sequence, sampled on or ≤3 weeks prior to or ≤2 days after the sample date of the focus sequence and for which both the institutionID and the unitID is the same as that for the focus sequence.

### Institution reference set
This data set comprises firstly all institution-sampled sequences from HCWs, outpatients and inpatients diagnosed >2 days after admission for which the institutionID matches that of the focus sequence, excluding the focus sequence itself, sampled on or ≤3 weeks prior to or ≤2 days after the sample date of the focus sequence and for which the unitID is either not the same as that for the focus sequence or is missing. Secondly, the data set includes all institution-sampled sequences from A&E patients or inpatients diagnosed ≤2 days after admission for which the institutionID matches that of the focus sequence, excluding the focus sequence itself, sampled between (inclusively) 3 weeks and 3 days prior to the sample date of the focus sequence and for which the unitID is either not the same as that for the focus sequence or is missing. Thirdly, this data set also includes the subset of community-sampled sequences for which isHealthcareWorker is TRUE and hcwWorkplaceID is equal to the institutionID of the focus sequence.

### Community reference set
This data set comprises firstly all community-sampled sequences sampled on or ≤6 weeks prior to or ≤2 days after the sample date of the focus sequence. This data set also includes institution-sampled sequences sampled on or ≤6 weeks prior to or ≤2 days after the sample date of the focus sequence for which admissionStatus is equal to not_a_patient, outpatient or a_and_e_patient, or for which admissionStatus is equal to inpatient and the sampleDate and symptomOnsetDate (if recorded) are both ≤2 days after the admissionDate. The focus sequence will be excluded from the community reference set.

Note that some institution-sampled sequences will contribute to both the community reference set and either the unit reference set or the institution reference set (e.g. outpatients sampled within 3 weeks prior to the focus sequence would be included in both the community reference set and the institution reference set). HCWs recorded among the community-sampled sequences within ≤3 weeks prior to the sample date of the focus sequence will also be included in both the community reference set and the institution reference set if their hcwWorkplaceID matches the institutionID of the focus sequence.

## Sequence matching process
For each run of the algorithm, pairwise comparisons will be conducted between the focus sequence and each sequence within the unit reference set, the institution reference set and the community reference set. A reference set sequence will be considered a close match to the focus sequence if there is a maximum of two differences in SNPs between the two sequences.

Ambiguous nucleotide positions will be considered to match if there is an overlap in the possible values for the two sequences. ‘N’ values recorded in either the focus sequence or comparison sequence will be considered to be a match at that position.

## Probability calculations
### Bayesian framework
The algorithm will use Bayes theorem to calculate probability scores for post-admission infection of each focus case divided by exposure on the unit (UI), within the rest of the institution (II) and from visitors (VI, when visitorsOnWard is true for the focus case). In the following, PrP is the prior probability of post-admission infection, Pu is the prior probability of infection on the unit given post-admission infection and Pv is the prior probability of infection from a visitor given post-admission infection.
 
*Posterior UI =*
<img src="https://render.githubusercontent.com/render/math?math=\frac{P_{prior}* P_u * P(seq \pm 2 \, SNPs| UI )} {P_{prior}* P_u * P(seq \pm 2 \, SNPs| UI ) \,%2B\, P_{prior}* P_v \times P(seq \pm 2 \, SNPs| VI ) \,%2B\,P_{prior}* (1-P_u-P_v) * P(seq \pm 2 \, SNPs| II ) \, %2B \, (1-P_{prior})*  P(seq \pm 2 \, SNPs| CI )},">

*Posterior II =*   
<img src="https://render.githubusercontent.com/render/math?math=\frac{P_{prior}* (1-P_u-P_v) * P(seq \pm 2 \, SNPs| II )} {P_{prior}* P_u * P(seq \pm 2 \, SNPs| UI ) \,%2B\, P_{prior}* P_v \times P(seq \pm 2 \, SNPs| VI ) \,%2B\,P_{prior}* (1-P_u-P_v) * P(seq \pm 2 \, SNPs| II ) \, %2B \, (1-P_{prior})*  P(seq \pm 2 \, SNPs| CI )},">

*Posterior VI =*  
<img src="https://render.githubusercontent.com/render/math?math=\frac{P_{prior}* P_v \times P(seq \pm 2 \, SNPs| VI )} {P_{prior}* P_u * P(seq \pm 2 \, SNPs| UI ) \,%2B\, P_{prior}* P_v \times P(seq \pm 2 \, SNPs| VI ) \,%2B\,P_{prior}* (1-P_u-P_v) * P(seq \pm 2 \, SNPs| II ) \, %2B \, (1-P_{prior})*  P(seq \pm 2 \, SNPs| CI )},">

Once we have defined our prior probabilities, we require estimates of the probability of observing a similar sequence to the focus sequence conditional on community infection (CI), UI, II and VI. For UI and II, we will estimate this using the observed sequence match proportion (on pairwise comparison to the focus sequence) in the unit reference set and institution reference set, respectively. For CI and VI, we will use a weighted proportion of the matching sequences in the community reference set, described in detail in the ‘Geographic weighting for community reference set’ section of this document below.

In the event that no close sequences matches to the focus sequence are found in any of the reference sets, the algorithm will return the prior probabilities that would have been generated without any sequencing data.

### Prior probabilities
#### Post-admission infection (*P<sub>prior</sub>*)
In focus cases for which symptomatic is TRUE, we base the prior probability of post-admission infection on the time interval (*t*) from admissionDate to symptomOnsetDate (with the latter set to sampleDate if missing). Assuming a constant individual-level hazard of infection pre- and post-admission we calculate *P<sub>prior</sub>=F(t)*, where *F()* is the cumulative distribution function of a log-normal distribution for incubation times, with parameters set at the point estimates from the primary analysis of Lauer et al (doi:10.7326/M20-0504, μ=1.621, σ=0.418). 

For focus cases for which symptomatic is FALSE, we define our prior on the basis that some proportion of the cases detected will never become symptomatic (*P<sub>a</sub>*) with the remainder going on to develop symptoms within the next few days (*1-P<sub>a</sub>*). We then define our prior probability of post-admission infection in these cases as:

<img src="https://render.githubusercontent.com/render/math?math=P_{prior} = (1-P_a)*F(t %2B c) %2B P_a*F(t),">

where *t* is the interval from admissionDate to sampleDate and *c* is a constant reflecting the average interval within which we expect symptoms to appear (among those cases in which they do).

*P<sub>a</sub>* is set at 0.4 based on the findings of a published review article (doi.org/10.7326/M20-3012), and *c* is set to 3 based on a combination of expert opinion of the study PIs, the known distribution of time from infection to symptom onset and expert experience of asymptomatic screening.


#### Source given post-admission infection
The model requires prior values for the probability of UI and VI given post-admission infection: *P<sub>u</sub>* and *P<sub>v</sub>*, respectively. However, in specifying the model we define *P<sub>u</sub>’* as the probability of UI given post-admission infection when visitorsOnWard is FALSE, in which case the probability of VI is zero and *P<sub>v</sub>’=0*. If visitorsOnWard is TRUE for the focus case, then we set *P<sub>u</sub>= P<sub>u</sub>’×(1-P<sub>v</sub>)*.

Based on expert opinion of the study PIs, *P<sub>u</sub>’* is set to different values according to the unit/ward type of the focus sequence: 0.5 for single bed wards, 0.7 for bay wards and 0.9 for Nightingale wards. The unit layouts are specified for each possible unit of each site in a site-specific set-up file (hociSite.json). If the unit type is missing when the sequence reporting tool is run, *P<sub>u</sub>’* defaults to the value for bay wards.

*P<sub>v</sub>* is set to 0.2, based on expert opinion of the study PIs. The *P<sub>u</sub>* values are therefore: 0.4 for single bed wards, 0.56 for bay wards and 0.72 for Nightingale wards.

### Geographic weighting for community reference set
The weight of each sequence within the community reference set will be determined by geographic distance from the residentialOuterPostcode of the focus case, using a function of the form:
*weight= (1-β)*exp(-τ*communityDistanceToIndex[i]) + β*,
where, β takes a value between 0 and 1, and τ>0. These parameters will be set based on calibration to the available community reference set at each site prior to implementation of the reporting tool (and possibly updated throughout the study if the lockdown policy changes significantly). The rationale for this weighting is that there is likely to be geographic clustering of viral lineages, and so newly observed community transmissions of SARS-CoV-2 are more likely to show genetic similarity to past sequences from the local area of that individual’s home than to past sequences from regions that are further away. The following is an illustrative plot of this function with β set to 0.2 and τ set to 2, weight is on the y-axis and distance on the x-axis:

<img src="geo_fun_plot.png?raw=true">

If residentialOuterPostcode is missing for the ith case in the community reference set, then communityDistanceToIndex[i] is set to 100 km.

We assume that the probability of a sequence match conditional on infection from visitor on unit/ward can be calculated using the same weighting scheme as for the probability of a sequence match conditional on community-acquired infection (i.e.  *P(seq±2 SNPs|CI)==P(seq±2 SNPs|VI)*).

## Assumptions/limitations
The most important limitation of the tool is that population sampling coverage is not accounted for in the model and the constituent estimates used. At any given point in time, we will have incomplete knowledge of the viral genomic variation present within an institution and the surrounding community due to the combination of many factors, including: pre-symptomatic transmission, asymptomatic transmission, incomplete testing of symptomatic patients, incomplete sampling of viral genomes among test +ve cases and viral genome sequencing failures and delays. It would be very difficult to explicitly model all of these factors within the timeframe available for tool development, the computational and functional requirements of the tool and the likely available data inputs. The recipients of the sequence reporting tool will therefore need to be aware of these limitations in order to appropriately interpret the results.

For example, if a unit has several recent COVID-19 cases but none of these have been sequenced and entered into the tool, then the reporting tool will return a potentially incorrect zero probability of post-admission infection on the unit for a new focus case.

## Algorithm outputs
This section summarises the data outputs that will be returned by the sequence matching and probability score algorithm within the reporting tool. A subset of these will be used to generate the report returned for each focus sequence (detailed in Reporting tool output specification).

The algorithm will return the estimated probability of post-admission infection for the submitted focus sequence separately for (1) exposure on the unit at time of sampling, (2) exposure elsewhere in the institution/healthcare system and (3) exposure from visitors. The ‘prior probability’ of post-admission infection, based on the interval from admission to symptom onset or sampling, will also be returned. The observed proportion of recent close sequence matches will be reported for the unit and institution, along with the estimated proportion of close sequence matches within the local community of the focus case (this is a weighted proportion based on geographic distance).   

The algorithm will return the ID of the submitted focus sequence and a list of all sequence IDs sampled from the same unit within the last 3 weeks; for each of these the algorithm will return the observed SNP differences in comparison to the focus sequence and the coverage of the viral genome used for the pairwise comparison in each case (i.e. nucleotide other than ‘N’ recorded for both focus and comparison sequence). The algorithm will also return lists of all sequences from the same institution but not same unit within the past 3 weeks that fall within the definition of a close sequence match and all sequences from the community reference set sampled within the last 6 weeks that fall within the definition of a close sequence match; with observed SNP difference and viral genome coverage of the pairwise comparison against the focus sequence again recorded in each case.



