// http.jsx

var http = (function () {

    function removeNulls(str) {
        var result = "";
        for (var i = 0; i < str.length; i++) {
            if (str.charCodeAt(i) !== 0) {
                result += str.charAt(i);
            }
        }
        return result;
    }

    function extractBody(response) {
        var parts = response.split("\r\n\r\n");
        if (parts.length < 2) return null;
        return parts.slice(1).join("\r\n\r\n");
    }

    function extractJSON(str) {
        var startObj = str.indexOf("{");
        var startArr = str.indexOf("[");

        var start = -1;

        if (startObj === -1) start = startArr;
        else if (startArr === -1) start = startObj;
        else start = Math.min(startObj, startArr);

        if (start === -1) return null;

        var end = Math.max(str.lastIndexOf("}"), str.lastIndexOf("]"));

        if (end === -1) return null;

        return str.substring(start, end + 1);
    }

    function request(method, host, port, path) {
        var socket = new Socket();
        var response = "";

        if (!socket.open(host + ":" + port, "binary")) {
            throw new Error("Connection failed: " + host + ":" + port);
        }

        var req =
            method + " " + path + " HTTP/1.1\r\n" +
            "Host: " + host + "\r\n" +
            "Accept: application/json\r\n" +
            "Connection: close\r\n" +
            "\r\n";

        socket.write(req);

        while (true) {
            var chunk = socket.read(1024);
            if (!chunk) break;
            response += chunk;
        }

        socket.close();

        // ---- parse response ----
        var body = extractBody(response);
        if (!body) {
            throw new Error("Invalid HTTP response:\n" + response);
        }

        var jsonString = extractJSON(body);
        if (!jsonString) {
            throw new Error("No JSON found:\n" + body);
        }

        jsonString = removeNulls(jsonString);
        jsonString = jsonString.replace(/^\s+|\s+$/g, "");

        return JSON.parse(jsonString);
    }

    return {
        get: function (host, port, path) {
            return request("GET", host, port, path);
        }
    };

})();