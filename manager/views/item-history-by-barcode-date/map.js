// item-history-by-barcode-date
// Returns data about each order a barcode has been part of
function(doc) {
    var Order = require('views/lib/Order'),
        order = Order.newFromDoc(doc);

    if (order) {
        order.barcodes().forEach(function(barcode) {
            emit([barcode, order.date()],
                    {   name:           order.nameForBarcode(barcode),
                        sku:            order.skuForBarcode(barcode),
                        count:          order.quantityForBarcode(barcode),
                        warehouse:      order.warehouseName(),
                        'order-type':   order.orderType(),
                        'order-number': order.orderNumber()
                    });
        });
    }
}
