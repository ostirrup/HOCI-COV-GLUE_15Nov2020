

function checkAndRetrieveFocusSequence(sourceName, sequenceID) {
	var fieldsToRetrieve = _.map(metadataFields, function(mf) { return mf[1]; });
	fieldsToRetrieve = fieldsToRetrieve.concat(["adm_to_symp_onset_days", "adm_to_sample_days"]);
	var command = ["list", "custom-table-row", "hoci_metadata", 
		"-w", "sequence.source.name = '"+sourceName+"' and sequence.sequenceID = '"+sequenceID+"'", "sequence.sequenceID", "genome_coverage"];
	command = command.concat(fieldsToRetrieve);
	var matchingHociMetadatas = glue.tableToObjects(glue.command(command));
	if(matchingHociMetadatas.length == 0) {
		throw new Error("No site sequence found with sequenceID = '"+sequenceID+"'");
	}
	var matchingHociMetadata = matchingHociMetadatas[0];
	if(matchingHociMetadata["institution_id"] == null) {
		throw new Error("Sequence '"+sequenceID+"' does not qualify as a focus sequence: Metadata has null value for institutionID, implying it is a community sequence.");
	}
	var admissionStatus = matchingHociMetadata["admission_status"];
	if(admissionStatus != null && admissionStatus != "inpatient") {
		throw new Error("Sequence '"+sequenceID+"' does not qualify as a focus sequence: Metadata has admissionStatus != 'inpatient'.");
	}
	var missingFields = [];
	_.each(["institution_id", 
		"unit_id", 
		"is_healthcare_worker", 
		"residential_outer_postcode", 
		"sample_date", 
		"admission_status", 
		"admission_date",
		"symptomatic", 
		"visitors_on_ward"], function(fieldName) {
		if(matchingHociMetadata[fieldName] == null) {
			missingFields.push(fieldName);
		}
	});
	if(missingFields.length > 0) {
		var missingFieldsMFile = 
			_.map(missingFields, function(missingF) {
				return _.find(metadataFields, function(mf) {return mf[1] == missingF;})[0];
			});
		throw new Error("Sequence '"+sequenceID+"' does not qualify as a focus sequence: Metadata is missing values for these mandatory fields: "+missingFieldsMFile.join(", ")+".");
	}
	return matchingHociMetadata;
}
