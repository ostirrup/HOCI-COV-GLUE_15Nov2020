
// maximum(inclusive) threshold of pairwise SNP differences to consider a close match
var maxSnpDifferencesForMatch = 2;

// maximum(inclusive) threshold of SNP missing data (N in FASTA) to consider a close match
var maxSnpMissingForMatch = 999999; // currently this feature is effectively turned off as per algorithm spec. 

// prior probability of infection from visitor (when allowed) given post-admission infection
var Pv = 0.2; // a range of 0.1 - 0.3 was proposed on teleconference 8/6/2020
// Proportion of asymptomatic test +ve cases that will never develop symptoms
var Pa = 0.4; // suggested by https://www.acpjournals.org/doi/10.7326/M20-3012
// Average delay (days) in asymptomatic test +ves who go on to develop symptoms
var cSymptomDelay = 3; // advice from Oliver, confirmed by Judy on teleconference 8/6/2020


function generateReport(indexSequenceIDsString) {
	
	checkGlueVersion();
	
	var sourceName = "cov-hoci";
	
	var hociSite = loadSiteJson();

	var indexSequenceIDs = indexSequenceIDsString.trim().split(",");
	
	_.each(indexSequenceIDs, function(indexSequenceIDUntrimmed) {
		var indexSequenceID = indexSequenceIDUntrimmed.trim();
		var focusSequence = checkAndRetrieveFocusSequence(sourceName, indexSequenceID);
		ambiguousSites(sourceName, focusSequence);
		ensureLineage(sourceName, focusSequence);

		// fields required only for report generation - freemarker doesn't have good support for creating objects
		focusSequence.days_admission_to_onset = daysAdmissionToOnset(focusSequence);
		focusSequence.all_units = makeListOfUnits(focusSequence.unit_id, focusSequence.unit_history_pre, null)

		hociSnps = findHociSnps(sourceName);
		snpsForSequence(sourceName, focusSequence, hociSnps);

		var unitReferenceSet = selectUnitReferenceSet(sourceName, indexSequenceID);
		_.each(unitReferenceSet, function(seqObj) { 
			ambiguousSites(sourceName, seqObj);
			ensureLineage(sourceName, seqObj);
			normaliseCoverage(seqObj);
			snpsForSequence(sourceName, seqObj, hociSnps);
			snpDifferencesFromFocus(sourceName, focusSequence, seqObj);
			calculateGeographicDistance(focusSequence, seqObj);
			calculateIsCloseMatch(seqObj);
	        var overlapping = getUnitOverlap(seqObj, focusSequence);
	        seqObj.matching_units = overlapping[0];
	        seqObj.unmatched_units = overlapping[1];
		});
		//glue.log("FINEST", "unitReferenceSet", unitReferenceSet);

		var institutionReferenceSet = selectInstitutionReferenceSet(sourceName, indexSequenceID);
		_.each(institutionReferenceSet, function(seqObj) {
			ambiguousSites(sourceName, seqObj);
			ensureLineage(sourceName, seqObj);
			normaliseCoverage(seqObj);
			snpsForSequence(sourceName, seqObj, hociSnps); 
			snpDifferencesFromFocus(sourceName, focusSequence, seqObj);
			calculateGeographicDistance(focusSequence, seqObj);
			calculateIsCloseMatch(seqObj);
			var overlapping = getUnitOverlap(seqObj, focusSequence);
			seqObj.matching_units = overlapping[0];
			seqObj.unmatched_units = overlapping[1];
		});
		//glue.log("FINEST", "institutionReferenceSet", institutionReferenceSet);

		var communityReferenceSet = selectCommunityReferenceSet(sourceName, indexSequenceID);
		_.each(communityReferenceSet, function(seqObj) { 
			ambiguousSites(sourceName, seqObj);
			ensureLineage(sourceName, seqObj);
			normaliseCoverage(seqObj);
			snpsForSequence(sourceName, seqObj, hociSnps); 
			snpDifferencesFromFocus(sourceName, focusSequence, seqObj);
			calculateIsCloseMatch(seqObj);
			calculateGeographicDistance(focusSequence, seqObj);
			calculateGeographicWeighting(hociSite, seqObj);
		});
		//glue.log("FINEST", "communityReferenceSet", communityReferenceSet);

		delete focusSequence.snpsPresent;
		delete focusSequence.snpsMissing;

		var statistics = 
			calculateStatistics(hociSite, focusSequence, unitReferenceSet, institutionReferenceSet, communityReferenceSet);
		
		//glue.log("FINEST", "stats", stats);
		
		var hociExtensionVersion = 
			glue.command(["show","extension-setting", "hoci_cov", "extension-version"]).projectShowExtensionSettingResult.extSettingValue;
		var cogukExtensionVersion = 
			glue.command(["show","extension-setting", "coguk_cov", "extension-version"]).projectShowExtensionSettingResult.extSettingValue;
		var projectVersion = 
			glue.command(["show","setting","project-version"]).projectShowSettingResult.settingValue;
		var glueVersion = 
			glue.command(["glue-engine","show-version"]).glueEngineShowVersionResult.glueEngineVersion;
		
		//glue.log("FINEST", "focusSequence", focusSequence);

		// post-processing: sort the unit and institution matches
	    unitReferenceSet.sort(function(s1, s2) {return sortSamples(s1, s2, focusSequence)});
		institutionReferenceSet.sort(function(s1, s2) {return sortSamples(s1, s2, focusSequence)});

		// post-processing: strip out the outer postcode fields - can't be downloaded from climb
		_.each(unitReferenceSet, function(seqObj) {
		    delete seqObj['residential_outer_postcode'];
		});
		_.each(institutionReferenceSet, function(seqObj) {
			delete seqObj['residential_outer_postcode'];
		});
		_.each(communityReferenceSet, function(seqObj) {
			delete seqObj['residential_outer_postcode'];
	    });

		var reportObj = { hociReport : {
			hociSiteId: hociSite["site-id"],
			hociSiteDisplayName: hociSite["site-display-name"],
			cogukExtensionVersion: cogukExtensionVersion,
			hociExtensionVersion: hociExtensionVersion,
			projectVersion: projectVersion,
			glueVersion: glueVersion,
			reportGenerationDate: jsDateToGlueDate(new Date()),
			focusSequence: focusSequence,
			unitReferenceSet: unitReferenceSet,
			institutionReferenceSet: institutionReferenceSet,
			communityReferenceSet: communityReferenceSet,
			statistics: statistics,
		}};

		//glue.log("FINEST", "reportObj", reportObj);
		var reportJsonString = JSON.stringify(reportObj, null, 2);
		
		var jsonFileName = indexSequenceID+"_hociReport.json";
		glue.command(["file-util", "save-string", reportJsonString, jsonFileName]);
		glue.log("INFO", "Wrote HOCI report JSON: "+jsonFileName);
		
		var summaryFileName = indexSequenceID+"_hociSummary.html";
		glue.inMode("module/hociSummaryReportTransformer", function() {
			glue.command({"transform-to-file" : {
				commandDocument: reportObj,
				outputFile: summaryFileName
			}});
		});
		glue.log("INFO", "Wrote HOCI summary report HTML: "+summaryFileName);

		var detailedFileName = indexSequenceID+"_hociDetailed.html";
		glue.inMode("module/hociDetailedReportTransformer", function() {
			glue.command({"transform-to-file" : {
				commandDocument: reportObj,
				outputFile: detailedFileName
			}});
		});
		glue.log("INFO", "Wrote HOCI detailed report HTML: "+detailedFileName);
	});
}

function sortSamples(sample1, sample2, focus_sample) {
	// if order should be sample1 then sample2 -> return -1
	// if order should be sample2 then sample1 -> return 1
	// if no change, return 0

	// sort close matches before distant matches
	if (sample1.isCloseMatch && !sample2.isCloseMatch) return -1;
	if (!sample1.isCloseMatch && sample2.isCloseMatch) return 1;

	// sort by snp distance: first snpAbsentInFocus, then focusSnpsAbsents (both fields are arrays)
	if (sample1.snpsAbsentInFocus.length < sample2.snpsAbsentInFocus.length) return -1;
	if (sample1.snpsAbsentInFocus.length > sample2.snpsAbsentInFocus.length) return 1;
	if (sample1.focusSnpsAbsent.length < sample2.focusSnpsAbsent.length) return -1;
	if (sample1.focusSnpsAbsent.length > sample2.focusSnpsAbsent.length) return 1;

	// sort hcw samples first
	if (sample1.is_healthcare_worker && !sample2.is_healthcare_worker) return -1;
	if (sample2.is_healthcare_worker && !sample1.is_healthcare_worker) return 1;

	// sort by whether comparison sequence is a HOCI
	function getHcaiStatus(sample) {
		// ordering rules:
		// definite HCAIs (t > 14 days) -> 1
		// probable HCAIs (t > 8 days) -> 2
		// indeterminate HCAIs (t > 3 days) -> 3
		// otherwise, non-HOCI -> 4
		var days = daysAdmissionToOnset(sample);

		if (days >= 14) return 1;  // definite HCAI
		if (days >= 8) return 2;  // probable HCAI
		if (days >= 3) return 3;  // indeterminate HCAI
		return 4;  // non-hoci
	}

	var hcai1 = getHcaiStatus(sample1);
	var hcai2 = getHcaiStatus(sample2);

	if (hcai1 < hcai2) return -1;
	if (hcai1 > hcai2) return 1;

	// samples within previous 2 weeks prior to focus sample sorted before others
	var fd = new Date(focus_sample.sample_date);
	var d1 = new Date(sample1.sample_date);
	var d2 = new Date(sample2.sample_date);
	var msPerDay = 24 * 60 * 60 * 1000;

	var daysAgo1 = (fd - d1)/msPerDay;
	var daysAgo2 = (fd - d2)/msPerDay;

	// samples from the past sorted before samples in the future
	if (daysAgo1 > 0 && daysAgo2 < 0) return -1;
	if (daysAgo1 < 0 && daysAgo2 > 0) return 1;

	// samples from within 2 weeks sorted before others
	if (daysAgo1 <= 14 && daysAgo2 > 14) return -1;
	if (daysAgo1 > 14 && daysAgo2 <= 14) return 1;

	// i.e. both samples within last 2 weeks - no change in ordering

	// sort those sharing ward with focus sample before others
	var focus_units = makeListOfUnits(focus_sample.unit_id, focus_sample.unit_history_pre, null);
	var sample1_units = makeListOfUnits(sample1.unit_id, sample1.unit_history_pre, sample1.unit_history_post);
	var sample2_units = makeListOfUnits(sample2.unit_id, sample2.unit_history_pre, sample2.unit_history_post);

	var sample1_unit_match = _.intersection(focus_units, sample1_units);
	var sample2_unit_match = _.intersection(focus_units, sample2_units);

	if (sample1_unit_match.length > sample2_unit_match.length) return -1;
	if (sample1_unit_match.length < sample2_unit_match.length) return 1;

	//no change in order
	return 0;
}

function makeListOfUnits(unit_id, unit_history_pre, unit_history_post) {
    // returns a single list of units from all the unit fields of a sample
	var unit_list = unit_history_pre !== null ? unit_history_pre.split("|") : [];
	unit_list = unit_list.concat(unit_history_post !== null ? unit_history_post.split("|") : []);
	if (unit_id !== null) unit_list.push(unit_id);
	return unit_list;
}

function getUnitOverlap(sample1, sample2) {
	// ignore the current unit of the sequence because this is handled separately in the summary report
	var sample1_units = makeListOfUnits(null, sample1.unit_history_pre, sample1.unit_history_post);
	var sample2_units = makeListOfUnits(sample2.unit_id, sample2.unit_history_pre, sample2.unit_history_post);
	return [_.intersection(sample1_units, sample2_units), _.difference(sample1_units, sample2_units)];
}

function normaliseCoverage(seqObj) {
	seqObj.csr_coverage = toFixed(seqObj.genome_coverage); 
}


function calculateMatchProportion(referenceSet) {
	if(referenceSet.length == 0) {
		return 0.0;
	}
	var numInSetWithCloseMatch = _.filter(referenceSet, function(seqObj) {return seqObj.isCloseMatch == true;}).length;
	return numInSetWithCloseMatch / referenceSet.length;
}

function calculateCommunityMatchProportion(referenceSet) {
	if(referenceSet.length == 0) {
		return 0.0;
	}
	var weightedMatchSum = 0.0;
	var sumOfWeights = 0.0;
	_.each(referenceSet, function(seqObj) {
		sumOfWeights += seqObj.geographicWeighting;
		if(seqObj.isCloseMatch == true) {
			weightedMatchSum += seqObj.geographicWeighting;
		}
	});
	return weightedMatchSum / sumOfWeights;
}


function toFixed(value, precision) {
    var precision = precision || 0,
        power = Math.pow(10, precision),
        absValue = Math.abs(Math.round(value * power)),
        result = (value < 0 ? '-' : '') + String(Math.floor(absValue / power));

    if (precision > 0) {
        var fraction = String(absValue % power),
            padding = new Array(Math.max(precision - fraction.length, 0) + 1).join('0');
        result += '.' + padding + fraction;
    }
    return result;
}

function findHociSnps(sourceName) {
	return glue.tableToObjects(glue.command(["list", "custom-table-row", "cov_nt_mutation", 
		"-w", "cov_nt_mutation_sequence.sequence.source.name = '"+sourceName+"'", 
		"-s", "reference_nt",
		"id", "reference_nt"]));
}

function snpsForSequence(sourceName, seqObj, hociSnps) {
	seqObj.snpsPresent = {};
	var snpList = glue.getTableColumn(glue.command(["list", "custom-table-row", "cov_nt_mutation_sequence", 
		"-w", "sequence.sequenceID = '"+seqObj["sequence.sequenceID"]+"' and sequence.source.name = '"+sourceName+"'", 
		"-s", "cov_nt_mutation.reference_nt",
		"cov_nt_mutation.id"]), "cov_nt_mutation.id");
	seqObj.snps = [];
	_.each(snpList, function(snp) {
		seqObj.snpsPresent[snp] = "snp_present";
		seqObj.snps.push(snp);
	});
	seqObj.snpsMissing = {};
	
	var missingBlocks = glue.tableToObjects(glue.command(["list", "custom-table-row", "hoci_missing_nt_block", 
		"-w", "sequence.sequenceID = '"+seqObj["sequence.sequenceID"]+"' and sequence.source.name = '"+sourceName+"'", 
		"-s", "ref_start",
		"ref_start", "ref_end"]));
	
	//glue.logInfo("sequenceID: "+seqObj["sequence.sequenceID"]);
	// glue.logInfo("missingBlocks", missingBlocks);
	// glue.logInfo("hociSnps", hociSnps);
	
	_.each(hociSnps, function(hociSnp) {
		while(missingBlocks.length > 0 && missingBlocks[0].ref_end < hociSnp.reference_nt) {
			missingBlocks.shift();
		}
		if(missingBlocks.length == 0) {
			return;
		}
		if(missingBlocks[0].ref_start <= hociSnp.reference_nt && missingBlocks[0].ref_end >= hociSnp.reference_nt) {
			seqObj.snpsMissing[hociSnp.id] = "data_missing";
		}
	});
}

function snpDifferencesFromFocus(sourceName, focusSeqObj, seqObj) {
	var snpLocations = {};
	seqObj.focusSnpsAbsent = [];
	seqObj.focusSnpsMissing = [];
	
	var focusAlmtRow = alignmentRow(sourceName, focusSeqObj["sequence.sequenceID"]);
	var seqAlmtRow = alignmentRow(sourceName, seqObj["sequence.sequenceID"]);
	
	// for each SNP in focusSeqObj
	_.each(_.keys(focusSeqObj.snpsPresent), function(snp) {
		var snpLocation = snp.replace(/[A-Z]/g, "");
		if(seqObj.snpsPresent[snp] == null) {
			if(seqObj.snpsMissing[snp] == null) {
				// seqObj has coverage and some other non-overlapping value
				if(!overlappingAmbig(snpLocation, focusAlmtRow, seqAlmtRow)) {
					seqObj.focusSnpsAbsent.push(snp);
				}
				snpLocations[snpLocation] = "coverage";
			} else {
				// seqObj has no coverage
				seqObj.focusSnpsMissing.push(snp);
				snpLocations[snpLocation] = "no_coverage";
			}
		} else {
			// seqObj has coverge and same value
			snpLocations[snpLocation] = "coverage";
		}
	});
	seqObj.snpsAbsentInFocus = [];
	seqObj.snpsMissingInFocus = [];
	// for each SNP in seqObj
	_.each(_.keys(seqObj.snpsPresent), function(snp) {
		var snpLocation = snp.replace(/[A-Z]/g, "");
		if(focusSeqObj.snpsPresent[snp] == null) {
			if(focusSeqObj.snpsMissing[snp] == null) {
				// focusSeqObj has coverage and some other value
				if(!overlappingAmbig(snpLocation, focusAlmtRow, seqAlmtRow)) {
					seqObj.snpsAbsentInFocus.push(snp);
				}
				snpLocations[snpLocation] = "coverage";
			} else {
				// focusSeqObj has no coverage 
				seqObj.snpsMissingInFocus.push(snp);
				snpLocations[snpLocation] = "no_coverage";
			}
		} else {
			// focusSeqObj has coverage and same value
			snpLocations[snpLocation] = "coverage";
		}
	});
	var snpLocationPairs = _.pairs(snpLocations);
	seqObj.snpLocations = _.map(snpLocationPairs, function(slp) {return { location: slp[0], coverage:slp[1]};});
	seqObj.numSnpLocations = snpLocationPairs.length;
	seqObj.numSnpLocationsWithInsufficientCoverage = _.filter(snpLocationPairs, function(slp) {return slp[1] == "no_coverage";}).length;
	
	delete seqObj.snps;
	delete seqObj.snpsPresent;
	delete seqObj.snpsMissing;
}

function overlappingAmbig(snpLocation, almtRow1, almtRow2) {
	var char1 = almtRow1[snpLocation-266];
	var char2 = almtRow2[snpLocation-266];
	var subChars1 = [char1];
	if("RYKMSWBDHV".indexOf(char1) >= 0) { // ambiguity code.
		subChars1 = ambigCharToSubChars[char1];
	}
	var subChars2 = [char2];
	if("RYKMSWBDHV".indexOf(char2) >= 0) { // ambiguity code.
		subChars2 = ambigCharToSubChars[char2];
	}
	return _.intersection(subChars1, subChars2).length > 0;
}


function calculateIsCloseMatch(seqObj) {
	if( (
			seqObj.focusSnpsAbsent.length + seqObj.snpsAbsentInFocus.length <= maxSnpDifferencesForMatch
		) && (
			seqObj.focusSnpsMissing.length + seqObj.snpsMissingInFocus.length <= maxSnpMissingForMatch
		)
	) {
		seqObj.isCloseMatch = true;
	} else {
		seqObj.isCloseMatch = false;
	}
	seqObj.snpDistanceFromFocus = seqObj.focusSnpsAbsent.length + seqObj.snpsAbsentInFocus.length;
}


function daysAdmissionToOnset(sequence) {
	if (sequence.admission_date == null) {
		glue.log("WARNING", "Can't get daysAdmissionToOnset because no admission_date for", sequence["sequence.sequenceID"]);
		return 0;
	}

	var assumedSymptomOnsetDate;
	if(sequence.symptom_onset_date == null) {
		assumedSymptomOnsetDate = sequence.sample_date;
	} else {
		assumedSymptomOnsetDate = sequence.symptom_onset_date;
	}

	var t; // tAdmissionToSymptomOnset;
	if(glueDateToJsDate(assumedSymptomOnsetDate) < glueDateToJsDate(sequence.admission_date)) {
		t = 0;
	} else {
		t = glueDateDifferenceDays(assumedSymptomOnsetDate, sequence.admission_date);
	}
	return t;
}


function calculatePriorProbability(focusSequence) {
	var priorProbability;

	var t = daysAdmissionToOnset(focusSequence); // tAdmissionToSymptomOnset;

	if(focusSequence.symptomatic) {
		priorProbability = cdf(t);
	} else {
		priorProbability = ( Pa * cdf(t) ) + ( ( 1 - Pa ) * cdf( t + cSymptomDelay ) );
	}
	return priorProbability;
}

function calculateStatistics(hociSite, focusSequence, unitReferenceSet, institutionReferenceSet, communityReferenceSet) {
	var Pu_2 = getPu2ForInstitutionUnitID(hociSite, focusSequence.institution_id, focusSequence.unit_id);
	var priorProbability = calculatePriorProbability(focusSequence);
	var unitMatchProportion = calculateMatchProportion(unitReferenceSet);
	var institutionMatchProportion = calculateMatchProportion(institutionReferenceSet);
	var communityMatchProportion = calculateCommunityMatchProportion(communityReferenceSet);
	var posteriorUnitInfection;
	var posteriorInstitutionInfection;
	var posteriorVisitorInfection;
	var posteriorNotes = [];
	if (unitMatchProportion > 0 || institutionMatchProportion > 0 || communityMatchProportion > 0) {
		if(focusSequence.visitors_on_ward == true) {
			var Pu = Pu_2 * (1 - Pv); 
			var post_prob_denom = ( (1 - priorProbability) * communityMatchProportion ) + 
				( priorProbability * Pu * unitMatchProportion ) + 
				( priorProbability * Pv * communityMatchProportion ) + 
				( priorProbability * ( ( 1 - Pu ) - Pv) * institutionMatchProportion );
			posteriorUnitInfection = ( priorProbability * Pu * unitMatchProportion ) / post_prob_denom;
			posteriorInstitutionInfection = ( priorProbability * ( ( 1 - Pu ) - Pv) * institutionMatchProportion ) / post_prob_denom;
			posteriorVisitorInfection = ( priorProbability * Pv * communityMatchProportion ) / post_prob_denom;
		} else {
			var post_prob_denom = ( (1 - priorProbability) * communityMatchProportion ) + 
				( priorProbability * Pu_2 * unitMatchProportion ) + 
				( priorProbability * (1 - Pu_2) * institutionMatchProportion );
			posteriorUnitInfection = ( priorProbability * Pu_2 * unitMatchProportion ) / post_prob_denom;
			posteriorInstitutionInfection = ( priorProbability * (1 - Pu_2) * institutionMatchProportion ) / post_prob_denom;
			posteriorVisitorInfection = 0.0;
		}
	} else {
		if(focusSequence.visitors_on_ward == true) {
		var Pu = Pu_2 * (1 - Pv);
		posteriorUnitInfection = priorProbability * Pu;
		posteriorInstitutionInfection = priorProbability * ( ( 1 - Pu ) - Pv);
		posteriorVisitorInfection = priorProbability * Pv;
		posteriorNotes.push("No sequence match in any dataset");
		} else {
		posteriorUnitInfection = priorProbability * Pu_2;
		posteriorInstitutionInfection = priorProbability * ( 1 - Pu_2 );
		posteriorVisitorInfection = 0.0;
		posteriorNotes.push("No sequence match in any dataset");
		}
	}
	
	var posteriorCommunityInfection = (1 - ( posteriorUnitInfection + posteriorInstitutionInfection + posteriorVisitorInfection ) );

	var statistics = {
			focusSeqGenomeCoveragePct: toFixed(focusSequence.genome_coverage, 0),
			priorProbability: toPercentage(priorProbability),
			unitMatchProportion: toPercentage(unitMatchProportion),
			institutionMatchProportion: toPercentage(institutionMatchProportion),
			communityMatchProportion: toPercentage(communityMatchProportion),
			posteriorUnitInfection: toPercentage(posteriorUnitInfection),
			posteriorInstitutionInfection: toPercentage(posteriorInstitutionInfection),
			posteriorVisitorInfection: toPercentage(posteriorVisitorInfection),
			posteriorCommunityInfection: toPercentage(posteriorCommunityInfection),
			posteriorNotes: posteriorNotes,
			unitReferenceSetSize: unitReferenceSet.length,
			institutionReferenceSetSize: institutionReferenceSet.length,
			communityReferenceSetSize: communityReferenceSet.length,
			numCloseMatchesUnit: _.filter(unitReferenceSet, function(seq) {return seq.isCloseMatch;}).length,
			numCloseMatchesInstitution: _.filter(institutionReferenceSet, function(seq) {return seq.isCloseMatch == true;}).length,
			numCloseMatchesInstitutionHcw: _.filter(institutionReferenceSet, function(seq) {return seq.isCloseMatch == true && seq.is_healthcare_worker == true;}).length,
	};
	return statistics;
}

function toPercentage(decimal) {
	return toFixed(decimal*100, 0);
}

function cdf(t) {
	var mu = 1.621
	var sdlog = 0.418;
	return 0.5 + ( 0.5 * erf( ( Math.log(t) - mu ) / ( Math.sqrt(2) * sdlog ) ) );
}

function erf(x) {
    var z;
    var ERF_A = 0.147; 
    var the_sign_of_x;
    if(0==x) {
        the_sign_of_x = 0;
        return 0;
    } else if(x>0){
        the_sign_of_x = 1;
    } else {
        the_sign_of_x = -1;
    }

    var one_plus_axsqrd = 1 + ERF_A * x * x;
    var four_ovr_pi_etc = 4/Math.PI + ERF_A * x * x;
    var ratio = four_ovr_pi_etc / one_plus_axsqrd;
    ratio *= x * -x;
    var expofun = Math.exp(ratio);
    var radical = Math.sqrt(1-expofun);
    z = radical * the_sign_of_x;
    return z;
}

function calculateGeographicDistance(focusSequence, seqObj) {
	if(seqObj.residential_outer_postcode == null) {
		seqObj.sameOutcodeAsFocus = false;
		seqObj.distanceToFocusKm = "100.0"; // unknown outer postcode? return 100km
	} else {
		if(seqObj.residential_outer_postcode == focusSequence.residential_outer_postcode) {
			seqObj.sameOutcodeAsFocus = true;
			seqObj.distanceToFocusKm = "0.0"; 
		} else {
			seqObj.sameOutcodeAsFocus = false;
			var focusPcDistrict = postcodeDistricts[focusSequence.residential_outer_postcode];
			var focusLat = focusPcDistrict.latitude;
			var focusLon = focusPcDistrict.longitude;

			var seqPcDistrict = postcodeDistricts[seqObj.residential_outer_postcode];
			var seqLat = seqPcDistrict.latitude;
			var seqLon = seqPcDistrict.longitude;
			
			seqObj.distanceToFocusKm = toFixed(Math.abs(haversine(focusLat, focusLon, seqLat, seqLon)), 0);
		}

	}
}

function calculateGeographicWeighting(hociSite, seqObj) {
	var beta = hociSite["geographic-weighting-beta"];;
	var tau = hociSite["geographic-weighting-tau"];
	
	seqObj.geographicWeighting = 
		( (1 - beta) * Math.exp( -tau * seqObj.distanceToFocusKm ) ) + beta;
}


function degToRad(degrees) {
	 return ( degrees * Math.PI ) / 180;
}

function haversine(lat1, lon1, lat2, lon2) {
	var R = 6371; // km 
	var x1 = lat2-lat1;
	var dLat = degToRad(x1);  
	var x2 = lon2-lon1;
	var dLon = degToRad(x2);  
	var a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
	                Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * 
	                Math.sin(dLon/2) * Math.sin(dLon/2);  
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c; 
	return d;
}

function ensureLineage(sourceName, seqObj) {
	var lineage;
	var sequenceID = seqObj["sequence.sequenceID"];
	var nucleotides;
	// attempt to retrieve lineage from cov-hoci sequence
	glue.inMode("sequence/"+sourceName+"/"+sequenceID, function() {
		lineage = glue.command(["show", "property", "cov_glue_lineage"]).propertyValueResult.value;
		if(lineage == null) {
			nucleotides = glue.command(["show", "nucleotides"]).nucleotidesResult.nucleotides;
		}
	});
	// if this hasn't been set, attempt to retrieve from cov-coguk sequence
	// with same ID, providing nucleotides string is identical.
	if(lineage == null) {
		var matchingCogUk = 
			glue.tableToObjects(
					glue.command(["list", "sequence", 
						"-w", "source.name = 'cov-coguk' and sequenceID = '"+sequenceID+"'", "cov_glue_lineage"]));
		if(matchingCogUk.length > 0) {
			var cogukLineage = matchingCogUk[0].cov_glue_lineage;
			var cogukNucleotides;
			glue.inMode("sequence/cov-coguk/"+sequenceID, function() {
				cogukNucleotides = glue.command(["show", "nucleotides"]).nucleotidesResult.nucleotides;
			});
			if(cogukNucleotides == nucleotides) {
				lineage = cogukLineage;
			}
		}
	}
	// finally if necessary, run lineage assignment
	if(lineage == null) {
		assignLineages("source.name = '"+sourceName+"' and sequenceID = '"+sequenceID+"'");
		glue.inMode("sequence/"+sourceName+"/"+sequenceID, function() {
			lineage = glue.command(["show", "property", "cov_glue_lineage"]).propertyValueResult.value;
		});
	}
	// set lineage in sequence object.
	seqObj["sequence.cov_glue_lineage"] = lineage;
}

var ambigCharToSubChars = {
		"R": ["A", "G"],
		"Y": ["C", "T"],
		"K": ["G", "T"],
		"M": ["A", "C"],
		"S": ["C", "G"],
		"W": ["A", "T"],
		"B": ["C", "G", "T"],
		"D": ["A", "G", "T"],
		"H": ["A", "C", "T"],
		"V": ["A", "C", "G"],
	}

function ambiguousSites(sourceName, seqObj) {
	seqObj.ambiguousSites = [];
	var almtRow = alignmentRow(sourceName, seqObj["sequence.sequenceID"]);
	for(var i = 0; i < almtRow.length; i++) {
		var seqNtChar = almtRow[i];
		var refNt = i+266;  // 266 is start of coding region on reference.
		if("RYKMSWBDHV".indexOf(seqNtChar) >= 0) { // ambiguity code.
			seqObj.ambiguousSites.push({
				refNt: refNt,
				ambigChar: seqNtChar,
				subChars: ambigCharToSubChars[seqNtChar]
			});
		}
	}
}
