function GSheetsapi({ apiKey, sheetId, sheetName, sheetNumber = 1 }) {
    try {
        const sheetNameStr = sheetName && sheetName !== '' ? encodeURIComponent(sheetName) : `Sheet${sheetNumber}`
        const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetNameStr}?dateTimeRenderOption=FORMATTED_STRING&majorDimension=ROWS&valueRenderOption=FORMATTED_VALUE&key=${apiKey}`;

        return fetch(sheetsUrl)
            .then(response => {
                if (!response.ok) {
                    console.log('there is an error in the gsheets response');
                    throw new Error('Error fetching GSheet');
                }
                return response.json();
            })
            .then(data => data)
            .catch(err => {
                throw new Error(
                    'Failed to fetch from GSheets API. Check your Sheet Id and the public availability of your GSheet.'
                );
            });
    } catch (err) {
        throw new Error(`General error when fetching GSheet: ${err}`);
    }
};

function matchValues(valToMatch, valToMatchAgainst, matchingType) {
    try {
        if (typeof valToMatch != 'undefined') {
            valToMatch = valToMatch.toLowerCase().trim();
            valToMatchAgainst = valToMatchAgainst.toLowerCase().trim();

            if (matchingType === 'strict') {
                return valToMatch === valToMatchAgainst;
            }

            if (matchingType === 'loose') {
                return (
                    valToMatch.includes(valToMatchAgainst) ||
                    valToMatch == valToMatchAgainst
                );
            }
        }
    } catch (e) {
        console.log(`error in matchValues: ${e.message}`);
        return false;
    }

    return false;
}

function filterResults(resultsToFilter, filter, options) {
    let filteredData = [];

    // now we have a list of rows, we can filter by various things
    return resultsToFilter.filter(item => {

        // item data shape
        // item = {
        //   'Module Name': 'name of module',
        //   ...
        //   Department: 'Computer science'
        // }

        let addRow = null;
        let filterMatches = [];

        if (
            typeof item === 'undefined' ||
            item.length <= 0 ||
            Object.keys(item).length <= 0
        ) {
            return false;
        }

        Object.keys(filter).forEach(key => {
            const filterValue = filter[key]; // e.g. 'archaeology'

            // need to find a matching item object key in case of case differences
            const itemKey = Object.keys(item).find(thisKey => thisKey.toLowerCase().trim() === key.toLowerCase().trim());
            const itemValue = item[itemKey]; // e.g. 'department' or 'undefined'

            filterMatches.push(
                matchValues(itemValue, filterValue, options.matching || 'loose')
            );
        });

        if (options.operator === 'or') {
            addRow = filterMatches.some(match => match === true);
        }

        if (options.operator === 'and') {
            addRow = filterMatches.every(match => match === true);
        }

        return addRow;
    });
}

function processGSheetResults(
    JSONResponse,
    returnAllResults,
    filter,
    filterOptions
) {
    const data = JSONResponse.values;
    const startRow = 1; // skip the header row(1), don't need it

    let processedResults = [{}];
    let colNames = {};

    for (let i = 0; i < data.length; i++) {
        // Rows
        const thisRow = data[i];

        for (let j = 0; j < thisRow.length; j++) {
            // Columns/cells
            const cellValue = thisRow[j];
            const colNameToAdd = colNames[j]; // this will be undefined on the first pass

            if (i < startRow) {
                colNames[j] = cellValue;
                continue; // skip the header row
            }

            if (typeof processedResults[i] === 'undefined') {
                processedResults[i] = {};
            }

            if (typeof colNameToAdd !== 'undefined' && colNameToAdd.length > 0) {
                processedResults[i][colNameToAdd] = cellValue;
            }
        }
    }

    // make sure we're only returning valid, filled data items
    processedResults = processedResults.filter(
        result => Object.keys(result).length
    );

    // if we're not filtering, then return all results
    if (returnAllResults || !filter) {
        return processedResults;
    }

    return filterResults(processedResults, filter, filterOptions);
}

function gsheetProcessor(options, callback, onError) {
    const { apiKey, sheetId, sheetName, sheetNumber, returnAllResults, filter, filterOptions } = options

    if (!options.apiKey || options.apiKey === undefined) {
        throw new Error('Missing Sheets API key');
    }

    return GSheetsapi({
        apiKey,
        sheetId,
        sheetName,
        sheetNumber
    })
        .then(result => {
            const filteredResults = processGSheetResults(
                result,
                returnAllResults || false,
                filter || false,
                filterOptions || {
                    operator: 'or',
                    matching: 'loose'
                }
            );

            callback(filteredResults);
        })
        .catch(err => onError(err.message));
};

gsheetProcessor(
    {
        sheetId: "1z92C5CPb5CNhkZ8d7sLNJAb0jc-A6NyUvlK6VtlIk50",
        sheetNumber: 1,
        returnAllResults: true,
        // Note: this API Key is locked to this demo, it can't be
        // used in your own projects.
        apiKey: "AIzaSyD4ZoTrXMfF7mhAMVNNiensNsWL5XC6Sqo",
    },
    (results) => {

        var parsedData = [];
        results.forEach((result) => {
            var personName = result["Person Name"];
            if (personName != "" && personName != "undefined") {
                let node = { data: { id: personName }, style: { 'background-color': result["Circle Color"], 'color': result["Text Color"] } };
                parsedData.push(node);
            }
        });

        results.forEach((result) => {
            var relationshipNameA = result["Relationship Name A"];
            var relationshipNameB = result["Relationship Name B"];
            if (relationshipNameA != "" && relationshipNameA != "undefined" && relationshipNameB != "" && relationshipNameB != "undefined") {
                let edge = { data: { id: relationshipNameA + '↔' + relationshipNameB, source: relationshipNameA, target: relationshipNameB } };
                parsedData.push(edge);
            }
        });

        var dataFinal = JSON.stringify(parsedData);
        var jsonData = JSON.parse(dataFinal);

        document.getElementById(
            "app"
        ).innerHTML += `<p>${dataFinal}</p>`;

        ////results.forEach((result) => {
        ////    document.getElementById(
        ////        "app"
        ////    ).innerHTML += `<p>${result["Person Name"]} ${result["Circle Color"]} ${result["Text Color"]} ${result["Relationship Name A"]} ${result["Relationship Name B"]}</p>`;
        ////});
    },
    (error) => {
        document.getElementById("app").innerHTML += `<p>error: ${error}</p>`;
    }
);
