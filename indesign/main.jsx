#target "InDesign"

if(app.documents.length == 0){
    alert('Kindly open the template.indt from the indesign folder, before running the main.jsx')
    exit();
}

// include your helpers
#include "http.js"
#include "json2.js"

// ==========================
// CONFIG
// ==========================
var HOST = "localhost";
var PORT = 3000;
var PATH = "/data?limit=20";

// ==========================
// HELPERS
// ==========================
function extractJSON(response) {
    var parts = response.split("\r\n\r\n");
    if (parts.length < 2) {
        throw new Error("Invalid HTTP response");
    }
    return parts[1];
}

// ==========================
// FETCH DATA
// ==========================
function fetchData() {
    try {
        var raw = http.get(HOST, PORT, PATH);
        
        $.writeln(raw);
        
        return raw.data;

    } catch (e) {
        alert("API Error: " + e.message);
        exit();
    }
}

// ==========================
// RENDER
// ==========================
function render(data) {

    var doc = app.activeDocument;
    var template = doc.pages[0];

    for (var i = 0; i < data.length; i++) {

        var page = template.duplicate();
        var items = page.allPageItems;

        for (var j = 0; j < items.length; j++) {

            var item = items[j];
            var label = item.label;

            try {

                if (label === "title") {
                    item.contents = data[i].title || "";
                }

                if (label === "description") {
                    item.contents = data[i].description || "";
                }

                if (label === "image" && data[i].image) {
                    item.place(File(data[i].image));
                    item.fit(FitOptions.PROPORTIONALLY);
                    item.fit(FitOptions.CENTER_CONTENT);
                }

            } catch (err) {
                $.writeln("Render error: " + err);
            }
        }
    }
}

// ==========================
// RUN
// ==========================
var data = fetchData();
if (!data || data.length === 0) {
    alert("No data received");
    exit();
}

render(data);

alert("Done: " + data.length + " records processed");

