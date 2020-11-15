var DEFAULT_UNIT_LAYOUT = "bay";

// prior probability of infection on unit given post-admission infection
// on teleconference 8/6/2020 it was agreed that this be adjusted according to unit layout.
// 0.5 for single-room wards, 0.7 for bay wards, 0.9 for nightingale wards
// following Issue #26, these values are now interpreted assuming no visitors on ward.
var layoutStringToPu2Value = {
		"single_bed" : 0.5,
		"bay": 0.7,
		"nightingale": 0.9
};

function checkValidUnitLayout(context, layout) {
	if(layoutStringToPu2Value[layout] == null) {
		throw new Error(context+": Invalid value '"+layout+"' for unit layout, valid values: "+
				_.keys(layoutStringToPu2Value).join(", "));
	}
}
