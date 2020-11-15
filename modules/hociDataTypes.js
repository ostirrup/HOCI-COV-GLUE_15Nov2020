function checkAndNormaliseTypedValue(type, context, value) {
	if(value == null) {
		return { value: null };
	}
	value = value.trim();
	if(value == "") {
		return { value: null };
	}
	if(type == "ID") {
		if(value.length < 3) {
			return { error: context+": value '"+value+"' of type ID must be of length at least 3 characters" };
		}
		if(value.length > 20) {
			return { error: context+": value '"+value+"' of type ID maximum length is 20 characters" };
		}
		if(!value.match(/^[A-Za-z][A-Za-z0-9_\-]+$/)) {
			return { error: context+": value '"+value+"' of type ID must start with an alpha character and contain only alphanumeric, hyphen or underscore characters" };
		}
		return { value: value };
	} else if(type == "BOOLEAN") {
		var normalised = value.toLowerCase();
		if(normalised != "true" && normalised != "false") {
			return { error: context+": illegal value '"+value+"' for type BOOLEAN; legal examples: true, false, TRUE, FALSE" };
		}
		return { value: normalised };
	} else if(type == "DATE") {
		var dateBits = value.split("-");
		if(dateBits.length != 3) {
			return { error: context+": illegal value '"+value+"' for type DATE; legal examples: 01-MAR-2020, 09-Apr-20" };
		}
		var dayOfMonth = dateBits[0];
		if(!dayOfMonth.match(/^\d\d$/)) {
			return { error: context+": illegal value '"+value+"' for type DATE; legal examples: 01-MAR-2020, 09-Apr-20" };
		}
		var month = dateBits[1].toUpperCase();
		if(!month.match(/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/)) {
			return { error: context+": illegal value '"+value+"' for type DATE; legal examples: 01-MAR-2020, 09-Apr-20" };
		}
		var year = dateBits[2];
		if(year.match(/^\d\d$/)) {
			year = "20"+year;
		}
		if(!year.match(/^\d\d\d\d$/)) {
			return { error: context+": illegal value '"+value+"' for type DATE; legal examples: 01-MAR-2020, 09-Apr-20" };
		}
		return { value: dayOfMonth+"-"+month+"-"+year };
	} else if(type.startsWith("ENUM")) {
		var normalised = value.toLowerCase();
		var allowedValues = type.substring(type.indexOf(":")+1).split("/");
		if(allowedValues.indexOf(normalised) < 0) {
			return { error: context+": illegal value '"+value+"' for type ENUM; legal values: "+allowedValues };
		}
		return { value: normalised };
	} else if(type == "OUTER_POSTCODE") {
		var normalised = value.toUpperCase();
		if(postcodeDistricts[normalised] == null) {
			return { error: context+": illegal value '"+value+"' for type OUTER_POSTCODE; unrecognised postcode district" };
		}
		return { value: normalised };
	} else if (type == "UNIT_LIST") {
		if (!typeof value === 'string') {
			return { error: context+": illegal value '"+value+"' for type UNIT_LIST; must be pipe-delimited string; legal example: Unit_1|Unit_2|Unit_3" };
		}
		var units = value.split(/\s*\|\s*/);
		if(_.contains(units, "")) {
			return { error: context+": illegal empty item for type UNIT_LIST; check for leading/trailing/empty pipe-delimeters; legal example: Unit_1|Unit_2|Unit_3" };
		}
		return {value: value}
	} else {
		throw new Error(context+": unknown type '"+type+"'");
	}
}
