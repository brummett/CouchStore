// confirm a shipment
function(doc,req) {
    var Updates = require('lib/updateHelpers');

    if (! doc) {
        // Creating a new thing
        throw({forbidden: 'No document with that id'});
    } else if (doc.type !== 'order') {
        throw({forbidden: doc._id+' is not an order'});
    }

    var shipmentNum = Updates.valueFor('s', req);
    
    doc.shipments[shipmentNum]['tracking-number']   = Updates.valueFor('tracking-number', req);
    doc.shipments[shipmentNum]['shipping-cost']     = parseInt(Updates.valueFor('shipping-cost', req));
    doc.shipments[shipmentNum]['weight']            = Updates.valueFor('weight', req) || '';
    doc.shipments[shipmentNum]['size']              = Updates.valueFor('size', req) || ''

    return [doc, JSON.stringify({ success: true })];
}
