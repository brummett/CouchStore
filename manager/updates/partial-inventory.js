// create/update a partial inventory correction
function(doc, req) {
    var Updates = require('lib/updateHelpers');

    if (! doc) {
        doc = { type: 'inventory' };
        if (req.id) {
            doc._id = req.id;
        } else {
            doc._id = 'inv-'
                        + Updates.valueFor('warehouse-name', req)
                        + '-' + Updates.valueFor('section', req);
        }

    } else if (doc.type !== 'inventory') {
        return [ null, { code: 403, json: { reason: 'Not an inventory correction'}}];
    }

    var set_params = Updates.makeParamSetter(doc, req);

    // These are all strings
    set_params(['date', 'customer-name', 'customer-id', 'warehouse-name',
                'section', 'customer-address']);

    var itemData = Updates.extractItemInfo(req.form);
    doc['items'] = itemData.quantities;
    doc['item-names'] = itemData.names;
    doc['item-skus'] = itemData.skus;

    return [ doc, JSON.stringify(doc) ];
}
