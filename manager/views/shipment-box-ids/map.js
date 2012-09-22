// shipment-box-ids
// Used to determine the next box identification when shipping
// Caller should get the latest-sorting item, then pick the next
// letter
function(doc) {
    var i;

    if ((doc.type == 'order') && ('shipments' in doc)) {
log('doc has shipments');
        for (i = 0; i < doc.shipments.length; i++) {
log('shipment '+i+' is box '+doc.shipments[i].box);
            emit([doc.shipments[i].date, doc.shipments[i].box], null);
        }
    }
}

