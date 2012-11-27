// Helper functions for the entity update handlers

var Money = require('views/lib/money');

var identity = function(v) { return v };

exports.makeParamSetter = function(doc, req) {
    // Get params from the get params first, then post params
    return function(name, valueMapper, nameMapper) {
        valueMapper = valueMapper ? valueMapper : identity;
        nameMapper = nameMapper ? nameMapper : identity;

        if (name in req.query) {
            doc[nameMapper(name)] = valueMapper(req.query[name]);
        } else if (name in req.form) {
            doc[nameMapper(name)] = valueMapper(req.form[name]);
        }
    };
};

exports.boolean = function (v) { return !!v };
exports.integer = function(v) { return parseInt(v); }
exports.float = function(v) { return parseFloat(v); };
exports.dollars = function(v) { return Money.toCents(v) };
exports.identity = identity;

