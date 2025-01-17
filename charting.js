const url = "https://sheets.googleapis.com/v4/spreadsheets/1YO-Vl4DO-lnp8sQpFlcX1cDtzxFoVkCmU1PVw_ZHJDg?key=AIzaSyC6dSsmyQw-No2CJz7zuCrMGglNa3WwKHU&includeGridData=true";

let headersWhiteList;
let dataset;
let myChart = null;
titles = {
    'License':'Most appearing licenses in the datasets',
    'Year':'Number of datasets published every year',
    'Dialect':'Distribution of the resources with respect of each country',
    'Domain':'Most appearing domains in the dataests',
    'Form':'Percentage of Text and Spoken datasets',
    'Ethical Risks':'Ethical risks of Arabic NLP datasets',
    'Script':'Scripts of writing Arabic NLP datasets',
    'Host':'Counts of repostories used to host NLP datasets', 
    'Access':'How easy to access most of the data. Upon-Request: means usually the dataset requires registeration, sharing info, email, etc.',
    'Tasks':'Most frequent NLP tasks in the datasets truncated to most 20',
    'Venue Type':'What kind of venues are used to publish NLP datasets'
    
}
function getSeries(data, idx, ignoreOther = true){

    let series = []

    for (let index = 0; index < data.length; index++) {
        if(data[index][idx] === undefined)
            continue
        if (ignoreOther){
            if (data[index][idx]== 'other' || data[index][idx] == 'unknown')
                continue
        }
        if (headersWhiteList[idx] == 'Tasks')
        {
            let tasks = data[index][idx].split(",");
            for (let index = 0; index < tasks.length; index++) {
                series.push(tasks[index].trim())
            }

        }
        else if(headersWhiteList[idx] == 'Dialect')
        {
            let dialect = data[index][idx]
            if (dialect != 'other')
            {
                dialect = dialect.split(':')[0]
                dialect = dialect.split('-')[1]
            }
            
            series.push(dialect.trim())

        }
        else
        {
            series.push(data[index][idx].trim())
        }
        
                 
    }

    return series
}
function groupedBar()
{
    $("#myChart").show();
    $("#chartdiv").hide();

    if (myChart != null)
    {
        myChart.destroy();
    }

    let datasets = []
    let year_idx = headersWhiteList.indexOf('Year')
    let venue_idx = headersWhiteList.indexOf('Venue Type')

    let all_venue_types = Array.from(new Set(getSeries(dataset, venue_idx)))
    let all_years = Array.from(new Set(getSeries(dataset, year_idx))).sort()
    
    let color_theme = palette('tol-dv', all_venue_types.length).map(
        function(hex) {
            return '#' + hex;
    })
    for (var i = 0; i < all_venue_types.length; i++)
    {
        series = []
        let venue_name = all_venue_types[i]

        for (let index = 0; index < dataset.length; index++) {
            if(dataset[index][venue_idx] === undefined || dataset[index][year_idx] === undefined)
                continue
            if (dataset[index][venue_idx].trim() == venue_name)
            {
                series.push(dataset[index][year_idx].trim())
            }           
        }

        const [elements, counts] = getCounts(series)

        let ex_counts = []

        for (let index = 0; index < all_years.length; index++) {
            let year = all_years[index]
            let count_index = elements.indexOf(year)
            if (count_index > -1)
                ex_counts.push(counts[count_index])                
            else
                ex_counts.push(0)

        }

        let colors = []

        for (let _ in ex_counts)
        {
            colors.push(color_theme[i])
        }

        datasets.push({
            label: venue_name,
            data: ex_counts,
            backgroundColor: colors
        });

    }
    const chartdata = {
        labels: all_years,
        datasets: datasets
    }

    var canvas = document.getElementById("myChart");
    var config = {
        type: 'bar',
        data: chartdata,
        options: {
            plugins: {
                title: {
                    display: true,
                    text: titles['Venue Type'],
                }
            }
        }
    }
    myChart = new Chart(canvas, config);
}

function plotBar(col, truncate = 20)
{
    $("#myChart").show();
    $("#chartdiv").hide();
    if (myChart != null)
    {
        myChart.destroy();
    }
    let idx = headersWhiteList.indexOf(col)
    let series = getSeries(dataset, idx)

    var [elements, counts] = getCounts(series)

    elements = elements.slice(0, truncate)
    counts   = counts.slice(0, truncate)

    const chartdata = {
        labels: elements,
        datasets: [{
            axis: 'y',
            label:headersWhiteList[idx],
            data: counts,
            backgroundColor: palette('tol-dv', counts.length).map(
                function(hex) {
                    return '#' + hex;
            })
        }]
    }
    var canvas = document.getElementById("myChart");
    var config = {
        type: 'bar',
        data: chartdata,
        options: {
            plugins: {
                autocolors: {
                mode: 'data'
                },
                title: {
                    display: true,
                    text: titles[col],
                }
            }
        }
    }
    myChart = new Chart(canvas, config);
}

//https://gist.github.com/boukeversteegh/3219ffb912ac6ef7282b1f5ce7a379ad
function sortArrays(arrays, comparator = (a, b) => (a > b) ? -1 : (a < b) ? 1 : 0) {
    let arrayKeys = Object.keys(arrays);
    let sortableArray = Object.values(arrays)[0];
    let indexes = Object.keys(sortableArray);
    let sortedIndexes = indexes.sort((a, b) => comparator(sortableArray[a], sortableArray[b]));
  
    let sortByIndexes = (array, sortedIndexes) => sortedIndexes.map(sortedIndex => array[sortedIndex]);
  
    if (Array.isArray(arrays)) {
      return arrayKeys.map(arrayIndex => sortByIndexes(arrays[arrayIndex], sortedIndexes));
    } else {
      let sortedArrays = {};
      arrayKeys.forEach((arrayKey) => {
        sortedArrays[arrayKey] = sortByIndexes(arrays[arrayKey], sortedIndexes);
      });
      return sortedArrays;
    }
  }

function getCounts(array, sorting = true)
{
    let labels = [],
    counts = [],
    arr = [...array], // clone array so we don't change the original when using .sort()
    prev;

    arr.sort();
    for (let element of arr) {
        if (element !== prev) {
            labels.push(element);
            counts.push(1);
        }
        else ++counts[counts.length - 1];
        prev = element;
    }
    if (sorting)
    {
        [counts, labels] = sortArrays([counts, labels]) 
    }
    return [labels, counts];
}

axios.get(url, ).then(function(response) {
    let rowData = response.data.sheets[0].data[0].rowData
    let headers = []
    headersWhiteList = ['License', 'Year', 'Language', 'Dialect', 'Domain', 'Form', 'Ethical Risks', 'Script', 'Host', 'Access', 'Tasks', 'Venue Type']
    $('.loading-spinner').hide()
    
    // Grabbing header's index's to help us to get value's of just by header index 
    rowData[1].values.filter(header => header.formattedValue != undefined).forEach((header, headerIndex) => {
        if (headersWhiteList.includes(header.formattedValue)){
            headers.push({
                index: headerIndex,
                title: header.formattedValue
            })
        }
    })

    let tempRows = []
    rowData.filter(row => {
        tempRows.push(row.values)
    })
    // Grabbing row's values
    let rows = []
    for (let index = 2; index < tempRows.length; index++) {
        const fields = tempRows[index]
        if (fields != undefined) {
            if (fields[1] != undefined){
                if (fields[1].formattedValue != undefined){
                    rows.push(fields)
                }
            }else{
                break
            }
        }
        
    }
    
    //  Createing table data
    dataset = []
    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        let entry = {}
        for (let index = 0; index < headersWhiteList.length; index++) {
            entry[index] = row[headers[index].index].formattedValue
        }
        dataset.push(entry)
    }
    console.log(dataset)
    var changedText = document.getElementById('myDropdown');

    document.getElementById('myDropdown').addEventListener('change', function() {
        if (this.value == "Venue Type")
            groupedBar(this.value) 
        else if(this.value == "Dialect"){
            let idx = headersWhiteList.indexOf("Dialect")
            let series = getSeries(dataset, idx)
            const [elements, counts] = getCounts(series)
            console.log(elements)
            console.log(counts)
            let groupData = []

            for (let i = 0; i <  counts[0]; i++){
                let group = []

                for (let j = 0; j < counts.length; j++) {
                    if (counts[j] == i)
                    {
                        if (elements[j] != "MSA" &&  elements[j] != "CLS")
                            group.push({"id":elements[j], "joined": i + ""})
                    }
                }
                
                if (group.length > 0)
                    groupData.push({"name": "", "data":group})
            }
            console.log(groupData)
            createMap(groupData)
        }
        else{
            plotBar(this.value)
        }   
    });

})
.catch(function(error) {
    console.log(error);
});
    

  