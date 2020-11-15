
function assignLineages(whereClause) {
	var numSeqs = glue.command(["count", "sequence", "-w", whereClause]).countResult.count;
	// assign lineages for hoci sequences.
	var batchSize = 50;
	var processed = 0;
	var offset = 0;

	glue.log("FINEST", "Assigning lineages for "+numSeqs+" sequences");

	while(processed < numSeqs) {
		var batchAssignments;
		glue.inMode("module/covAssignLineages", function() {
			batchAssignments = glue.tableToObjects(glue.command(["invoke-function", 
				"assignLineagesForSequenceBatch", whereClause, offset, batchSize]));
		});
		_.each(batchAssignments, function(batchAssignment) {
			var sourceAndSequenceID = batchAssignment.queryName;
			var sequenceID = sourceAndSequenceID.split("/")[1];
			if(batchAssignment.lineage != null) {
				glue.log("FINEST", "Sequence '"+sequenceID+"' has lineage "+batchAssignment.lineage+
						", total LWR "+toFixed(batchAssignment.likelihoodWeightRatio*100.0,2)+"%");
				glue.inMode("sequence/"+sourceAndSequenceID, function() {
					glue.command(["set", "field", "--noCommit", "cov_glue_lineage", batchAssignment.lineage]);
					glue.command(["set", "field", "--noCommit", "cov_glue_lw_ratio", batchAssignment.likelihoodWeightRatio]);
				});
			} else {
				glue.log("FINEST", "No lineage could be established for sequence '"+sequenceID+"'");
			}
		});
		glue.command(["commit"]);
		glue.command(["new-context"]);
		offset += batchSize;
		processed += batchAssignments.length;
		glue.log("FINEST", "Assigned lineages for "+processed+"/"+numSeqs+" sequences");
	}
}

