// Helper functions for the entity update handlers

var Money = require('views/lib/money');

var identity = function(v) { return v };

var valueFor = function(name, req) {
    if (name in req.query) {
        return req.query[name];
    } else if (name in req.form) {
        return req.form[name];
    } else {
        return null;
    }
};
exports.valueFor = valueFor;

exports.makeParamSetter = function(doc, req) {
    // Get params from the get params first, then post params
    return function(nameList, valueMapper, nameMapper) {
        valueMapper = valueMapper ? valueMapper : identity;
        nameMapper = nameMapper ? nameMapper : identity;

        nameList.forEach(function(name) {
            var value = valueFor(name, req);
            if (value !== null) {
                doc[nameMapper(name)] = valueMapper(value);
            }
        });
    };
};

exports.boolean = function (v) { return !!v };
exports.integer = function(v) { return parseInt(v); }
exports.float = function(v) { return parseFloat(v); };
exports.dollars = function(v) { return Money.toCents(v) };
exports.identity = identity;

