function loadSiteJson() {
	var hociSiteString = glue.command(["file-util", "load-string", "hociSite.json"]).fileUtilLoadStringResult.loadedString;
	var hociSite = JSON.parse(hociSiteString);
	
	var siteId = hociSite["site-id"];
	if(siteId == null) {
		throw new Error("The field site-id in hociSite.json may not be null.");
	}
	var siteDisplayName = hociSite["site-display-name"];
	if(siteDisplayName == null) {
		siteDisplayName = siteId;
	}

	var geographicWeightingBeta = hociSite["geographic-weighting-beta"];
	if(geographicWeightingBeta == null) {
		throw new Error("The field geographic-weighting-beta in hociSite.json may not be null.");
	}
	if( ( !_.isNumber(geographicWeightingBeta) ) || geographicWeightingBeta < 0 || geographicWeightingBeta > 1) {
		throw new Error("The field geographic-weighting-beta in hociSite.json must be a number between 0 and 1 inclusive.");
	}
	
	var geographicWeightingTau = hociSite["geographic-weighting-tau"];
	if(geographicWeightingTau == null) {
		throw new Error("The field geographic-weighting-tau in hociSite.json may not be null.");
	}
	if( ( !_.isNumber(geographicWeightingTau) ) || geographicWeightingTau <= 0) {
		throw new Error("The field geographic-weighting-tau in hociSite.json must be a number greater than 0");
	}

	
	var samplingCentreIDs = {};
	if(hociSite.samplingCentres == null || !_.isArray(hociSite.samplingCentres)) {
		throw new Error("The hociSite.json must contain a value for samplingCentres, an array of sampling centre ID strings");
	}
	_.each(hociSite.samplingCentres, function(samplingCentreID) {
		if(!_.isString(samplingCentreID)) {
			throw new Error("File hociSite.json: sampling centre ID not a string");
		}
		checkValueAndThrowError("ID", "File hociSite.json sampling centre ID", samplingCentreID);
		if(samplingCentreIDs[samplingCentreID] != null) {
			throw new Error("File hociSite.json: duplicate sampling centre ID: "+samplingCentreID);
		}
		samplingCentreIDs[samplingCentreID] = "yes";
	});

	var institutionIDs = {};
	if(hociSite.institutions == null || !_.isArray(hociSite.institutions)) {
		throw new Error("The hociSite.json must contain a value for institutions, a list of institutions IDs");
	}
	_.each(hociSite.institutions, function(institution) {
		if(institution.id == null) {
			throw new Error("Each institution object in hociSite.json must contain a non-null id value.");
		}
		if(!_.isString(institution.id)) {
			throw new Error("File hociSite.json: institution.id not a string");
		}
		checkValueAndThrowError("ID", "File hociSite.json institution id", institution.id);
		if(institutionIDs[institution.id] != null) {
			throw new Error("File hociSite.json: duplicate institution ID: "+institution.id);
		}
		institutionIDs[institution.id] = "yes";
		if(institution.units == null || !_.isArray(institution.units)) {
			throw new Error("Each institution object in hociSite.json must contain a value for units, objects representing units (e.g. wards) within the institution.");
		}
		var unitIDs = {};
		_.each(institution.units, function(unit) {
			if(unit.id == null) {
				throw new Error("Each unit object in hociSite.json must contain a non-null id value.");
			}
			if(!_.isString(unit.id)) {
				throw new Error("File hociSite.json: unit id not a string");
			}
			checkValueAndThrowError("ID", "File hociSite.json unit id", unit.id);
			if(unitIDs[unit.id] != null) {
				throw new Error("File hociSite.json: duplicate unit ID: "+unit.id+" within institution "+institution.id);
			}
			unitIDs[unit.id] = "yes";
			if(unit.layout == null) {
				unit.layout = DEFAULT_UNIT_LAYOUT;
			} else {
				checkValidUnitLayout("File hociSite.json, unit "+unit.id+" within institution "+institution.id, unit.layout);
			}
		});
	});
	return hociSite;
}

function checkValueAndThrowError(type, context, value) {
	var checkResult = checkAndNormaliseTypedValue(type, context, value);
	if(checkResult.error != null) {
		throw new Error(checkResult.error);
	}
	return checkResult.value;
}

function checkValidSamplingCentreID(errors, context, hociSite, samplingCentreID) {
	if(!_.contains(hociSite.samplingCentres, samplingCentreID)) {
		errors.push(context+": Invalid samplingCentreID: "+samplingCentreID+": it must be listed in hociSite.json");
	}
}

function checkValidInstitutionUnitIDs(errors, context, hociSite, institutionID, unitID) {
	var institutionObj = _.findWhere(hociSite.institutions, {id: institutionID});
	if(institutionObj == null) {
		errors.push(context+": Invalid institutionID: "+institutionID+": it must be listed in hociSite.json");
		return;
	}
	if(_.findWhere(institutionObj.units, {id: unitID}) == null) {
		errors.push(context+": Invalid unitID "+unitID+" for institutionID: "+
				institutionID+": the unit ID must be listed in hociSite.json");
	}
}

function checkValidInstitutionID(errors, context, hociSite, institutionID) {
	var institutionObj = _.findWhere(hociSite.institutions, {id: institutionID});
	if(institutionObj == null) {
		errors.push(context+": Invalid institutionID: "+institutionID+": it must be listed in hociSite.json");
	}
}

function checkValidUnitHistory(errors, context, hociSite, institutionID, unitHistoryPre, unitHistoryPost) {
	// get all the unit history specified for this sample 
	var unitHistory = [];
	if(unitHistoryPre != null) unitHistory = unitHistory.concat(unitHistoryPre.split(/\s*\|\s*/));
	if(unitHistoryPost != null) unitHistory = unitHistory.concat(unitHistoryPost.split(/\s*\|\s*/));
	// if any unit history given
	if(unitHistory.length > 0) {
		// get the hociSite institution information for institution of sample
		var institutionObj = _.filter(hociSite.institutions, function(i) {
			return i.id === institutionID;
		});
		// get all the units in the institution
		var unitsOfInstitution = _.map(institutionObj[0].units, function(u) {
			return u.id;
		});
		// check each unit in history fields exists in the institution
		_.each(unitHistory, function(unit) {
			if(!_.contains(unitsOfInstitution, unit)) {
				errors.push(context+": Unit '"+unit+"' not defined for institution '"+institutionID+"': it must be listed in hociSite.json");
			}
		});
	}
}

function getPu2ForInstitutionUnitID(hociSite, institutionID, unitID) {
	//glue.logInfo("hociSite", hociSite);
	//glue.logInfo("institutionID", institutionID);
	//glue.logInfo("unitID", unitID);
	var institutionObj = _.findWhere(hociSite.institutions, {id: institutionID});
	var unitObj = _.findWhere(institutionObj.units, {id: unitID});
	return layoutStringToPu2Value[unitObj.layout];
}
