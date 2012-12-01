// inventory-count-by-warehouse-barcode
// Count up all the items in receive orders, plus shipped items in sale
// orders, plus ewarehouse transfers
//
// This differs from the inventory-by-permanent-warehouse-barcode view 
// which includes unshipped items from sale orders
function(doc) {
    var Order = require('views/lib/Order'),
        order = Order.newFromDoc(doc);

    if (! order) {
        return;
    }

    var warehouse = order.warehouseName(),
        orderType = order.orderType();


    if (orderType === 'receive') {
        // For receive orders, count the whole thing positive toward
        // the warehouse's inventory
        order.barcodes().forEach(function(barcode) {
            emit([warehouse, barcode], order.quantityForBarcode(barcode));
        });

    } else if (order.isShippable() && order.shipments()) {
        order.shipments().forEach(function(shipment) {
            var barcode;
            for (barcode in shipment.items) {
                var count = shipment.items[barcode];

                if (orderType === 'sale') {
                    emit([warehouse, barcode], 0 - count);

                } else if (orderType === 'warehouse-transfer') {
                    emit([warehouse, barcode], count);
                    emit([ doc['source-warehouse-name'], barcode], 0 - count);
                }
            }
        });
    }
}
 
