// confirm a shipment
function(doc,req) {
    var Updates = require('lib/updateHelpers');

    if (! doc) {
        // Creating a new thing
        return [null, { code: 404, json: { reason: 'No document with that id'}}];
    } else if (doc.type !== 'order') {
        return [null, { code: 403, json: { reason: doc._id+' is not an order'}}];
    }

    var shipmentNum = Updates.valueFor('s', req);
    
    doc.shipments[shipmentNum]['tracking-number']   = Updates.valueFor('tracking-number', req);
    doc.shipments[shipmentNum]['shipping-cost']     = parseInt(Updates.valueFor('shipping-cost', req));
    doc.shipments[shipmentNum]['weight']            = Updates.valueFor('weight', req) || '';
    doc.shipments[shipmentNum]['size']              = Updates.valueFor('size', req) || '';
    doc.shipments[shipmentNum]['carrier']           = Updates.valueFor('carrier', req);
    doc.shipments[shipmentNum]['carrier-method']    = Updates.valueFor('carrier-method', req);

    return [doc, JSON.stringify({ success: true })];
}
