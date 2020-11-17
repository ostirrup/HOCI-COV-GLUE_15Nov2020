# HOCI Reporting Tool

## Note

This is a static clone of the development repository for this software project. The Git history does not reflect code authorship largely by Joshua Singer and Asif Tamuri.

## Installation

First you need to ensure you have access to the CLIMB GLUE VM and a personal GLUE instance on it. Follow the instructions here:

[https://docs.covid19.climb.ac.uk/cov-glue/climb-glue.html](https://docs.covid19.climb.ac.uk/cov-glue/climb-glue.html)

Note: you will need to install the `coguk_cov_glue` dataset. 

Next you need to `git clone` the `HOCI-COV-GLUE` repostiory into a directory on that server. I suggest you 
clone it inside `~/gluetools/projects`.

Now cd to the directory `HOCI-COV-GLUE`, start GLUE using `gluetools.sh` and run the GLUE command `run file hociExtension.glue`:

```
Mode path: /
GLUE> run file hociExtension.glue
```

This loads all the HOCI tool processing and reporting logic. You can quit out of GLUE back to bash using the `quit` GLUE command.

## Updating the HOCI tool

When you need to update to a later version of the HOCI tool, first use the bash command 

```
$ installGlueProject.sh coguk_cov_glue
```
to load the latest COG-UK CoV-GLUE into your GLUE instance. Then `git pull` the latest version of the `HOCI-COV-GLUE` repository, and finally start GLUE and run the GLUE command `run file hociExtension.glue` as before from within that directory. 

## Loading your data

At this point the HOCI tool is in place but it doesn't have any of your HOCI site data loaded. In the repository there is an artificial data set. You can use this to run the tool, and also as an example when creating your own dataset. It contains 3 files, the `hociSite.json` file, the HOCI site sequences, and their metadata. To load this data set, cd to directory `HOCI-COV-GLUE/test_data/working_1` and start GLUE using `gluetools.sh`. You need to run the following GLUE commands:

```
Mode path: /
GLUE> project cov
Mode path: /project/cov
GLUE> module hociProcessSite invoke-function processSite
```
The command `project cov` navigates the command line interpreter into the `/project/cov` mode path, i.e. the CoV-GLUE project, where everything we need is located. The `processSite` command loads in the HOCI site data. It's expecting the 3 files with correct names to be in the current directory. 

## Generating a report
Now your data is loaded, you can generate a report. In mode path `/project/cov` you would execute this:

```
Mode path: /project/cov
GLUE> module hociGenerateReport invoke-function generateReport BIRM-04GA5
```
The `generateReport` command requests the generation of a HOCI report for sequence with ID `BIRM-04GA5`. It will generate the following files:

1. `BIRM-04GA5_hociReport.json` JSON file designed to be consumed programmatically, it contains the data which is used to generate the summary and detailed HTML reports.
1. `BIRM-04GA5_hociSummary.html` HTML report aimed at the institution's Infection Prevention and Control team. 
1. `BIRM-04GA5_hociDetailed.html` HTML report aimed at the site bioinformatician / clinical lead.

You can actually supply a comma-separated list of IDs (without spaces) to generateReport if you would like to generate reports for multiple samples with one command. 

## Updating your data
When you receive new sequences and metadata, you can append these to the `hociSiteSequences.fasta` and `hociSiteMetadata.txt` files respectively, and then run the `updateSite` command. 

```
Mode path: /project/cov
GLUE> module hociProcessSite invoke-function updateSite
```

The `updateSite` function works in a similar way to `processSite` except that if it encounters IDs in the FASTA or metadata files of samples that are already loaded, these are skipped. It is therefore a quicker method of updating the database with new sequences. The `updateSite` function will not change any aspect of samples that are already loaded, e.g. revised nucleotides or changed sample date. If you need to correct any aspect of samples that have already been loaded, you must wipe and reload your dataset (see below). 


## Resetting

If you need to reset your dataset, you can run this command first (again in mode path `/project/cov`). It will remove all the data that was loaded with `processSite` or `updateSite`. 

```
Mode path: /project/cov
GLUE> module hociProcessSite invoke-function resetSite
```

An alternative way to reset the dataset, which may be quicker, is to follow the steps for "Updating the HOCI tool" above.

## Changing load/save path

GLUE has its own concept of working directory, the "load/save path". When you start GLUE this defaults to the bash working directory. You can change it within GLUE using e.g. `console change load-save-path ../test_data/working_2`. 

