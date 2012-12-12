// delete a shipment
function(doc,req) {
    var Updates = require('lib/updateHelpers');

    if (! doc) {
        // Creating a new thing
        return [null, { code: 404, json: { reason: 'No document with that id'}}];
    } else if (doc.type !== 'order') {
        return [null, { code: 403, json: { reason: doc._id+' is not an order'}}];
    }

    var shipmentNum = Updates.valueFor('s', req);
    
    doc.shipments.splice(shipmentNum, 1);

    return [doc, JSON.stringify({ success: true })];
}
