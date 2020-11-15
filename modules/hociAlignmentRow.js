function alignmentRow(sourceName, sequenceID) {
	var nucleotideAlmt;

	glue.inMode("module/covFastaAlignmentExporterSeqIdOnly", function() {
		nucleotideAlmt = glue.command(["export", "AL_GISAID_CONSTRAINED", 
				"-r", "REF_MASTER_WUHAN_HU_1", "-f", "coding_spanning_region", 
				"-w", 
				"sequence.sequenceID = '"+sequenceID+"'"+
				" and sequence.source.name = '"+sourceName+"'", 
				"-p"]);
	});
	return nucleotideAlmt.nucleotideFasta.sequences[0].sequence;
}