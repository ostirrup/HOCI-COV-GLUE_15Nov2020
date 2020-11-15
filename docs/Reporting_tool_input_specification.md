# Reporting tool input specifications
### COG-UK HOCI project

Owner: josh.singer@glasow.ac.uk

## Overview
The purpose of this document is to capture in detail what data the HOCI site bioinformatician needs to supply to the tool. It is the responsibility of the site team, including the site bioinformatician to select which sequences may be relevant to the reporting tool, obtain the sequence data and metadata, format it according to this specification, and add it to the tool.

Each HOCI site will supply to the tool a set of site sequences+metadata at the start of the trial, sampled up to 42 days before the trial starts. The maximum number of sequences which may be supplied at the start of the trial is 500. Additionally the HOCI site will add new sequences+metadata, with up to 150 new sequences added per week.

## Sequence categories
There are three categories of HOCI site sequence. The category affects what the metadata field values may take and whether they are mandatory.  
- **Community-sampled** sequences any sequences not sampled at a healthcare institution
- **Institution-sampled** sequences any sequence sampled at a healthcare institution. While a specific HOCI site may well be sampling from a single institution for the trial, the tool does allow multiple institutions to be covered by a HOCI site.
- **Focus sequences** a subset of institution-sampled sequences that meet certain metadata requirements (see below). The tool can generate reports only for focus sequences. 

Sequences of all three types will be added to the tool in the same way. At any point, the site bioinformatician can request an analysis report to be generated for a specific sequenceID. If the sequence in question has been added and is a focus sequence, an analysis report will be generated. Details of how to perform these tasks will be documented elsewhere.

## Sequence data requirements

The HOCI site sequences must have a minimum coverage of 90% of the coding-spanning region of the genome (nucleotides 266 to 29674 on the Wuhan-Hu-1 reference sequence). Anything lower than this will be rejected by the tool. N characters are permitted but count as no coverage, but ambiguity characters (e.g. R, Y, S) are permitted and count as coverage. The HOCI site sequences must be supplied in a single unaligned FASTA file named hociSiteSequences.fasta. Each FASTA header must exactly match one sequenceID in the metadata, and each metadata row sequenceID must match one FASTA header. All IUPAC FASTA characters are accepted. Gap characters are permitted and will be ignored.

## Metadata requirements

### Formatting
Metadata is supplied in a single file named hociSiteMetadata.txt in tab-delimited text format. Line breaks must be in the UNIX style. All fields are case-sensitive. Each column has a data type specifying the format in detail. The metadata data types are:

- ID: any combination of alphanumeric characters, hyphen and underscore, at least 3 and at most 20 characters. ID values must start with an alpha character. ID values must be unique within a HOCI site and consistent across that site and through time. For example the Glasgow HOCI site may decide that ID “Hospital_1” is always used to represent the QEUH. 

- DATE: format: 06-MAY-2020. Partial dates such as APR-2020 are not permitted. Upper and lower case month permitted, year may be e.g. 20 instead of 2020.

- OUTER_POSTCODE: e.g. G61, W1A etc.

- BOOLEAN: true or false, upper or lower case accepted.

- ENUM: one of a fixed set of lower case string values, using underscores if necessary. The fixed set is specified in the column definition.


Some values are permitted to be null; null values are represented in the metadata file by the empty string.

## Metadata content

This data describes the metadata file columns, their data types, and value constraints for each category of sequence. The notes column indicates the semantics of the values, contact the document owner if this is not clear. 

| Column header | Data type | Community-sampled sequences | Institution-sampled sequences | Focus sequences | Notes |
| ------------- | --------- | --------------------------- | ----------------------------- | --------------- | ----- |
| **sequenceID** | ID | Mandatory | Mandatory | Mandatory | Must be equal to the COG-UK biosample ID if a sequence from the same sample is on COG-UK CLIMB. |
| **samplingCentreID** | ID | Optional | Must be null | Must be null | For community sequences, the testing or other centre where the sample was taken. |
| **institutionID** | ID | Must be null | Mandatory | Mandatory | Healthcare institution where sample was taken |
| **unitID** | ID | Must be null | Optional | Mandatory | Ward/ICU etc where patient was located at point of sample |
| **isHealthcareWorker** | BOOLEAN | Optional | Mandatory | Mandatory | Whether sample is from a healthcare worker |
| **hcwWorkplaceID** | ID | Mandatory if healthcare worker, null otherwise | Mandatory if healthcare worker, null otherwise | Mandatory if healthcare worker, null otherwise | The workplace of the healthcare worker, matching institutionIDs as appropriate |
| **residentialOuterPostcode** | OUTER\_POSTCODE | Optional | Optional | Mandatory | First half of the home address  postcode. |
| **sampleDate** | DATE | Mandatory | Mandatory | Mandatory | When sample was taken |
| **admissionStatus** | ENUM: not_a_patient / inpatient / outpatient / a_and_e_patient  | Must be null | Optional | Must be “inpatient” | Describes patient’s attendance at hospital |
| **admissionDate** | DATE | Must be null | Mandatory if inpatient, else null | Mandatory | if inpatient, else null | Date of admission for inpatients. |
| **symptomatic** | BOOLEAN | Optional | Optional | Mandatory | Whether individual had COVID19 symptoms |
| **symptomOnsetDate** | DATE | Optional | Optional | Optional | When symptoms started |
| **visitorsOnWard** | BOOLEAN | Must be null | Optional | Mandatory | Visitors allowed on ward at time of sampling? |
| **unitHistoryPre** | Pipe-delimited ID values | Must be null | Optional | Optional | All unit locations for the patient within ≤14 days prior to their sampleDate. The format of unit locations should match exactly that for the unitID field, with all values concatenated into a single string using a pipe character as the delimiter and no white space. |
| **unitHistoryPost** | Pipe-delimited ID values | Must be null | Optional | Must be null | All unit locations for the patient within ≤14 days after their sampleDate. The format of unit locations should match exactly that for the unitID field, with all values concatenated into a single string using a pipe character as the delimiter and no white space. |

## Site set-up file

Each site requires a `hociSite.json` set-up file in order to run the sequence reporting tool. This file lists the study site name, one or more separate institutions (i.e. individual hospital(s), with more than one if split up for sequence analysis) nested within that site and units (e.g. wards) nested within each institution. These need to match the `institutionID` and `unitID` values as used in the sequence meta-data. Ward-types can be optionally specified for each `unitID` in this file (bay, single room or nightingale),  although the type defaults to bay if this is missing.

The hociSite.json file also requires specification of the two geographic weighting parameters for the community transmission model (β and τ as described in `Reporting_tool_algorithm_specifications.md`). If no local tuning is possible, reasonable default values are β=0.12 and τ=0.22 (based on analysis of sequence data from Glasgow and Sheffield from March-May 2020).

