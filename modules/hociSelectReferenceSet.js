
// sequences sampled more than <timeCutoffUnit> days before the focus sequence
// will not be included in the unit reference set
var timeCutoffUnit = 21;
// sequences sampled more than <timeCutoffInstitution> days before the focus sequence 
// will not be included in the institution reference set
var timeCutoffInstitution = 21;
// sequences sampled more than <timeCutoffCommunity> days before the focus sequence 
// will not be included in the community reference set
var timeCutoffCommunity = 42;

// In various cases, this threshold is used to compare admission date with symptom 
// onset date (or sample date if symptom onset is missing).
// If the difference between the two dates is greater than <maxDaysAdmToSympSample>
// days, this indicates insititutional transmission, if less than or equal, community 
// transmission.
var maxDaysAdmToSympSample = 2;

// For inpatients potentially infected within the institution, outpatients (who could 
// be regular visitors) and HCWs include sequences sampled up to 
// <timeCutoffInstitutionAfter> days after the focus sequence
var timeCutoffInstitutionAfter = 2;

// However, for those patients who probably acquired COVID in the community 
// (i.e. a_and_e_patients and inpatients with +ve test <=2 days from admission), 
// do not include sequences sampled after the focus sequence in the institution 
// reference set and also exclude those sampled on the same date or up to 
// <timeCutoffInsitutionBefore> before 
// the focus sequence.
var timeCutoffInstitutionBefore = 2;

function selectUnitReferenceSet(sourceName, indexSequenceID) {
	var index = getIndexSequenceProperties(indexSequenceID);
	
	var unitCutoffDate = glueDateSubtractDays(index.sampleDate, timeCutoffUnit);
	var timeCutoffInstitutionAfterDate = glueDateAddDays(index.sampleDate, timeCutoffInstitutionAfter);
	
	var unitWhereClause = 
		"sequence.source.name = '"+sourceName+"'"+ // a HOCI sequence
		" and sequence.sequenceID != '"+index.sequenceID+"'"+
		" and sample_date >= #gluedate("+unitCutoffDate+")"+
		" and institution_id = '"+index.institutionID+"'"+
		" and unit_id = '"+index.unitID+"'"+
		" and sample_date <= #gluedate("+timeCutoffInstitutionAfterDate+")";
	
	glue.log("FINEST", "unitWhereClause", unitWhereClause);
	
	return selectReferenceSet(unitWhereClause);
}

function selectInstitutionReferenceSet(sourceName, indexSequenceID) {
	var index = getIndexSequenceProperties(indexSequenceID);
	var institutionCutoffDate = glueDateSubtractDays(index.sampleDate, timeCutoffInstitution);
	var timeCutoffInstitutionAfterDate = glueDateAddDays(index.sampleDate, timeCutoffInstitutionAfter);
	var timeCutoffInstitutionBeforeDate = glueDateSubtractDays(index.sampleDate, timeCutoffInstitutionBefore);
	
	var institutionWhereClause = 
		"sequence.source.name = '"+sourceName+"'"+ // a HOCI sequence
		" and sequence.sequenceID != '"+index.sequenceID+"'"+
		" and sample_date >= #gluedate("+institutionCutoffDate+")"+
		" and "+
		"( "+
			"( "+
				// (1) any inpatient at the same institution but different unit
				// who was admitted more than 2 days before becoming symptomatic / 
				// being sampled, and sampled up to 7 days after focus
				" institution_id = '"+index.institutionID+"'"+
				" and ( unit_id != '"+index.unitID+"' )"+
				" and ( admission_status = 'inpatient' )"+
				" and ( " +
						"( adm_to_symp_onset_days != null"+
						 " and adm_to_symp_onset_days > "+maxDaysAdmToSympSample+" )"+
						 " or " +
						"( adm_to_symp_onset_days = null"+
						 " and adm_to_sample_days > "+maxDaysAdmToSympSample+" )"+
					 ")"+
				" and sample_date <= #gluedate("+timeCutoffInstitutionAfterDate+")"+
			") or ("+
				// (2) any healthcare worker at the same institution sampled up 
			 	// to 7 days after focus
				" is_healthcare_worker = true"+
				" and hcw_workplace_id = '"+index.institutionID+"'"+
				" and sample_date <= #gluedate("+timeCutoffInstitutionAfterDate+")"+
			") or ("+
				// (3) any outpatient at the same institution sampled up 
			 	// to 7 days after focus
				" institution_id = '"+index.institutionID+"'"+
				" and ( admission_status = 'outpatient' )"+
				" and sample_date <= #gluedate("+timeCutoffInstitutionAfterDate+")"+
			") or ("+
				// (4) any A & E patient at the same institution sampled at least 
			 	// 2 days before focus
				" institution_id = '"+index.institutionID+"'"+
				" and ( admission_status = 'a_and_e_patient' )"+
				" and sample_date < #gluedate("+timeCutoffInstitutionBeforeDate+")"+
			") or ("+
				// (5) any inpatient at the same institution but different unit
				// who were admitted at most 2 days before 
				// symptom onset (or if symptom onset date is null, being sampled), 
				// and sampled at least 2 days before focus
				" institution_id = '"+index.institutionID+"'"+
				" and ( unit_id != '"+index.unitID+"' )"+
				" and ( admission_status = 'inpatient' )"+
				" and ( " +
					"( adm_to_symp_onset_days != null"+
					 " and adm_to_symp_onset_days <= "+maxDaysAdmToSympSample+" )"+
					 " or " +
					"( adm_to_symp_onset_days = null"+
					 " and adm_to_sample_days <= "+maxDaysAdmToSympSample+" )"+
				 ")"+
				" and sample_date < #gluedate("+timeCutoffInstitutionBeforeDate+") "+
			") "+
		")";
	
	glue.log("FINEST", "institutionWhereClause", institutionWhereClause);
	
	return selectReferenceSet(institutionWhereClause);
} 

function selectCommunityReferenceSet(sourceName, indexSequenceID) {
	var index = getIndexSequenceProperties(indexSequenceID);
	var communityCutoffDate = glueDateSubtractDays(index.sampleDate, timeCutoffCommunity);
	var forwardCutoffDate = glueDateAddDays(index.sampleDate, timeCutoffInstitutionAfter);

	
	var communityWhereClause = 
		"sequence.source.name = '"+sourceName+"'"+ // a HOCI sequence
		" and sequence.sequenceID != '"+index.sequenceID+"'"+
		" and sample_date >= #gluedate("+communityCutoffDate+") "+
		" and ( "+ // 3 distinct sub-groups
				"( "+
					// (1) sequences not sampled from any institution, 
					" institution_id = null "+
				") or (" +
					// (2) non-inpatient sequences sampled from any institution, 
					" institution_id != null"+
					" and admission_status in ('not_a_patient', 'outpatient', 'a_and_e_patient') "+
				") or (" +
					// (3) inpatient sequences sampled from any institution, 
					// who were also admitted at most 2 days before they became
					// symptomatic (or if symptom onset unrecorded, were sampled)
					" institution_id != null "+
					" and admission_status = 'inpatient' "+
					" and ( " +
						"( adm_to_symp_onset_days != null"+
						 " and adm_to_symp_onset_days <= "+maxDaysAdmToSympSample+" )"+
						 " or " +
						"( adm_to_symp_onset_days = null"+
						 " and adm_to_sample_days <= "+maxDaysAdmToSympSample+" )"+
					 ")"+
				") "+
			 ") "+
		" and sample_date <= #gluedate("+forwardCutoffDate+")";
	
	glue.log("FINEST", "communityWhereClause", communityWhereClause);
	
	return selectReferenceSet(communityWhereClause);
} 


function selectReferenceSet(whereClause) {
	var fieldsToRetrieve = _.map(metadataFields, function(mf) { return mf[1]; });
	fieldsToRetrieve = fieldsToRetrieve.concat(["adm_to_symp_onset_days", "adm_to_sample_days"]);
	var command = ["list", "custom-table-row", "hoci_metadata", "-w", whereClause, 
		"sequence.sequenceID", "genome_coverage"];
	command = command.concat(fieldsToRetrieve);
	return glue.tableToObjects(glue.command(command));
}

function getIndexSequenceProperties(indexSequenceID) {
	var index = {
		sequenceID:indexSequenceID
	};
	var indexSampleDate;
	var indexInstitutionID;
	var indexUnitID;
	glue.inMode("custom-table-row/hoci_metadata/"+indexSequenceID, function() {
		index.sampleDate = glue.command(["show", "property", "sample_date"]).propertyValueResult.value;
		index.unitID = glue.command(["show", "property", "unit_id"]).propertyValueResult.value;
		index.institutionID = glue.command(["show", "property", "institution_id"]).propertyValueResult.value;
	});
	return index;
}

