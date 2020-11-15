### Generating the summary and detailed reports

#### Requirements

To generate the report, you need:

* Java 1.8 runtime
* Google Chrome

and clone the [HOCI-COV-GLUE](https://github.com/giffordlabcvr/HOCI-COV-GLUE) repository.

#### Instructions

1. In GLUE, on CLIMB, generate the report in the usual way e.g. 

    ```module hociGenerateReport invoke-function generateReport BIRM-04GA5```
    
2. From CLIMB, download the JSON file for the report (e.g. the file `BIRM-04GA5_hociReport.json`)

3. You need to add fields/keys to the JSON before generating the HTML report. For the focus sequence, the following keys should be added:
    * `{"hociReport": {"focusSequence": {"senderSampleID": "XXXXXXX", ... }, ...}, ... }` - "Sample ID" field in the report.
    * `{"hociReport": {"focusSequence": {"hociID": "XXXXXXX", ... }, ...}, ... }` - "COG-UK HOCI ID" field
    * `{"hociReport": {"focusSequence": {"reportingHub": "XXXXXXX", ... }, ...}, ... }`
    * `{"hociReport": {"focusSequence": {"reportedBy": "XXXXXXX", ... }, ...}, ... }`
4. For each sample in the "unitReferenceSet" and "institutionReferenceSet", the `senderSampleID` key can be added:
    * `{"hociReport": {"unitReferenceSet": [{"senderSampleID": "XXXXXXX", ... }, ...], ... }`
    * Similarly, `{"hociReport": {"institutionReferenceSet": [{"senderSampleID": "XXXXXXX", ... }, ...], ... }`
    
    Here is an example using Python:

    ```python
    import json

    # the basename of the report
    filename = "BIRM-04GA5_hociReport"

    # read the entire json packet
    with open(f'{filename}.json') as json_file:
        data = json.load(json_file)

    hociReport = data['hociReport']

    # Add information to the focus sequence
    focusSequence = hociReport['focusSequence']
    focusSequence['senderSampleID'] = 'LOREM-123'
    focusSequence['hociID'] = 'HOCI-456'
    focusSequence['reportingHub'] = 'Ipsum'
    focusSequence['reportedBy'] = 'Dolor Sit'

    # A simple lookup table for internal sample IDs
    sampleIdLookup = {
        'BIRM-8D354': 'AMET-1234',
        'BIRM-922FD': 'CONS-1234',
        'BIRM-92AB1': 'ECTE-1234',
    }

    # Add these sample IDs to the unit and institution reference sets
    for sequences in (hociReport['unitReferenceSet'], hociReport['institutionReferenceSet']):
        for sequence in sequences:
            if sequence['sequence.sequenceID'] in sampleIdLookup:
                sequence['senderSampleID'] = sampleIdLookup[sequence['sequence.sequenceID']]

    # We can also perform other replacements (e.g. de-anonymisation)
    # Replace all units names with something else...
    myUnitRealNames = {
        'Unit_1': 'ELIT',
        'Unit_2': 'TEMPOR',
        'Unit_3': 'DOLORE'
    }

    # ...in the unit_history_pre field
    for sequences in ([focusSequence], hociReport['unitReferenceSet'], hociReport['institutionReferenceSet']):
        for sequence in sequences:
            if sequence['unit_history_pre']:
                units = sequence['unit_history_pre'].split('|')
                units = [myUnitRealNames[u] for u in units]
                sequence['unit_history_pre'] = '|'.join(units)

    # ...the focus sequence unit
    focusSequence['unit_id'] = myUnitRealNames[focusSequence['unit_id']]

    # Save the updated JSON
    with open(f'{filename}_updated.json', 'w') as outfile:
        json.dump(data, outfile)
    ```

5. Generate the HTML report using the updated JSON. `modules/hociSummaryReport.template.ftlh` is the summary report template and `modules/hociDetailedReport.template.ftlh` is the detailed report template:

    ```sh
    ./hociReportGenerator.sh modules/hociSummaryReport.template.ftlh ./test_data/working_1/BIRM-04GA5_hociReport_updated.json BIRM-04GA5_summary.html
    ```

6. Save the HTML as a PDF document using Google Chrome.

    ```
    chrome --headless --print-to-pdf="BIRM-04GA5_hociSummaryReport.pdf" --print-to-pdf-no-header "file://$(readlink -f BIRM-04GA5_summary.html)"
    ```

