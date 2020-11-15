
function resetSite() {
	var sourceName = "cov-hoci";
	glue.command(["multi-unset", "link-target", "cov_nt_mutation_sequence", "-w", "id like '%:"+sourceName+"'", "sequence"]);
	glue.command(["multi-unset", "link-target", "hoci_missing_nt_block", "-w", "id like '%:"+sourceName+":%'", "sequence"]);
	glue.command(["multi-unset", "link-target", "hoci_metadata", "-a", "sequence"]);

	glue.command(["multi-delete", "cov_nt_mutation_sequence", "-w", "id like '%:"+sourceName+"'"]);
	glue.command(["multi-delete", "hoci_missing_nt_block", "-w", "id like '%:"+sourceName+":%'"]);
	glue.command(["multi-delete", "hoci_metadata", "-a"]);
	glue.command(["multi-delete", "sequence", "-w", "source.name = '"+sourceName+"'"]);
}

function processSite() {
	processSiteInternal(false);
}

function updateSite() {
	processSiteInternal(true);
}


function processSiteInternal(incremental) {

	checkGlueVersion();

	var sourceName = "cov-hoci";
	
	var hociSite = loadSiteJson();


	// glue.command(["multi-unset", "field", "coguk_metadata", "-w", "hoci_eclipsed != null", "hoci_eclipsed"]);

	loadSequencesAndMetadata(sourceName, hociSite, incremental);
	processSiteSequences(sourceName);
	
	/*
	var eclipsingMetadataObjs = glue.tableToObjects(glue.command(["list", "custom-table-row", "hoci_metadata", 
		"-a", "id"]));
	
	_.each(eclipsingMetadataObjs, function(eclipsingMetadataObj) {
		var eclipsedMetadataObjs = glue.tableToObjects(glue.command(["list", "custom-table-row", "coguk_metadata", "-w", 
			"id = '"+eclipsingMetadataObj.id+"'"]));
		if(eclipsedMetadataObjs.length > 0) {
			var eclipsedID = eclipsedMetadataObjs[0].id;
			glue.inMode("custom-table-row/coguk_metadata/"+eclipsedID, function() {
				glue.command(["set", "field", "hoci_eclipsed", "true"]);
			});
		}
	});
	*/

	
}
