exports.toDollars = function(cents) {
    return (parseInt(cents)/100).toFixed(2);
}

exports.toCents = function(dollars) {
    return Math.round(parseFloat(dollars) * 100);
}

var dollarsAndCentsRegex = /^[1-9][0-9]*(\\.[0-9]{2})?|\\$0?\\.[0-9][0-9]$/;
exports.dollarsAndCentsRegex = dollarsAndCentsRegex;

exports.isDollarsAndCents = function(dollars) {
    // From http://www.stat.berkeley.edu/~nolan/stat133/Fall05/lectures/RegExExamples.html
    var matches = dollars.toString.match(dollarsAndCentsRegex);
    return (matches && matches.length);
}
