

function loadSequencesAndMetadata(sourceName, hociSite, incremental) {
	var seqIDsToIgnore = {};
	
	if(incremental) {
		var processedSeqIDsList = glue.getTableColumn(glue.command(["list", "sequence", "-w", "source.name = '"+sourceName+"' and hoci_processed = true"]), "sequenceID");
		_.each(processedSeqIDsList, function(seqID) {
			seqIDsToIgnore[seqID] = "yes";
		});
	}
		
	var errors = [];
	
	var siteFastaPath = hociSite["fasta-path"];
	if(siteFastaPath == null) {
		siteFastaPath = "hociSiteSequences.fasta";
	}

	var siteMetadataPath = hociSite["metadata-path"];
	if(siteMetadataPath == null) {
		siteMetadataPath = "hociSiteMetadata.txt";
	}
	
	var fastaDocument;
	glue.inMode("module/covFastaUtility", function() {
		fastaDocument = glue.command(["load-nucleotide-fasta", siteFastaPath]);
	});
	
	var fastaSequenceIDs = {};
	_.each(fastaDocument.nucleotideFasta.sequences, function(seqObj) {
		var sequenceID = seqObj.id; 
		if(sequenceID == null || sequenceID == "") {
			errors.push("Null or empty FASTA ID in file "+siteFastaPath);
			return;
		}
		var typeCheckResult = checkAndNormaliseTypedValue("ID", "Value for FASTA ID in file "+siteFastaPath, sequenceID);
		if(typeCheckResult.error != null) {
			errors.push(typeCheckResult.error);
			return;
		}
		if(fastaSequenceIDs[sequenceID] != null) {
			errors.push("Duplicate FASTA ID in file "+siteFastaPath);
			return;
		}
		fastaSequenceIDs[sequenceID] = "yes";
	});

	var metadataSequenceIDs = {};
	var seqIDToNormalisedMetadataObj = {};

	// load data from metadata file.
	var hociMetadataObjs;
	var metadataFileColumns;
	glue.inMode("module/tabularUtilityTab", function() {
		var tableResult = glue.command(["load-tabular", siteMetadataPath]);
		metadataFileColumns = tableResult.tabularResult.column;
		hociMetadataObjs = glue.tableToObjects(tableResult);
	});

	var allowedMetadataColumns = _.map(metadataFields, function(mf) {return mf[0];});
	var foundMetadataColumns = {};
	
	_.each(metadataFileColumns, function(metadataFileColumn) {
		if(metadataFileColumn == null || metadataFileColumn == "") {
			errors.push("Null column header in file "+siteMetadataPath);
			return;
		}
		if(foundMetadataColumns[metadataFileColumn] != null) {
			errors.push("Duplicate column header '"+metadataFileColumn+"' in file "+siteMetadataPath);
			return;
		} else {
			foundMetadataColumns[metadataFileColumn] = "yes";
		}
		if(metadataFileColumn != "sequenceID" && allowedMetadataColumns.indexOf(metadataFileColumn) < 0) {
			errors.push("Illegal column header '"+metadataFileColumn+"' in file "+siteMetadataPath);
			return;
		}
	}); 
	_.each(allowedMetadataColumns, function(allowedColumn) {
		if(foundMetadataColumns[allowedColumn] == null) {
			errors.push("Missing column header '"+allowedColumn+"' in file "+siteMetadataPath);
		}
	});
	
	_.each(hociMetadataObjs, function(hociMetadataObj) {
		var metadataSequenceID = hociMetadataObj.sequenceID;
		if(metadataSequenceID == null || metadataSequenceID == "") {
			errors.push("Null / empty sequenceID in file "+siteMetadataPath);
		} else {
			var typeCheckResult = checkAndNormaliseTypedValue("ID", "Column sequenceID in file "+siteMetadataPath, metadataSequenceID);
			if(typeCheckResult.error != null) {
				errors.push(typeCheckResult.error);
			}
			if(metadataSequenceIDs[metadataSequenceID] != null) {
				errors.push("Duplicate sequenceID '"+metadataSequenceID+"' in file "+siteMetadataPath);
			} else {
				metadataSequenceIDs[metadataSequenceID] = "yes";
			}
		}
		if(metadataSequenceID != null && fastaSequenceIDs[metadataSequenceID] == null) {
			errors.push("Row with sequenceID '"+metadataSequenceID+"' in file "+siteMetadataPath+": no counterpart in FASTA file "+siteFastaPath);
		}
		
		if(metadataSequenceID != null && seqIDsToIgnore[metadataSequenceID] == "yes") {
			glue.log("FINEST", "Skipping metdata data / consistency checks for sequence ID '"+metadataSequenceID+"': already present");
			return;
		}

		var normalisedMetadataObj = {};
		var typeErrors = false;
		_.each(metadataFields, function(field) {
			var metadataFieldName = field[0];
			var type = field[2];
			var value = hociMetadataObj[metadataFieldName];
			var typeCheckResult = checkAndNormaliseTypedValue(type, "Row with sequenceID '"+metadataSequenceID+"', column "+metadataFieldName+" in file "+siteMetadataPath, value);
			if(typeCheckResult.error != null) {
				errors.push(typeCheckResult.error);
				typeErrors = true;
				return;
			}
			var normalisedValue = typeCheckResult.value;
			if(normalisedValue != null) {
				normalisedMetadataObj[metadataFieldName] = normalisedValue;
			}
		});
		if(typeErrors) {
			return;
		}
		checkMetadataRowConsistency(errors, metadataSequenceID, hociSite, siteMetadataPath, normalisedMetadataObj);
		seqIDToNormalisedMetadataObj[metadataSequenceID] = normalisedMetadataObj;
		
	});
	
	_.each(_.keys(fastaSequenceIDs), function(fastaSequenceID) {
		if(metadataSequenceIDs[fastaSequenceID] == null) {
			errors.push("Sequence with sequenceID '"+fastaSequenceID+"' in FASTA file "+siteFastaPath+": no counterpart in metadata file "+siteMetadataPath);
		}
		
	});

	if(errors.length > 0) {
		glue.log("SEVERE", "The following errors were found in the sequence and/or metadata files:");
		_.each(errors, function(error) {
			glue.log("SEVERE", error);
		});
		throw new Error("Errors were found in the sequence and/or metadata files, see log for details");
	}

	_.each(hociMetadataObjs, function(hociMetadataObj) {
		var metadataSequenceID = hociMetadataObj.sequenceID;
		if(seqIDsToIgnore[metadataSequenceID] == "yes") {
			glue.log("FINEST", "Skipping creation of metadata object for sequence ID '"+metadataSequenceID+"': already present");
			return;
		}
		normalisedMetadataObj = seqIDToNormalisedMetadataObj[metadataSequenceID];

		glue.command(["create", "custom-table-row", "hoci_metadata", metadataSequenceID]);
		glue.inMode("custom-table-row/hoci_metadata/"+metadataSequenceID, function() {
			_.each(metadataFields, function(field) {
				var metadataFieldName = field[0];
				var glueFieldName = field[1];
				var value = normalisedMetadataObj[metadataFieldName];
				if(value != null) {
					glue.command(["set", "field", glueFieldName, value]);
				}
			});
			if(normalisedMetadataObj.admissionDate != null && normalisedMetadataObj.symptomOnsetDate != null) {
				var adm_to_symp_onset_days;
				if(glueDateToJsDate(normalisedMetadataObj.admissionDate) <= glueDateToJsDate(normalisedMetadataObj.symptomOnsetDate)) {
					adm_to_symp_onset_days = glueDateDifferenceDays(normalisedMetadataObj.admissionDate, normalisedMetadataObj.symptomOnsetDate);
				} else {
					adm_to_symp_onset_days = 0;
				}
				glue.command(["set", "field", "adm_to_symp_onset_days", adm_to_symp_onset_days]);
			}
			if(normalisedMetadataObj.admissionDate != null) {
				var adm_to_sample_days;
				if(glueDateToJsDate(normalisedMetadataObj.admissionDate) <= glueDateToJsDate(normalisedMetadataObj.sampleDate)) {
					adm_to_sample_days = glueDateDifferenceDays(normalisedMetadataObj.admissionDate, normalisedMetadataObj.sampleDate);
				} else {
					adm_to_sample_days = 0;
				}
				glue.command(["set", "field", "adm_to_sample_days", adm_to_sample_days]);
			}
			
		});
	});
	
	_.each(fastaDocument.nucleotideFasta.sequences, function(seqObj) {
		var sequenceID = seqObj.id; 
		if(seqIDsToIgnore[sequenceID] == "yes") {
			glue.log("FINEST", "Skipping creation of sequence object for sequence ID '"+sequenceID+"': already present");
			return;
		}
		var normalisedSequence = seqObj.sequence.toUpperCase().replace(/-/g, "");
		glue.command(["create", "sequence-from-string", sourceName, sequenceID, normalisedSequence]);
		glue.inMode("sequence/"+sourceName+"/"+sequenceID, function() {
			glue.command(["set", "link-target", "hoci_metadata", "custom-table-row/hoci_metadata/"+sequenceID]);
			glue.command(["set", "field", "hoci_processed", "false"]);
		});
	});


	
}

// check a given value string meets the specification of a given type. 
// return the norrmalised value.

// given a metadataObj with normalised fields set on it, check these obey the
// constraints in the input specification.
function checkMetadataRowConsistency(errors, sequenceID, hociSite, siteMetadataPath, metadataObj) {
	var isCommunitySequence = false;
	var context = "Metadata file "+siteMetadataPath+", sequenceID '"+sequenceID+"'";
	if(metadataObj.institutionID == null) {
		isCommunitySequence = true;
	}
	if(isCommunitySequence) {
		checkValidSamplingCentreID(errors, context, hociSite, metadataObj.samplingCentreID);
		if(metadataObj.unitID != null) {
			errors.push(context+": unitID must be null for community-sampled sequence");
		}
		if(metadataObj.admissionStatus != null) {
			errors.push(context+": admissionStatus must be null for community-sampled sequence");
		}
		if(metadataObj.admissionDate != null) {
			errors.push(context+": admissionDate must be null for community-sampled sequence");
		}
		if(metadataObj.visitorsOnWard != null) {
			errors.push(context+": visitorsOnWard must be null for community-sampled sequence");
		}
		if(metadataObj.unitHistoryPre != null || metadataObj.unitHistoryPost != null) {
			errors.push(context+": both unitHistoryPre & unitHistoryPost must be null for community-sampled sequence");
		}
	} else {
		if(metadataObj.unitID == null) {
			checkValidInstitutionID(errors, context, hociSite, metadataObj.institutionID);
		} else {
			checkValidInstitutionUnitIDs(errors, context, hociSite, metadataObj.institutionID, metadataObj.unitID);
		}
		if(metadataObj.samplingCentreID != null) {
			errors.push(context+": samplingCentreID must be null for institution-sampled sequence");
		}
		if(metadataObj.isHealthcareWorker == null) {
			errors.push(context+": isHealthcareWorker is mandatory for institution-sampled sequence");
		}
		if(metadataObj.admissionStatus == "inpatient" && metadataObj.admissionDate == null) {
			errors.push(context+": admissionDate is mandatory if admissionStatus is 'inpatient'");
		}
		if(metadataObj.admissionStatus != "inpatient" && metadataObj.admissionDate != null) {
			errors.push(context+": admissionDate is only permitted if admissionStatus is 'inpatient'");
		}
		if(metadataObj.unitHistoryPre != null || metadataObj.unitHistoryPost != null) {
			checkValidUnitHistory(errors, context, hociSite, metadataObj.institutionID, metadataObj.unitHistoryPre, metadataObj.unitHistoryPost);
		}
	}
	if(metadataObj.isHealthcareWorker == true && metadataObj.hcwWorkplaceID == null) {
		errors.push(context+": hcwWorkplaceID is mandatory if isHealthcareWorker is true");
	}
	if(metadataObj.sampleDate == null) {
		errors.push(context+": sampleDate is mandatory for all sequences");
	}
}
