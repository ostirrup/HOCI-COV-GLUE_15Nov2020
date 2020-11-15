var months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

//transform native GLUE date to native JavaScript date.
function glueDateToJsDate(glueDate) {
	var bits = glueDate.split("-");
	var day = bits[0];
	var month = months.indexOf(bits[1].toUpperCase())+1;
	if(month < 10) {
		month = "0"+month;
	}
	var year = bits[2];
	var string = year+"-"+month+"-"+day;
	return new Date(string);
}

//transform native JavaScript date to native GLUE date.
function jsDateToGlueDate(jsDate) {
	var dayOfMonth = jsDate.getDate()+"";
	if(dayOfMonth.length == 1) {
		dayOfMonth = "0"+dayOfMonth;
	}
	var month = months[jsDate.getMonth()];
	var year = jsDate.getFullYear();
	return dayOfMonth+"-"+month+"-"+year;
}

//subtract a number of days from a native GLUE date and return result as a GLUE date.
function glueDateSubtractDays(glueDate, days) {
	var jsDate = glueDateToJsDate(glueDate);
	var jsDateSubtracted = new Date(jsDate.getTime());
	jsDateSubtracted.setDate(jsDateSubtracted.getDate()-days);
	return jsDateToGlueDate(jsDateSubtracted);
}

//add a number of days to a native GLUE date and return result as a GLUE date.
function glueDateAddDays(glueDate, days) {
	var jsDate = glueDateToJsDate(glueDate);
	var jsDateAdded = new Date(jsDate.getTime());
	jsDateAdded.setDate(jsDateAdded.getDate()+days);
	return jsDateToGlueDate(jsDateAdded);
}

// absolute difference in days between two GLUE dates.
function glueDateDifferenceDays(glueDate1, glueDate2) {
	var jsDate1 = glueDateToJsDate(glueDate1);
	var jsDate2 = glueDateToJsDate(glueDate2);
	var diffTime = Math.abs(jsDate2 - jsDate1);
	var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
	return diffDays;
}