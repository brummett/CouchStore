// shipment-order-picker
// Generates the data used by the shipment-order-picker list
// that becomes the "Make a Shipment" drop-down chooser
function(doc) {
    var order_number = '',
        barcode,
        isBackordered = 0,
        shipping = require('views/lib/shipping-priority'),
        i = 0,
        count = 0;

     if (doc.type == 'order') {
        // order doc IDs start with the string 'order-'
        order_number = doc._id.substring(6);
        isBackordered = doc.shipments ? doc.shipments.length : 0;
        
        for (barcode in doc.items) {
            count += doc.items[barcode]; // sale quantities are negative
        }
        if ('shipments' in doc) {
            for (i = 0; i < doc.shipments.length; i++) {
                for (barcode in doc.shipments[i].items) {
                    count += doc.shipments[i].items[barcode];  // shipment counts are positive
                }
            }
        }
        if (count < 0) {
            count = Math.abs(count);
            emit([shipping.priority(doc), order_number],
                { message: order_number + ' ' + count + ' items from '+ doc['warehouse-name'] + ' ' + doc['shipping-service-level'] + ' shipping',
                  isBackordered: isBackordered
                });
        }
    }
}
