// create/update an inventory correction
function(doc,req) {
    var Updates = require('lib/updateHelpers'),
        merge = req.query.merge || req.form.merge;  // merge or replace item data

    if (! doc) {
        // Creating a new thing
        doc = { _id: req.id,
                type: 'order',
                'order-type': 'inventory-correction',
                items: {},
                'item-skus': {},
                'item-names': {}
            };
    } else if ((doc.type !== 'order') || (doc['order-type'] !== 'inventory-correction')) {
        return [null, { code: 403, json: { reason: doc._id+' is not an inventory correction order'}}];
    }

    var param_set = Updates.makeParamSetter(doc, req);
    param_set(['date', 'warehouse-name', 'customer-name']);

    var mergeObjects = function(obj1, obj2, valueMapper) {
        if (! valueMapper) {
            valueMapper = function(v) { return v };
        }
        for (var prop in obj2) {
            obj1[prop] = valueMapper(obj2[prop], obj1[prop]);
        }
        return obj1;
    };

    var itemData = Updates.extractItemInfo(req.form);

    if (merge) {
        doc.items = mergeObjects(doc.items, itemData.quantities, function(v1, v2) { return v1+v2 });
        doc['item-skus'] = mergeObjects(doc['item-skus'], itemData.skus);
        doc['item-names'] = mergeObjects(doc['item-names'], itemData.names);
    } else {
        doc.items = itemData.quantities;
        doc['item-skus'] = itemData.skus;
        doc['item-names'] = itemData.names;
    }

    // Prune out items with 0 count - they won't validate
    for (var barcode in doc.items) {
        if (doc.items[barcode] === 0) {
            delete doc['items'][barcode];
            delete doc['item-skus'][barcode];
            delete doc['item-names'][barcode];
        }
    }

    return [doc, JSON.stringify(doc) ];
}
