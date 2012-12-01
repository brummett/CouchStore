// item-count-by-selldate view
function(doc) {
    if ((doc.type !== 'order') || (doc['order-type'] !== 'sale')) {
        return;
    }
    var Order = require('views/lib/Order'),
        order = Order.newFromDoc(doc);

    order.barcodes().forEach(function(barcode) {
        emit(order.date(),
              { count: order.quantityForBarcode(barcode),
                barcode: barcode,
                name: order.nameForBarcode(barcode),
                sku: order.skuForBarcode(barcode)
            });
    })
}
