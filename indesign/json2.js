if (typeof JSON !== "object") {
    JSON = {};
}

(function () {
    function f(n) {
        return n < 10 ? "0" + n : n;
    }

    if (typeof Date.prototype.toJSON !== "function") {
        Date.prototype.toJSON = function () {
            return isFinite(this.valueOf())
                ? this.getUTCFullYear() + "-" +
                  f(this.getUTCMonth() + 1) + "-" +
                  f(this.getUTCDate()) + "T" +
                  f(this.getUTCHours()) + ":" +
                  f(this.getUTCMinutes()) + ":" +
                  f(this.getUTCSeconds()) + "Z"
                : null;
        };
    }

    JSON.parse = function (text) {
        return eval("(" + text + ")");
    };

    JSON.stringify = function (value) {
        return value.toSource();
    };
})();