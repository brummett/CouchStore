// depete a shipment
function(doc,req) {
    var Updates = require('lib/updateHelpers');

    if (! doc) {
        // Creating a new thing
        throw({forbidden: 'No document with that id'});
    } else if (doc.type !== 'order') {
        throw({forbidden: doc._id+' is not an order'});
    }

    var shipmentNum = Updates.valueFor('s', req);
    
    doc.shipments.splice(shipmentNum, 1);

    return [doc, JSON.stringify({ success: true })];
}
