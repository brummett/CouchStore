// create/update order
function(doc, req) {
    var Updates = require('lib/updateHelpers');

    if (! doc) {
        doc = { type: 'order' };
        if (req.id) {
            doc._id = req.id;
        } else {
            doc._id = 'order-'+Updates.valueFor('order-number', req);
        }

    } else if (doc.type !== 'order') {
        throw({ forbidden: 'not an order'});
    }

    var set_params = Updates.makeParamSetter(doc, req),
        keep_costs = true;

    // These are all strings
    set_params(['date', 'customer-name', 'customer-id', 'warehouse-name', 'order-type',
                'source-warehouse-name',
                'shipping-service-level', 'order-source', 'section', 'customer-address']);

    // Boolean
    set_params(['is-taxable'], Updates.boolean);

    // cents
    set_params(['shipping-charge-cents'], parseInt);
    set_params(['shipping-charge'],
                Updates.dollars,
                function(name) { return name+'-cents'; });

    var itemData = Updates.extractItemInfo(req.form);
    if (doc['order-type'] !== 'warehouse-transfer') {
        // transfer orders don't have costs for their items
        doc['item-costs'] = itemData.costs;
    }

    if (doc['order-type'] === 'sale') {
        // sale orders have negative quantities
        for (var barcode in itemData.quantities) {
            itemData.quantities[barcode] = 0 - Math.abs(itemData.quantities[barcode]);
        }
    }
    doc['items'] = itemData.quantities;

    doc['item-names'] = itemData.names;
    doc['item-skus'] = itemData.skus;

    return [ doc, JSON.stringify(doc) ];
}
