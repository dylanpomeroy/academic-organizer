"use strict" 

// Import the dependencies
const cheerio = require("cheerio")
    , req = require("tinyreq")
    ;

// Define the scrape function
function getUrlContents(url, data, cb) {
    // 1. Create the request
    req(url, (err, body) => {
        if (err) { return cb(err); }

        // 2. Parse the HTML
        let $ = cheerio.load(body);

        let index = -1;
        let json = [];
        let tableRows = $('.dataentrytable:nth-child(5) tr');
        let innerIndex = -1;
        $(tableRows).each(function (i, row){
          if (i < 2) {
            return;
          }

          let rowText = $(row).text();
          let columns = rowText.split('\n');
          if ($(row).attr('valign') == 'middle'){
            index++;
            json[index] =
              {
                'id':columns[2].substring(0, 9),
                'name':columns[2].substring(9),
                'term':columns[5],
                'startDate':columns[7].split(' - ')[0].substring(2),
                'endDate':columns[7].split(' - ')[1],
                'classes': [],
              };
              let innerIndex = -1;
          }
          else if ($(row).children().length > 10) {
            innerIndex++;

            let classesJson = [];
            for (var j = 0; j < columns[7].length; j++){
              classesJson.push({
                onMonday: (columns[7].charAt(j) == 'M' ? 1 : 0),
                onTuesday: (columns[8].charAt(j) == 'T' ? 1 : 0),
                onWednesday: (columns[9].charAt(j) == 'W' ? 1 : 0),
                onThursday: (columns[10].charAt(j) == 'R' ? 1 : 0),
                onFriday: (columns[11].charAt(j) == 'F' ? 1 : 0),
              })
            }

            let maxEnrollmentsJson = [];
            let currentEnrollmentsJson = [];
            let maxEnrollmentHtml = $($($($(row).children()[13]).first()).children().first()).html();
            let currentEnrollmentHtml = $($($($(row).children()[14]).first()).children().first()).html();
            let maxEnrollments = maxEnrollmentHtml.split('<br>');
            let currentEnrollments = currentEnrollmentHtml.split('<br>');
            let enrollmentsLength = maxEnrollments.length;
            let maxEnrollmentsSplit = [[]];
            for (var k = 0; k < enrollmentsLength; k++) {
              // we have 'OPEN (100)' for example
              if (enrollmentsLength > 1){
                let maxEnrollmentSplit = maxEnrollments[k].split('(');
                let maxEnrollmentName = maxEnrollmentSplit[0].trim();
                let maxEnrollmentValue = maxEnrollmentSplit[1].slice(0, -1);
                //console.log('maxEnrollmentName: '+maxEnrollmentName + '\tmaxEnrollmentValue: '+maxEnrollmentValue);
                maxEnrollmentsJson.push({
                  name: maxEnrollmentName,
                  value: maxEnrollmentValue
                });
              }
              // we have '100' for example
              else {
                maxEnrollmentsJson.push({
                  name: 'OPEN',
                  value: maxEnrollments[k]
                })
              }

              currentEnrollmentsJson.push({
                name: maxEnrollmentsJson.name,
                value: currentEnrollments[k]
              })
            }
            //console.log('this: '+JSON.stringify(maxEnrollmentsJson, null, 4));
            //console.log('that: '+JSON.stringify(currentEnrollmentsJson, null, 4));
            json[index].classes.push({
                crn: columns[2],
                section: columns[3],
                type: columns[4],
                creditHours: columns[5],
                classrooms: classesJson,
                maxEnrollments: maxEnrollmentsJson,
                currentEnrollments: currentEnrollmentsJson,
                waitlists: columns[17],
                prof: columns[24],
                tuitionCode: columns[25],
                tuitionBHours: columns[26]
              });
          }
          else {
            //console.log('derp- '+JSON.stringify({derp: rowText}));
          }
        });

        // Send the data in the callback
        cb(null, json[15]);
    });
}

// Extract some data from my website
getUrlContents("https://dalonline.dal.ca/PROD/fysktime.P_DisplaySchedule?s_term=201720&s_subj=CSCI&s_district=100", {
}, (err, data) => {
    console.log(err || JSON.stringify(data, null, 4));
});
