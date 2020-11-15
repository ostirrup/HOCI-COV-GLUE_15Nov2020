var minCoverageOfCodingSpanningRegion = 90.0; // as per input spec document v.0.0.5

function processSiteSequences(sourceName) {
	
	var memberObjs;
	
	var seqWhereClause = "source.name = '"+sourceName+"' and hoci_processed = false";
	var membWhereClause = "sequence.source.name = '"+sourceName+"' and sequence.hoci_processed = false";
	
	var numSeqs = glue.command(["count", "sequence", "-w", seqWhereClause]).countResult.count;

	glue.log("FINEST", "Adding "+numSeqs+" sequences to constrained alignment.");
	glue.inMode("alignment/AL_GISAID_CONSTRAINED", function() {
		glue.command(["add", "member", "-w", seqWhereClause]);
		memberObjs = glue.tableToObjects(glue.command(["list", "member", "-w", membWhereClause]));
	});
	glue.command(["compute", "alignment", "AL_GISAID_CONSTRAINED", "covMafftAligner", "-w", membWhereClause]);

	glue.log("FINEST", "Checking "+numSeqs+" sequences meet minimum coverage requirement of "+minCoverageOfCodingSpanningRegion+"%");

	var badSeqIDs = [];
	
	var seqIDToCoverage = {};
	
	glue.inMode("alignment/AL_GISAID_CONSTRAINED", function() {
		_.each(memberObjs, function(memberObj) {
			var sequenceID = memberObj["sequence.sequenceID"];
			glue.inMode("member/"+memberObj["sequence.source.name"]+"/"+sequenceID, function() {
				var featureCoverageObj = 
					glue.tableToObjects(
							glue.command(["show", "feature-coverage", "-r", "REF_MASTER_WUHAN_HU_1", "-f", "coding_spanning_region", "--excludeNs"])
					)[0];
				var coverage = featureCoverageObj.refNtCoveragePct;
				if(coverage < minCoverageOfCodingSpanningRegion) {
					badSeqIDs.push(sequenceID);
					glue.log("SEVERE", "Sequence '"+sequenceID+"' has CSR coverage of "+toFixed(coverage,2)+"%; minimum for inclusion is "+minCoverageOfCodingSpanningRegion+"%.");
				} else {
					seqIDToCoverage[sequenceID] = coverage;
					glue.log("FINEST", "Sequence '"+sequenceID+"' has CSR coverage of "+toFixed(coverage,2)+"%");
				}
			});
		});
	});

	if(badSeqIDs.length > 0) {
		throw new Error("Minimum CSR coverage is "+minCoverageOfCodingSpanningRegion+"%. The following sequences had insufficient CSR coverage: "+badSeqIDs.join(", "));
	}
	
	_.each(_.pairs(seqIDToCoverage), function(pair) {
		var seqID = pair[0];
		var coverage = pair[1];
		glue.inMode("custom-table-row/hoci_metadata/"+seqID, function() {
			glue.command(["set", "field", "genome_coverage", coverage]);
		});
	});
	
	// associate SNPs for hoci sequences.
	glue.inMode("module/covAssociateSNPs", function() {
		glue.command(["invoke-function", "associateSNPs", membWhereClause]);
	});
	
	var processed = 0;
	_.each(memberObjs, function(memberObj) {
		var sequenceID = memberObj["sequence.sequenceID"];
		createMissingNtBlocks(sourceName, sequenceID);
		processed++;
		if(processed % 10 == 0) {
			glue.log("FINEST", "Created missing NT blocks for "+processed+"/"+memberObjs.length+" sequences");
		}
	});
	glue.log("FINEST", "Created missing NT blocks for "+processed+"/"+memberObjs.length+" sequences");

	processed = 0;
	_.each(memberObjs, function(memberObj) {
		var sequenceID = memberObj["sequence.sequenceID"];
		glue.inMode("sequence/"+sourceName+"/"+sequenceID, function() {
			glue.command(["set", "field", "hoci_processed", "true"]);
		});
		processed++;
		if(processed % 10 == 0) {
			glue.log("FINEST", "Set hoci_processed flag true for "+processed+"/"+memberObjs.length+" sequences");
		}
	});
	glue.log("FINEST", "Set hoci_processed flag true for "+processed+"/"+memberObjs.length+" sequences");


}

function createMissingNtBlocks(sourceName, sequenceID) {
	var membAlignmentRow = alignmentRow(sourceName, sequenceID);
	var missingNtBlock = null;
	for(var refNt = 266; refNt <= 29674; refNt++) { // coding-spanning region
		var index = refNt-266;
		var membChar = membAlignmentRow.charAt(index);
		if(membChar == 'N' || membChar == '-') {
			if(missingNtBlock == null) {
				missingNtBlock = { ref_start: refNt, ref_end: refNt };
			} else {
				missingNtBlock.ref_end = refNt;
			}
		} else {
			if(missingNtBlock != null) {
				createMissingNtBlock(sourceName, sequenceID, missingNtBlock);
				missingNtBlock = null;
			}
		}
	}
	if(missingNtBlock != null) {
		createMissingNtBlock(sourceName, sequenceID, missingNtBlock);
	}
}			

function createMissingNtBlock(sourceName, sequenceID, missingNtBlock) {
	var missingBlockId = sequenceID+":"+sourceName+":"+missingNtBlock.ref_start+":"+missingNtBlock.ref_end;
	glue.command(["create", "custom-table-row", "hoci_missing_nt_block", missingBlockId]);
	glue.inMode("custom-table-row/hoci_missing_nt_block/"+missingBlockId, function() {
		glue.command(["set", "link-target", "sequence", "sequence/"+sourceName+"/"+sequenceID]);
		glue.command(["set", "field", "ref_start", missingNtBlock.ref_start]);
		glue.command(["set", "field", "ref_end", missingNtBlock.ref_end]);
	});
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