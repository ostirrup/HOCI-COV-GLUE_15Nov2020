


function checkGlueVersion() {
	var glueVersion = 
		glue.command(["glue-engine","show-version"]).glueEngineShowVersionResult.glueEngineVersion;
	var minVersionBits = [1, 1, 103];
	var glueVersionBits = _.map(glueVersion.split("."), function(bit) { return parseInt(bit);} );
	var incorrectVersion = false;
	if(glueVersionBits[0] < minVersionBits[0]) {
		incorrectVersion = true;
	} else if(glueVersionBits[0] == minVersionBits[0]) {
		if(glueVersionBits[1] < minVersionBits[1]) {
			incorrectVersion = true;
		} else if(glueVersionBits[1] == minVersionBits[1]) {
			if(glueVersionBits[2] < minVersionBits[2]) {
				incorrectVersion = true;
			}
		}
	}
	if(incorrectVersion) {
		throw new Error("Minimum GLUE engine version for HOCI is "+minVersionBits.join(".")+" -- use bash command glueUpdateEngine.sh to update your GLUE engine version");
	}
}