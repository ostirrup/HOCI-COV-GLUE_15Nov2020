<#setting date_format="dd-MMM-yyyy">

<#macro personType is_hcw>
    <#if is_hcw>HCW<#else>Patient</#if>
</#macro>

<#macro formatUnits u="">
    <#if u?has_content>${u?replace("|", "; ")}</#if>
</#macro>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
    <title>COG-UK HOCI Detailed Report</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Nunito:200,200i,300,300i,400,400i,600,600i,700,700i,800,800i,900,900i">
    <style>
        ${getResourceAsString('hociReports.bootstrap.min.css')?no_esc}
    </style>
    <style>
        ${getResourceAsString('hociDetailedReport.template.css')?no_esc}
    </style>
</head>

<body id="page-top">
    <div id="wrapper">
        <div class="d-flex flex-column" id="content-wrapper">
            <div id="content">
                <div class="container-fluid">
                    <#-- header -->
                    <div class="d-inline-block mb-1">
                        <h1 class="mb-0 font-weight-bold text-dark pt-2 float-left">COG-UK HOCI Detailed Report</h1>
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
                                                    <th class="border-top-0" style="width: 281px;">Institution</th>
                                                    <td class="border-top-0">${hociReport.focusSequence.institution_id}</td>
                                                </tr>
												<tr>
                                                    <th>Unit</th>
                                                    <td>${hociReport.focusSequence.unit_id}</td>
                                                </tr>
												<tr>
                                                    <th>Unit History</th>
                                                    <td><@formatUnits u=hociReport.focusSequence.unit_history_pre/></td>
                                                </tr>
												 <tr>
                                                    <th>Sample date</th>
                                                    <td>${hociReport.focusSequence.sample_date?date}</td>
                                                </tr>
												<tr>
                                                    <th>Admission date</th>
                                                    <td>${hociReport.focusSequence.admission_date?date}</td>
												</tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="table-responsive">
                                        <table class="table text-dark mb-0">
                                            <tbody>
												<tr>
                                                    <th class="border-top-0" style="width: 281px;">Symptomatic?</th>
                                                    <td class="border-top-0"><#if hociReport.focusSequence.symptomatic>Yes<#else>No</#if></td>
                                                </tr>
												<#if hociReport.focusSequence.symptomatic && hociReport.focusSequence.symptom_onset_date??>
													<tr>
														<th>Symptom onset date</th>
														<td>${hociReport.focusSequence.symptom_onset_date?date}</td>
													</tr>
												</#if>
												<tr>
													<th>Is the patient a HCW?</th>
													<td><#if hociReport.focusSequence.is_healthcare_worker>Yes<#else>No</#if></td>
												</tr>
												<tr>
													<th>Visitors on ward?</th>
													<td><#if hociReport.focusSequence.visitors_on_ward>Yes<#else>No</#if></td>
												</tr>
											</tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <#-- focus sequence characteristics -->
                    <div class="card mb-3">
                        <div class="card-header py-1">
                            <h3 class="text-primary font-weight-bold m-0">Focus sequence characteristics</h3>
                        </div>

                        <div class="card-body py-2">
							<div class="table-responsive">
								<table class="table text-dark mb-0">
									<tbody>
										<tr>
											<th class="border-top-0" style="width: 281px;">Lineage</th>
											<td class="border-top-0">${hociReport.focusSequence["sequence.cov_glue_lineage"]}</td>
										</tr>
										<tr>
											<th>CSR coverage</th>
											<td>${hociReport.statistics.focusSeqGenomeCoveragePct}%</td>
										</tr>
										<tr>
											<th>SNPs</th>
											<td><#if hociReport.focusSequence.snps?? && hociReport.focusSequence.snps?size gt 0>${hociReport.focusSequence.snps?join(", ")}<#else>None</#if></td>
										</tr>
									</tbody>
								</table>
							</div>
                        </div>
                    </div>

					<#-- summary statistics -->
                    <div class="card mb-3">
                        <div class="card-header py-1">
                            <h3 class="float-left text-primary font-weight-bold m-0">Summary statistics</h3>
                        </div>
                        <div class="card-body p-0 pl-3 pr-3">
                            <div class="row text-dark">
                                <div class="col">
                                    <div class="table-responsive">
                                        <table class="table text-dark mb-0">
                                            <tbody>
                                                <tr>
													<th class="border-top-0" style="width: 400px;">Prior probability of post-admission infection</th>
													<td class="border-top-0">${hociReport.statistics.priorProbability}%</td>
												</tr>
												<tr>
													<th>Posterior probability (unit)</th>
													<td>${hociReport.statistics.posteriorUnitInfection}%</td>
												</tr>
												<tr>
													<th>Posterior probability (institution)</th>
													<td>${hociReport.statistics.posteriorInstitutionInfection}%</td>
												</tr>
												<tr>
													<th>Posterior probability (visitor)</th>
													<td>${hociReport.statistics.posteriorVisitorInfection}%</td>
												</tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div class="col">
                                    <div class="table-responsive">
                                        <table class="table text-dark mb-0">
                                            <tbody>
                                                <tr>
													<th class="border-top-0" style="width: 400px;">Posterior probability (community)</th>
													<td class="border-top-0">${hociReport.statistics.posteriorCommunityInfection}%</td>
												</tr>
												<tr>
													<th>Match proportion (unit)</th>
													<td>${hociReport.statistics.unitMatchProportion}%</td>
												</tr>
												<tr>
													<th>Match proportion (institution)</th>
													<td>${hociReport.statistics.institutionMatchProportion}%</td>
												</tr>
												<tr>
													<th>Weighted match proportion (community)</th>
													<td>${hociReport.statistics.communityMatchProportion}%</td>
												</tr>		
											</tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

					<#-- unit reference set -->
                    <div class="card mb-3 table-block">
                        <div class="card-header py-1">
                            <h3 class="text-primary font-weight-bold m-0">Unit reference set for ${hociReport.focusSequence.unit_id}</h3>
                        </div>

                        <div class="card-body py-2">
							<#if hociReport.unitReferenceSet?? && hociReport.unitReferenceSet?size gt 0>
								<div class="table-responsive" style="font-size: 13px;">
									<table class="table mb-1">
										<colgroup>
											<col width="10%">
											<col width="7%">
											<col width="7%">
											<col width="7%">
											<col width="10%">
											<col width="7%">
											<col width="10%">
											<col width="10%">
											<col width="10%">
											<col width="10%">
											<col width="5%">
											<col width="5%">
											<col width="2%">
										</colgroup>
										<thead>
											<tr class="no-border" style="color: rgb(0,0,0);">
												<th>Sequence ID</th>
												<th>Lineage</th>
												<th>CSR coverage</th>
												<th>Healthcare worker?</th>
												<th>Admission date</th>
												<th>Symptomatic?</th>
												<th>Symptom onset date</th>
												<th>Sample date</th>
												<th>SNPs absent in focus</th>
												<th>Focus SNPs absent</th>
												<th>Locations without coverage</th>
												<th>Close match?</th>
												<th>Unit history</th>
											</tr>
										</thead>
										<tbody style="color: rgb(0,0,0);">
											<#list hociReport.unitReferenceSet as seqObj>
												<tr>
													<td>${seqObj["sequence.sequenceID"]}</td>
													<td>${seqObj["sequence.cov_glue_lineage"]}</td>
													<td>${seqObj.csr_coverage}%</td>
													<td><#if seqObj.is_healthcare_worker>Yes<#else>No</#if></td>
													<td><#if seqObj.admission_date??>${seqObj.admission_date?date}<#else>-</#if></td>
													<td><#if seqObj.symptomatic?? && seqObj.symptomatic>Yes<#else>No</#if></td>
													<td><#if seqObj.symptom_onset_date??>${seqObj.symptom_onset_date?date}<#else>-</#if></td>
													<td>${seqObj.sample_date?date}</td>
													<td><#if seqObj.snpsAbsentInFocus?? && seqObj.snpsAbsentInFocus?size gt 0>${seqObj.snpsAbsentInFocus?join(", ")}<#else>None</#if></td>
													<td><#if seqObj.focusSnpsAbsent?? && seqObj.focusSnpsAbsent?size gt 0>${seqObj.focusSnpsAbsent?join(", ")}<#else>None</#if></td>
													<td>
														<#if seqObj.numSnpLocationsWithInsufficientCoverage = 0>None<#else>
														${seqObj.numSnpLocationsWithInsufficientCoverage}/${seqObj.numSnpLocations}
														</#if>
													</td>
													<td><#if seqObj.isCloseMatch>Yes<#else>No</#if></td>
													<td>${seqObj.unit_history_pre!"-"}</td>
												</tr>
											</#list>
										</tbody>
									</table>
								</div>
							<#else>
								Unit reference set was empty.
							</#if>                     
                        </div>
                    </div> 

					<#-- institution reference set -->
                    <div class="card mb-3 table-block">
                        <div class="card-header py-1">
                            <h3 class="text-primary font-weight-bold m-0">Institution reference set for ${hociReport.focusSequence.institution_id}</h3>
                        </div>

                        <div class="card-body py-2">
						<#if hociReport.institutionReferenceSet?? && hociReport.institutionReferenceSet?size gt 0>
								<div class="table-responsive" style="font-size: 13px;">
									<table class="table mb-1">
										<colgroup>
											<col width="10%">
											<col width="7%">
											<col width="7%">
											<col width="7%">
											<col width="10%">
											<col width="7%">
											<col width="10%">
											<col width="10%">
											<col width="10%">
											<col width="10%">
											<col width="5%">
											<col width="5%">
											<col width="1%">
											<col width="1%">
										</colgroup>
										<thead>
											<tr class="no-border" style="color: rgb(0,0,0);">
												<th>Sequence ID</th>
												<th>Lineage</th>
												<th>CSR coverage</th>
												<th>Healthcare worker?</th>
												<th>Patient location</th>
												<th>Admission date</th>
												<th>Symptomatic?</th>
												<th>Symptom onset date</th>
												<th>Sample date</th>
												<th>SNPs absent in focus</th>
												<th>Focus SNPs absent</th>
												<th>Locations without coverage</th>
												<th>Close match?</th>
												<th>Unit history</th>
											</tr>
										</thead>
										<tbody style="color: rgb(0,0,0);">
											<#list hociReport.institutionReferenceSet as seqObj>
												<tr>
													<td>${seqObj["sequence.sequenceID"]}</td>
													<td>${seqObj["sequence.cov_glue_lineage"]}</td>
													<td>${seqObj.csr_coverage}%</td>
													<td><#if seqObj.is_healthcare_worker>Yes<#else>No</#if></td>
													<td><#if seqObj.admission_status??><#if seqObj.admission_status = 'inpatient'>
														${seqObj.unit_id}
														<#elseif seqObj.admission_status = 'a_and_e_patient'>
														A &amp; E patient
														<#elseif seqObj.admission_status = 'outpatient'>
														Outpatient	
														<#elseif seqObj.admission_status = 'not_a_patient'>
														Not a patient
														</#if><#else>-</#if></td>

													<td><#if seqObj.admission_date??>${seqObj.admission_date?date}<#else>-</#if></td>
													<td><#if seqObj.symptomatic?? && seqObj.symptomatic>Yes<#else>No</#if></td>
													<td><#if seqObj.symptom_onset_date??>${seqObj.symptom_onset_date?date}<#else>-</#if></td>
													<td>${seqObj.sample_date?date}</td>
													<td><#if seqObj.snpsAbsentInFocus?? && seqObj.snpsAbsentInFocus?size gt 0>${seqObj.snpsAbsentInFocus?join(", ")}<#else>None</#if></td>
													<td><#if seqObj.focusSnpsAbsent?? && seqObj.focusSnpsAbsent?size gt 0>${seqObj.focusSnpsAbsent?join(", ")}<#else>None</#if></td>
													<td><#if seqObj.numSnpLocationsWithInsufficientCoverage = 0>None<#else>
														${seqObj.numSnpLocationsWithInsufficientCoverage}/${seqObj.numSnpLocations}</#if></td>
													<td><#if seqObj.isCloseMatch>Yes<#else>No</#if></td>
													<td>${seqObj.unit_history_pre!"-"}</td>
												</tr>
											</#list>
										</tbody>
									</table>
								</div>
							<#else>
								Institution reference set was empty.
							</#if>                     
                        </div>
                    </div>

					<#-- community reference set -->
                    <div class="card mb-3 table-block">
                        <div class="card-header py-1">
                            <h3 class="text-primary font-weight-bold m-0">Community reference set</h3>
                        </div>

                        <div class="card-body py-2">
						<#if hociReport.communityReferenceSet?? && hociReport.communityReferenceSet?size gt 0>
								<div class="table-responsive" style="font-size: 13px;">
									<table class="table mb-1">
										<colgroup>
											<col width="10%">
											<col width="7%">
											<col width="7%">
											<col width="7%">
											<col width="10%">
											<col width="7%">
											<col width="10%">
											<col width="10%">
											<col width="10%">
											<col width="5%">
											<col width="7%">
										</colgroup>	
										<thead>
											<tr class="no-border" style="color: rgb(0,0,0);">
												<th>Sequence ID</th>
												<th>Lineage</th>
												<th>CSR coverage</th>
												<th>Healthcare worker?</th>
												<th>Sample date</th>
												<th>Sampling location</th>
												<th>Distance to focus</th>
												<th>SNPs absent in focus</th>
												<th>Focus SNPs absent</th>
												<th>Locations without coverage</th>
												<th>Close match?</th>
											</tr>
										</thead>
										<tbody style="color: rgb(0,0,0);">
											<#list hociReport.communityReferenceSet as seqObj>
												<tr>
													<td>${seqObj["sequence.sequenceID"]}</td>
													<td>${seqObj["sequence.cov_glue_lineage"]}</td>
													<td>${seqObj.csr_coverage}%</td>
													<td><#if seqObj.is_healthcare_worker?? && seqObj.is_healthcare_worker>Yes<#else>No</#if></td>
													<td>${seqObj.sample_date?date}</td>
													<td><#if seqObj.institution_id??>${seqObj.institution_id}<#else>${seqObj.sampling_centre_id}</#if></td>
													<td><#if seqObj.distanceToFocusKm??>${seqObj.distanceToFocusKm} km<#else>-</#if></td>
													<td><#if seqObj.snpsAbsentInFocus?? && seqObj.snpsAbsentInFocus?size gt 0>${seqObj.snpsAbsentInFocus?join(", ")}<#else>None</#if></td>
													<td><#if seqObj.focusSnpsAbsent?? && seqObj.focusSnpsAbsent?size gt 0>${seqObj.focusSnpsAbsent?join(", ")}<#else>None</#if></td>
													<td><#if seqObj.numSnpLocationsWithInsufficientCoverage = 0>None<#else>
														${seqObj.numSnpLocationsWithInsufficientCoverage}/${seqObj.numSnpLocations}</#if></td>
													<td><#if seqObj.isCloseMatch>Yes<#else>No</#if></td>
												</tr>
											</#list>
										</tbody>
									</table>
								</div>
							<#else>
								Community reference set was empty.
							</#if>                     
                        </div>
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
										<tr>
											<td class="m-0 p-0">HOCI site: ${hociReport.hociSiteDisplayName}</td>
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
    
</body>

</html>
