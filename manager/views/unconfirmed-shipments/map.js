// unconfirmed shipments
// keys are priority
function(doc) {
    var i, barcode, count;

    if ((doc.type == 'order') && ('shipments' in doc)) {
        for (i = 0; i < doc.shipments.length; i++) {
            // Don't emit shipments with tracking numbers
            if ('tracking-number' in doc.shipments[i]) continue;

            count = 0;
            for (barcode in doc.shipments[i].items) {
                count += doc.shipments[i].items[barcode];
            }
            // For now, they all have priority 0
            emit(0, {   shipment: i,
                        count: count,
                        box: doc.shipments[i].box });
        }
    }
}
