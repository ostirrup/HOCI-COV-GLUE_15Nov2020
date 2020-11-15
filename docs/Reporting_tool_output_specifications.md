# Reporting tool summary report specifications
### COG-UK HOCI project

Owner: a.tamuri@ucl.ac.uk

## Overview
The purpose of this document is to provide an overview of the dynamic generation of the one-page summary report for each focus sequence. The content of the summary report is based on information provided in the sequence metadata file and the outputs of the sequence matching and probability score algorithm (each described in separate specification documents).

This document explains the logic and design of the summary report in summarising relevant metadata and algorithm outputs, but instructions regarding how to create a summary report in any specific case are given elsewhere.

## Focus sample summary
The following focus sequence metadata items and other basic information at listed at the top of the report where available in all cases:
* __Report date__: Date on which the summary report was generated
* __SampleID__: Local lab ID for the sequence (`sendersampleID`)
* __Sample date__: Sample date for the focus sequence (`sampleDate`)
* __COG-UK HOCI ID__: ID code specific to the COG-UK HOCI study (`hociID`)
* __COG-UK ID__: COG-UK sequence ID (`sequenceID`)
* __Admission date__: Date of hospital admission of the focus patient (`admissionDate`)
* __Unit__: Unit/ward at time sample obtained (`unitID`)
* __Previous unit(s)__: Optional metadata field listing other unit/ward locations for the focus patient in the 14 days prior to sample date (`unitHistoryPre`)
* __Hospital__: Hospital of focus patient (`institutionID`)
* __Reporting hub__: This field can be populated in the JSON file after the sequence matching and probability algorithm has been run and before creation of an html/PDF summary report, the JSON key is `hociReport.focusSequence.reportingHub`.
* __Reported by__: This field can be populated in the JSON file after the sequence matching and probability algorithm has been run and before creation of an html/PDF summary report, the JSON key is `hociReport.focusSequence.reportedBy`
* __Symptomatic__: Whether focus patient was recorded as symptomatic (`symptomatic`), and date of symptom onset if so (`symptomOnsetDate`)

## Probability summary categories
The sequence matching and probability score algorithm generates probability estimates for the source of infection for the focus patient being from the current unit/ward, from elsewhere in the hospital, from the community (pre-admission) or from a visitor. These probability estimates always sum to 1.

In the summary report, probability estimates for each source of infection are categorised using the following levels:
* 0-30%: low
* 30-50%: moderately low
* 50-70%: probable
* 70-85%: high
* 85-100%: very high

For clarity of presentation and communication, probability categories will not always be displayed in the summary report for all four potential sources of infection (i.e. ward/unit, elsewhere in hospital, visitor, or community). Special handling rules for specific situations are described below.

## Close sequence matches within the same unit and/or hospital
Where close sequence matches have been identified within the unit reference set and/or the institution reference set, the most relevant will be summarised in a tabular format including the following information:
* __Number__: This numbering just relates to the graph displayed in the lower section of the report.
* __Sample ID__: Local lab ID for the sequence (`sendersampleID`)
* __COG-UK ID__: COG-UK sequence ID (`sequenceID`)
* __Unit__: Unit/ward at time sample obtained (`unitID`), not listed for those from the same unit as the focus sequence
* __Other unit(s)__: List of units prior to and after sampling (`unitHistoryPre` and `unitHistoryPost`) where included in the sequence metadata. Units overlapping with the focus sample's units are listed first and underlined.
* __Sample date__: Sample date for the sequence (`sampleDate`)
* __Admission date__: Date of hospital admission of the patient (`admissionDate`)
* __Type__: Patient or healthcare worker (HCW)

The maximum number of close sequence matches that can be listed on the one-page summary report is 10 (for the combined sum of unit-level and institution-level matches). If the number of ward-level matches is _n_>5 and the total number of close sequence matches is _N_>10, then the number of ward-level matches is truncated at 5+max((5-(N-n)),0). If there are over ten close sequence matches in total, then the following message is displayed "Over 10 close matches; see detailed report for further information".

Within the each the sets of unit-level and institution-level close sequence matches, ordering and priority for inclusion within the available slots is determined by the following set of criteria (in decreasing order of importance):

1. Number of SNPs relative to Wuhan strain present in comparison sequence but absent in focus sequence (fewer = higher priority)
2. Number of SNPs relative to Wuhan strain present in focus sequence but absent in comparison sequence (fewer = higher priority)
3. Whether comparison sequence is from a HCW (HCWs listed first)
4. HCAI status of comparison sequence (priority order: definite, probable, indeterminate, otherwise)
5. Samples from the past before samples in future
6. Samples from within the two weeks prior to focus sequence sample date before others
7. Number of units overlapping with focus sample's units

## Report messages for specific output combinations

### No close sequence matches on unit/ward
If there are no close sequence matches to the focus sequence on their current unit/ward, then no probability category is reported for this potential infection source (the algorithm returns a zero probability in such cases, which could be misleading given uncertainty over screening and sequencing coverage). The message "No matches from within unit" is displayed. The probability score category for infection from elsewhere in the hospital is provided in such cases.

### No close sequence matches elsewhere in hospital
If there are no close sequence matches to the focus sequence elsewhere in the hospital, then no probability category is reported for this potential infection source. The message "No matches elsewhere in hospital" is displayed.

### No evidence of transmission within unit or hospital for probable or definite HCAI
If the estimated probability of community-acquired infection from the algorithm is >50%, but the interval from admission to symptom onset (if recorded) or sample date is ≥8 days, then the following message is displayed in place of the estimate probability of community-acquired infection "This is a probable/definite HCAI based on admission date, but we have not found genetic evidence of transmission within the hospital".

### Probable unit- or hospital-acquired infection with source unclear
If the posterior probability of unit-acquired infection and the posterior probability of infection from a source elsewhere in the hospital are each estimated to be  <50%, but the sum of these two posterior probabilities is ≥50%, then the following message is displayed "Overall, this is a probable unit- or institution-acquired infection with source unclear".

## Timeline graph
The timeline graph provides a visual representation of available sequences from the same unit/ward and the same institution/hospital as the focus sequence in the period from 3 weeks prior to their sample date to 1 week after. The key indicates which sequences are close matches to the focus sequence, and the numbering corresponds to that in the tabular summary of most relevant close sequence matches.

