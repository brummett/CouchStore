var sources = [ 'walk-in', 'web', 'amazon', 'phone', 'ebay', 'buy.com'];
var levels = ['overnight', 'expedited', 'standard' ];
var carriers = ['US Post Office','UPS','FedEx', 'Other'];

var i;
var sourcePriority = {};
for (i = 0; i < sources.length; i++) {
    sourcePriority[sources[i]] = i+1;
}

var levelPriority = {};
for (i = 0; i < levels.length; i++) {
    levelPriority[levels[i]] = (i+1) * 10;
}

var priority = function priority(doc) {
    return sourcePriority[ doc['order-source'] ] + levelPriority[ doc['shipping-service-level'] ];
}

exports.priority = priority;
exports.sources = sources;
exports.carriers = carriers;
exports.levels = levels;
exports.sourcePriority = sourcePriority;
exports.levelPriority = levelPriority;
