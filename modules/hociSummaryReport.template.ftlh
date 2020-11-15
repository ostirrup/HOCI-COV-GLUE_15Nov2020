<#setting date_format="dd-MMM-yyyy">

<#-- verbal description of probability -->
<#function verbalProbability p>
    <#if p gte 85>
        <#return "is very highly probable">
    <#elseif p gte 70>
        <#return "is highly probable">
    <#elseif p gte 50>
        <#return "is probable">
    <#elseif p gte 30>
        <#return "has moderately low probability">
    <#else>
        <#return "has low probability">
    </#if>
</#function>

<#function getRiskSentence p>
    <#assign sentence = verbalProbability(p)>
    <#return sentence>
</#function>

<!-- alias -->
<#assign unitProb = hociReport.statistics.posteriorUnitInfection?number>
<#assign institutionProb = hociReport.statistics.posteriorInstitutionInfection?number>

<#-- total institution and unit close matches -->
<#function countCloseMatches list=[]>
    <#local count = 0>
    <#list list as obj>
        <#if obj.isCloseMatch>
            <#local count = count + 1>
        </#if>
    </#list>
    <#return count>
</#function>
<#assign unitCloseMatchCount = countCloseMatches(hociReport.unitReferenceSet)>
<#assign institutionCloseMatchCount = countCloseMatches(hociReport.institutionReferenceSet)>
<#assign communityCloseMatchCount = countCloseMatches(hociReport.communityReferenceSet)>

<#-- the maximum number close matches from unit to dislpay -->
<#assign totalRowsToDisplay = 10>
<#function min(a, b)>
    <#return (a < b)?then(a, b)>
</#function>
<#assign maxUnitMatchesToDisplay = totalRowsToDisplay - min(5, institutionCloseMatchCount)>

<#-- show message to see detailed report, if we have over 10 matches and high risk of transmission -->
<#macro detailedReportMessage>
    <#if ((unitCloseMatchCount + institutionCloseMatchCount) > 10 && (unitProb >= 70 || institutionProb >= 70))>
        <span><em>Over 10 close matches; see detailed report for further information.</em></span>
    </#if>
</#macro>

<#-- a counter for sequences in the close match tables -->
<#assign matchRowNumber = 0>
<#assign sequenceRowNumber = {}>

<#-- macros for rendering html -->
<#macro probTextCSS p>
    <#-- if transmission prob. is greater than 70 i.e. high, then display text in red -->
    <#if (p >= 50)>text-danger font-weight-bold</#if>
</#macro>

<#macro warningSymbol p>
    <#-- if transmission prob. is greater than 70 i.e. high, then display warning symbol -->
    <#if (p >= 50)>&#9888; </#if>
</#macro>

<#macro riskStatement p from>
    <#-- renders visitor and community likelihood of infection items -->
    <span class="<@probTextCSS p=p/>"><@warningSymbol p=p/>Likelihood of infection from ${from} is ${verbalProbability(p)}*</span>
</#macro>

<#macro personType is_hcw>
    <#if is_hcw>HCW<#else>Patient</#if>
</#macro>

<#macro formatUnits u="">
    <#if u?has_content>${u?replace("|", "; ")}</#if>
</#macro>

<#macro formatOtherUnits sequence>
    <#if !(sequence.matching_units?has_content || sequence.unmatched_units?has_content)>-</#if>
    <#if sequence.matching_units?has_content>
        <span style="border-bottom:2px solid #000">${sequence.matching_units?join("; ")}</span><#if sequence.unmatched_units?has_content>; </#if>
    </#if>
    <#if sequence.unmatched_units?has_content>
        ${sequence.unmatched_units?join("; ")}
    </#if>
</#macro>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
    <title>COG-UK HOCI Summary Report</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Nunito:200,200i,300,300i,400,400i,600,600i,700,700i,800,800i,900,900i">
    <style>
        ${getResourceAsString('hociReports.bootstrap.min.css')?no_esc}
    </style>
    <style>
        ${getResourceAsString('hociSummaryReport.template.css')?no_esc}
    </style>
</head>

<body id="page-top">
    <div id="wrapper">
        <div class="d-flex flex-column" id="content-wrapper">
            <div id="content">
                <div class="container-fluid">
                    <#-- header -->
                    <div class="d-inline-block mb-1">
                        <h1 class="mb-0 font-weight-bold text-dark pt-2 float-left">COG-UK HOCI Summary Report</h1>
                        <img src="data:image/png;base64,${getResourceAsBase64('hociReports.logo-cog-uk.png')}" alt="COG-UK logo" class="float-right" style="height: 70px;">
                        <img class="float-right p-0 m-0 pr-2" src="data:image/png;base64,${getResourceAsBase64('hociReports.logo-hoci.png')}" alt="HOCI logo" style="height: 76px;">
                    </div>

                    <#-- focus sample box -->
                    <div class="card mb-3">
                        <div class="card-header py-1">
                            <h3 class="float-left text-primary font-weight-bold m-0">Focus sample</h3>
                            <div class="float-right">
                                <h3 class="text-primary font-weight-normal m-0"><strong>${hociReport.focusSequence["sequence.sequenceID"]}</strong></h3>
                            </div>
                        </div>
                        <div class="card-body p-0 pl-3 pr-3">
                            <div class="row text-dark">
                                <div class="col">
                                    <div class="table-responsive">
                                        <table class="table text-dark mb-0">
                                            <tbody>
                                                <tr>
                                                    <th class="border-top-0" style="width: 281px;">Report date</th>
                                                    <td class="border-top-0">${hociReport.reportGenerationDate?date}</td>
                                                </tr>
                                                <tr>
                                                    <th>Sample ID</th>
                                                    <td>${hociReport.focusSequence.senderSampleID!"-"}</td>
                                                </tr>
                                                <tr>
                                                    <th>Sample date</th>
                                                    <td>${hociReport.focusSequence.sample_date?date}</td>
                                                </tr>
                                                <tr>
                                                    <th>COG-UK HOCI ID</th>
                                                    <td>${hociReport.focusSequence.hociID!"-"}</td>
                                                </tr>
                                                <tr>
                                                    <th>COG-UK ID</th>
                                                    <td>${hociReport.focusSequence["sequence.sequenceID"]}</td>
                                                </tr>
                                                <tr>
                                                    <th>Admission date</th>
                                                    <td>${hociReport.focusSequence.admission_date?date}</td>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="table-responsive">
                                        <table class="table text-dark mb-0">
                                            <tbody>
                                                <tr>
                                                    <th class="border-top-0" style="width: 281px;">Unit</th>
                                                    <td class="border-top-0">${hociReport.focusSequence.unit_id}</td>
                                                </tr>
                                                <tr>
                                                    <th>Previous unit(s)</th>
                                                    <td><@formatUnits u=hociReport.focusSequence.unit_history_pre/></td>
                                                </tr>
                                                <tr>
                                                    <th>Hospital</th>
                                                    <td>${hociReport.focusSequence.institution_id}</td>
                                                </tr>
                                                <tr>
                                                    <th>Reporting hub</th>
                                                    <td>${hociReport.focusSequence.reportingHub!"-"}</td>
                                                </tr>
                                                <tr>
                                                    <th>Reported by</th>
                                                    <td>${hociReport.focusSequence.reportedBy!"-"}</td>
                                                </tr>
                                                <tr>
                                                    <th>Symptomatic</th>
                                                    <td>${hociReport.focusSequence.symptomatic?string('Yes; ', 'No')}
                                                        <#if hociReport.focusSequence.symptom_onset_date??>onset ${hociReport.focusSequence.symptom_onset_date?date}<#else>onset date unknown</#if>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <#-- report box -->
                    <div class="card mb-3">
                        <div class="card-header py-1">
                            <h3 class="text-primary font-weight-bold m-0">Report</h3>
                        </div>
                        <div class="card-body py-2">
                            <h4>Lineage: ${hociReport.focusSequence["sequence.cov_glue_lineage"]}</h4>
                            <#if (institutionCloseMatchCount > 0) || (unitCloseMatchCount > 0)>
                            <p>Focus patient's sample sequence is closely matched to samples below, possibly linked by transmission.</p>
                            </#if>
                            <div class="border rounded border-dark d-inline-block w-100 pt-0" style="margin-bottom: 10px;">
                                <#if unitCloseMatchCount == 0>
                                    <p class="text-center mb-0" style="font-size: 24px;">No matches from within unit</p>
                                <#else>
                                    <p class="text-center mb-0 <@probTextCSS p=unitProb/>" style="font-size: 24px;">
                                        <@warningSymbol p=unitProb/>Infection within unit ${getRiskSentence(unitProb)?no_esc}*<@warningSymbol p=unitProb/>
                                    </p>
                                    <div class="table-responsive" style="font-size: 18px;">
                                        <table class="table mb-1">
                                            <thead>
                                            <tr style="color: rgb(0,0,0);">
                                                <th>Number</th>
                                                <th>Sample ID</th>
                                                <th>COG-UK ID</th>
                                                <th>Other unit(s)</th>
                                                <th>Sample date</th>
                                                <th>Admission date</th>
                                                <th>Type</th>
                                            </tr>
                                            </thead>
                                            <tbody style="color: rgb(0,0,0);">
                                            <#if hociReport.unitReferenceSet?has_content><#list hociReport.unitReferenceSet as seqObj>
                                                <#if seqObj.isCloseMatch>
                                                    <#assign matchRowNumber = matchRowNumber + 1>
                                                    <tr>
                                                        <td>${matchRowNumber}</td>
                                                        <td>${seqObj.senderSampleID!"-"}</td>
                                                        <td>${seqObj["sequence.sequenceID"]}</td>
                                                        <td><@formatOtherUnits sequence=seqObj/></td>
                                                        <td>${seqObj.sample_date?date}</td>
                                                        <td>${seqObj.admission_date?date}</td>
                                                        <td><@personType is_hcw=seqObj.is_healthcare_worker/></td>
                                                    </tr>
                                                    <#assign sequenceRowNumber = sequenceRowNumber + {seqObj["sequence.sequenceID"]: matchRowNumber}>
                                                    <#if matchRowNumber == maxUnitMatchesToDisplay>
                                                        <#break>
                                                    </#if>
                                                </#if>
                                            </#list></#if>
                                            </tbody>
                                        </table>
                                    </div>
                                </#if>
                            </div>
                            <div class="border rounded border-dark d-inline-block w-100 pt-0" style="margin-bottom: 10px;">
                                <#if institutionCloseMatchCount == 0>
                                    <p class="text-center mb-0" style="font-size: 24px;">No matches elsewhere in hospital</p>
                                <#else>
                                    <#if hociReport.focusSequence.days_admission_to_onset gte 8 && hociReport.statistics.posteriorCommunityInfection?number gte 50>
                                        Matches elsewhere in hospital
                                    <#else>
                                        <p class="text-center mb-0 <@probTextCSS p=institutionProb/>" style="font-size: 24px;">
                                            <@warningSymbol p=institutionProb/>Infection within hospital ${getRiskSentence(institutionProb)?no_esc}<@warningSymbol p=institutionProb/>
                                        </p>
                                    </#if>
                                    <div class="table-responsive" style="font-size: 18px;">
                                        <table class="table mb-1">
                                             <thead>
                                                 <tr style="color: rgb(0,0,0);">
                                                     <th>Number</th>
                                                     <th>Sample ID</th>
                                                     <th>COG-UK ID</th>
                                                     <th>Unit</th>
                                                     <th>Other unit(s)</th>
                                                     <th>Sample date</th>
                                                     <th>Admission date</th>
                                                     <th>Type</th>
                                                 </tr>
                                             </thead>
                                             <tbody style="color: rgb(0,0,0);">
                                                 <#if hociReport.institutionReferenceSet?has_content><#list hociReport.institutionReferenceSet as seqObj>
                                                     <#if seqObj.isCloseMatch>
                                                         <#assign matchRowNumber = matchRowNumber + 1>
                                                         <tr>
                                                             <td>${matchRowNumber}</td>
                                                             <td>${seqObj.senderSampleID!"-"}</td>
                                                             <td>${seqObj["sequence.sequenceID"]}</td>
                                                             <td><#if seqObj.unit_id?has_content>
                                                                     <#if hociReport.focusSequence.all_units?seq_contains(seqObj.unit_id)>
                                                                         <span style="border-bottom:2px solid #000">${seqObj.unit_id}</span>
                                                                     <#else>
                                                                         ${seqObj.unit_id}
                                                                     </#if>
                                                                 <#else>-</#if></td>
                                                             <td><@formatOtherUnits sequence=seqObj/></td>
                                                             <td>${seqObj.sample_date?date}</td>
                                                             <td><#if seqObj.admission_date??>${seqObj.admission_date?date}<#else>-</#if></td>
                                                             <td><@personType is_hcw=seqObj.is_healthcare_worker/></td>
                                                         </tr>
                                                         <#assign sequenceRowNumber = sequenceRowNumber + {seqObj["sequence.sequenceID"]: matchRowNumber}>
                                                         <#if matchRowNumber == totalRowsToDisplay>
                                                            <#break>
                                                         </#if>
                                                     </#if>
                                                 </#list></#if>
                                             </tbody>
                                         </table>
                                    </div>
                                </#if>
                            </div>
                            <p class="text-left border rounded border-dark font-weight-bold" style="margin-bottom: 10px; padding: 10px; border-width: thick!important;">Please check IPC data, and PATIENT and HCW movement, particularly for the 10-14 days preceding the date of the focus patient's sample. <@detailedReportMessage/></p>
                            <div class="border rounded" style="padding: 10px; font-size: 18px;">
                                <ul class="mb-0">
                                    <#if hociReport.statistics.posteriorUnitInfection?number lt 50
                                    && hociReport.statistics.posteriorInstitutionInfection?number lt 50
                                    && hociReport.statistics.posteriorUnitInfection?number + hociReport.statistics.posteriorInstitutionInfection?number gte 50>
                                        <li>
                                            <span class="<@probTextCSS p=50/>">
                                                <@warningSymbol p=50/> Overall, this is a probable unit- or institution-acquired infection with source unclear.
                                            </span>
                                        </li>
                                    </#if>
                                    <li>
                                        <span class="<@probTextCSS p=hociReport.statistics.posteriorVisitorInfection?number/>">
                                            <@warningSymbol p=hociReport.statistics.posteriorVisitorInfection?number/>
                                            Infection from a visitor ${verbalProbability(hociReport.statistics.posteriorVisitorInfection?number)}*
                                            <#if hociReport.focusSequence.visitors_on_ward>
                                                (visitors allowed on unit)
                                            <#else>
                                                (visitors not allowed on unit)
                                            </#if>
                                        </span>
                                    </li>
                                    <li>
                                        <span class="<@probTextCSS p=hociReport.statistics.posteriorCommunityInfection?number/>">
                                            <@warningSymbol p=hociReport.statistics.posteriorCommunityInfection?number/>
                                            <#if hociReport.focusSequence.days_admission_to_onset gt 14 && hociReport.statistics.posteriorCommunityInfection?number gte 50>
                                                This is a definite HCAI based on admission date, but we have not found genetic evidence of transmission within the hospital.
                                            <#elseif hociReport.focusSequence.days_admission_to_onset gte 8 && hociReport.focusSequence.days_admission_to_onset lte 14 && hociReport.statistics.posteriorCommunityInfection?number gte 50>
                                                This is a probable HCAI based on admission date, but we have not found genetic evidence of transmission within the hospital
                                            <#else>
                                                Community-acquired infection ${verbalProbability(hociReport.statistics.posteriorCommunityInfection?number)}*
                                            </#if>
                                       </span>
                                    </li>
                                </ul>
                            </div>
                            <#if unitCloseMatchCount == 0 && institutionCloseMatchCount == 0 && communityCloseMatchCount == 0>
                            <div class="border rounded mt-2" style="padding: 10px; font-size: 18px;">
                               <p class="mb-0">
                                No closely matched sequences were found within the unit, hospital or community datasets. All probability statements are based purely on time from admission to symptom onset or sample date for the focus case.
                                </p>
                            </div>
                            </#if>
                            <p class="mb-0 font-italic" style="font-size: 15px; margin-top: 10px;">&nbsp;&nbsp;* likelihood of transmission risk: 0-30% low ; 30-50% moderately low; 50-70% probable; 70-85% high; 85-100% very high</p>
                        </div>
                    </div>

                    <#-- timeline plot -->
                    <div class="card mb-3">
                        <div class="card-header py-1">
                            <h3 class="text-primary font-weight-bold m-0">Timeline</h3>
                        </div>
                        <div><canvas id="hociChart" class="w-100" style="height:320px"></canvas></div>
                    </div>

                    <#-- report information -->
                    <div class="card mb-3">
                        <div class="card-body m-0 p-0 pl-3 pt-1">
                            <div class="table-responsive m-0 p-0" style="font-size: 14px;">
                                <table class="table table-borderless mb-0">
                                    <tbody>
                                        <tr>
                                            <td class="m-0 p-0">Generated on: ${hociReport.reportGenerationDate?date}</td>
                                            <td class="m-0 p-0">CoV-GLUE version: ${hociReport.projectVersion}</td>
                                            <td class="m-0 p-0">HOCI version: ${hociReport.hociExtensionVersion}</td>
                                        </tr>
                                        <tr>
                                            <td class="m-0 p-0">GLUE version: ${hociReport.glueVersion}</td>
                                            <td class="m-0 p-0">COG-UK version: ${hociReport.cogukExtensionVersion}</td>
                                            <td class="m-0 p-0">Author: Josh Singer &lt;josh.singer@glasgow.ac.uk&gt;</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.0/js/bootstrap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.3/Chart.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@0.7.0"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-annotation/0.5.7/chartjs-plugin-annotation.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-easing/1.4.1/jquery.easing.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.8.35/dayjs.min.js"></script>
    <script>
        // first row is unit, second row is institution
        var rows = ["unit", "institution"]
        var row_count = rows.length;

        // types of samples
        var sample_types = ["focus", "close_match", "no_match"]

        // number of individual sample points to fit within a single cell
        var cell_width = 1;
        var cell_height = 4;

        // calculate the date range for the plot
        var focus_sample_date = dayjs("${hociReport.focusSequence.sample_date?date}", "YYYY-MM-DD");
        var three_weeks_ago = focus_sample_date.add(-21, 'day');
        var one_week_ahead = focus_sample_date.add(7, 'day');

        var start_date = three_weeks_ago.clone();
        var all_days = [];

        while (start_date <= one_week_ahead) {
            all_days.push(start_date.format("D/M"));
            start_date = start_date.add(1, 'day');
        }

        // we always have 29 days (need to check other ranges if we want this to be dynamic)
        console.assert(all_days.length === 29, 'plot date range must cover exactly 29 days')

        samples = {};

        rows.forEach(function(row) {
            samples[row] = {};
            sample_types.forEach(function(sample_type) {
                    samples[row][sample_type] = new Array(all_days.length);
                    for (var i = 0; i < all_days.length; i++) {
                        samples[row][sample_type][i] = [];
                    }
                }
            )
        })

        <#-- populate the sample array with samples from unit -->
        <#if hociReport.unitReferenceSet?has_content>
            <#list hociReport.unitReferenceSet as seqObj>
                var unit_date_index = all_days.indexOf('${seqObj.sample_date?string["d/M"]}')
                var entry = {'row_id': 0, 'is_hcw': ${seqObj.is_healthcare_worker?c}}
                <#if seqObj.isCloseMatch>
                    <#if sequenceRowNumber[seqObj['sequence.sequenceID']]??>entry['row_id'] = ${sequenceRowNumber[seqObj['sequence.sequenceID']]};</#if>
                    samples.unit.close_match[unit_date_index].push(entry);
                <#else>
                    samples.unit.no_match[unit_date_index].push(entry);
                </#if>
            </#list>
        </#if>

        <#-- populate the sample array with samples from institution -->
        <#if hociReport.institutionReferenceSet?has_content>
            <#list hociReport.institutionReferenceSet as seqObj>
                var inst_date_index = all_days.indexOf('${seqObj.sample_date?string["d/M"]}')
                var entry = {'row_id': 0, 'is_hcw': ${seqObj.is_healthcare_worker?c}}
                <#if seqObj.isCloseMatch>
                    <#if sequenceRowNumber[seqObj['sequence.sequenceID']]??>entry['row_id'] = ${sequenceRowNumber[seqObj['sequence.sequenceID']]};</#if>
                    samples.institution.close_match[inst_date_index].push(entry);
                <#else>
                    samples.institution.no_match[inst_date_index].push(entry);
                </#if>
            </#list>
        </#if>

        <#-- place the focus sample -->
        samples.unit.focus[all_days.indexOf('${hociReport.focusSequence.sample_date?string["d/M"]}')].push(0);

        // given the `sample` data structure, calculates the coordinates of sample point
        function get_sample_coordinates(samples) {
            var data = {
                focus: [],
                close_match: [],
                no_match: []
            };

            // unit/insitution row coordinates
            var row_offset = {
                unit: 0,
                institution: 1
            };

            // helper function to calculate the position of a point within the cell
            function get_offset(currentX, currentY) {
                currentY += 1 / (cell_height + 1);
                if (currentY === 1) {
                    currentX += 1 / (cell_width + 1);
                    currentY = 1 / (cell_height + 1)
                }
                return [currentX, currentY];
            }

            // helper function to add coordinates for sample to `data` dictionary
            // returns the updated relative position for the next point
            function add_sample_coord(count, abs_x, rel_x, abs_y, rel_y, array) {
                for (var j = 0; j < count.length; j++) {
                    array.push({
                        x: abs_x + rel_x,
                        y: abs_y + rel_y,
                        count: count[j]['row_id'],
                        is_hcw: count[j]['is_hcw']
                    });
                    [rel_x, rel_y] = get_offset(rel_x, rel_y);
                }
                return [rel_x, rel_y];
            }

            // iterate over each row (i.e. unit/institution)
            rows.forEach(function(item) {
                // iterate over each day for the unit
                for (var i = 0; i < all_days.length; i++) {
                    // initialise the relative position of the point (within the cell)
                    var rel_x = 1 / (cell_width + 1);
                    var rel_y = 1 / (cell_height + 1);

                    // iterate over each type of sample for this day
                    for (var j = 0; j < sample_types.length; j++) {
                        var point = sample_types[j];
                        // add coordinates for this point to data structure and get updated position of next point
                        [rel_x, rel_y] = add_sample_coord(samples[item][point][i], i, rel_x, row_offset[item], rel_y, data[point]);
                    }
                }
            });

            return data;
        }

        data = get_sample_coordinates(samples);

        var pointStyleLookup = function(context) {
            if ((context.dataIndex < context.dataset.data.length) && context.dataset.data[context.dataIndex].is_hcw) {
                return 'rect';
            } else {
                return 'circle';
            }
        };
        var radiusLookup = function(context) {
            if ((context.dataIndex < context.dataset.data.length) && context.dataset.data[context.dataIndex].is_hcw) {
                return 13;
            } else {
                return 10;
            }
        };

        var scatterChartData = {
            datasets: [
                {
                    label: 'Focus sample',
                    data: data.focus,
                    showLine: false,
                    pointStyle: 'rect',
                    backgroundColor: '#4e73df',
                    borderColor: '#4e73df',
                    datalabels: {
                        display: false
                    },
                    radius: 11,
                    rotation: 45
                },
                {
                    label: 'Close match (square: HCW)',
                    data: data.close_match,
                    showLine: false,
                    pointStyle: pointStyleLookup,
                    backgroundColor: 'white',
                    borderColor: '#4e73df',
                    borderWidth: 2,
                    radius: radiusLookup,
                    datalabels: {
                        display: true,
                        formatter: function(value, context) {
                            if (value['count'] > 0) {
                                return value['count'].toString();
                            } else {
                                return '';
                            }
                        },
                        font: {
                            size: 16
                        }
                    }
                },
                {
                    label: 'Not close match',
                    data: data.no_match,
                    showLine: false,
                    pointStyle: 'line',
                    borderColor: 'rgba(0, 0, 0, 0.5)',
                    borderWidth: 3,
                    radius: 4,
                    datalabels: {
                        display: false
                    }
                }
            ]
        };

        // overlay the plot with text (for unit/institution labels on rows)
        var plugin = {
            afterDraw: function(chart) {
                var ctx = chart.chart.ctx;
                ctx.restore();
                ctx.font = "0.8em sans-serif";
                ctx.fillStyle = "black";
                ctx.textAlign = "left";
                ctx.textBaseline = "top";
                var x = chart.scales['x-axis-1'].getPixelForValue(0);
                var unit_y = chart.scales['y-axis-1'].getPixelForValue(0 - 0.05)
                ctx.fillText("${hociReport.focusSequence.unit_id}", x , unit_y);
                var inst_y = chart.scales['y-axis-1'].getPixelForValue(1 - 0.05)
                ctx.fillText("${hociReport.focusSequence.institution_id}", x, inst_y);
                ctx.font = "0.6em sans-serif";
                ctx.fillText("High Risk Transmission Period",
                    chart.scales['x-axis-1'].getPixelForValue(11.85),
                    chart.scales['y-axis-1'].getPixelForValue(2 - 0.15)
                );
                ctx.save();
            }
        };
        Chart.plugins.register(plugin);

        var scatterChart = new Chart(document.getElementById('hociChart').getContext('2d'), {
            type: 'scatter',
            data: scatterChartData,
            options: {
                responsive: false,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                events: [], // disables all events
                scales: {
                    yAxes: [{
                        ticks: {
                            display: false,
                            reverse: true,
                            suggestedMin: 0,
                            suggestedMax: rows.length,
                            stepSize: 1
                        },
                        gridLines: {
                            display: true
                        }
                    }],
                    xAxes: [{
                        ticks: {
                            suggestedMin: 0,
                            suggestedMax: all_days.length,
                            stepSize: 1,
                            labelOffset: 17, // urgh, hardcoded
                            callback: function(value, index, values) {
                                return all_days[index];
                            }
                        },
                        gridLines: {
                            display: true,
                            zeroLineColor: 'rgba(0, 0, 0, 0.1)'
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Sample date'
                        }
                    }]
                },
                title: {
                    display: false
                },
                legend: {
                    display: true,
                    labels: {
                        usePointStyle: true
                    }
                },
                elements: {
                    point: {
                        radius: 10
                    }
                },
                annotation: {
                    drawTime: 'beforeDatasetsDraw',
                    events: [],
                    annotations: [{
                        type: 'box',
                        xScaleID: 'x-axis-1',
                        yScaleID: 'y-axis-1',
                        xMin: 9,
                        xMax: 19,
                        yMin: 0,
                        yMax: 2,
                        backgroundColor: 'rgba(254, 226, 227, 0.5)',
                        borderColor: 'rgb(254, 226, 227)',
                        borderWidth: 1
                    }]
                }
            }
        });
    </script>
</body>

</html>
