var sources = [ 'walk-in', 'web', 'amazon', 'phone', 'ebay', 'buy.com'];
var levels = ['overnight', 'expedited', 'standard' ];

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
log('getting prio for source '+doc['order-source']+' level '+doc['shipping-service-level'] );
log(sourcePriority[ doc['order-source'] ] + levelPriority[ doc['shipping-service-level'] ]);
    return sourcePriority[ doc['order-source'] ] + levelPriority[ doc['shipping-service-level'] ];
}

exports.priority = priority;
exports.sources = sources;
exports.levels = levels;
exports.sourcePriority = sourcePriority;
exports.levelsPriority = levelPriority;
