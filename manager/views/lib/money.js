exports.toDollars = function(cents) {
    return (cents/100).toFixed(2);
}

exports.toCents = function(dollars) {
    return Math.round(parseFloat(dollars) * 100);
}

