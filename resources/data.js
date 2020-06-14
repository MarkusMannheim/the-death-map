const d3 = require("d3"),
      fs = require("fs");

fs.readFile("sa3s.geojson", "utf8", function(error, data) {
  if (error) throw error;
  geodata = JSON.parse(data);

  fs.readFile("deaths.csv", "utf8", function(error, stats) {
    if (error) throw error;
    statistics = d3.csvParse(stats)
      // .filter(function(d) { return d.Year == "2015-2017" && +d.Rate; });
      .filter(function(d) { return d.Year == "2015-2017" && +d["SA3 code"].slice(0, 1) < 9; });

    regions = new Set();
    statistics.forEach(function(d) {
      regions.add(d["SA3 code"]);
    });

    newData = [];
    regions.forEach(function(d) {
      let boundaries = geodata
        .features
        .filter(function(e) {
          return e.properties.SA3_CODE16 == d;
        });
      if (boundaries.length > 0) {
        console.log("creating " + d + ": " + boundaries[0].properties.SA3_NAME16 + " ...");
        let properties = statistics
          .filter(function(e) {
            return e["SA3 code"] == d;
          });
        let region = {
          type: "Feature",
          geometry: boundaries[0].geometry,
          properties: {
            name: boundaries[0].properties.SA3_NAME16,
            code: boundaries[0].properties.SA3_CODE16
          }
        };
        let males = properties
          .filter(function(e) {
            return e.Sex == "Males";
          });
        let females = properties
          .filter(function(e) {
            return e.Sex == "Females";
          });
        let people = properties
          .filter(function(e) {
            return e.Sex == "Persons";
          });
        if (males.length > 0) region.properties.males = males[0].Rate == "NP" ? "na" : +males[0].Rate;
        if (females.length > 0) region.properties.females = females[0].Rate == "NP" ? "na" : +females[0].Rate;
        if (people.length > 0) region.properties.people = people[0].Rate == "NP" ? "na" : +people[0].Rate;
        newData.push(region);
      }
    });
    newData = {
      type: "FeatureCollection",
      features: newData
    };

    fs.writeFile("regions.geojson", JSON.stringify(newData), function(error) {
      console.log("region.geojson written");
    });
  });
});
