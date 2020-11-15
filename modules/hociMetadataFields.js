var metadataFields = [ 
	// in metadata file				in GLUE							type specifier
	["samplingCentreID", 			"sampling_centre_id", 			"ID"],
	["institutionID", 				"institution_id",				"ID"],
	["unitID", 						"unit_id",						"ID"],
	["isHealthcareWorker", 			"is_healthcare_worker",			"BOOLEAN"],
	["hcwWorkplaceID", 				"hcw_workplace_id",				"ID"],
	["residentialOuterPostcode", 	"residential_outer_postcode",	"OUTER_POSTCODE"],
	["sampleDate", 					"sample_date", 					"DATE"],
	["admissionStatus", 			"admission_status", 			"ENUM:not_a_patient/inpatient/outpatient/a_and_e_patient"],
	["admissionDate", 				"admission_date", 				"DATE"],
	["symptomatic", 				"symptomatic",					"BOOLEAN"],
	["symptomOnsetDate", 			"symptom_onset_date", 			"DATE"],
	["visitorsOnWard", 				"visitors_on_ward",				"BOOLEAN"],
	["unitHistoryPre",			  	"unit_history_pre",			 	"UNIT_LIST"],
	["unitHistoryPost",			 	"unit_history_post",			"UNIT_LIST"]
];
