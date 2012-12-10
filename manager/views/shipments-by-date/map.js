// shipments-by-date view
// For the shipment-summary-report list

function(doc) {
    var Order = require('views/lib/Order'),
        order = Order.newFromDoc(doc),
        Money = require('views/lib/money');


    if ((order === undefined)
        || (order.orderType() !== 'sale')
        || (order.shipments === undefined)
        || (order.shipments() === undefined)
        || (order.shipments().length === 0)
    ) {
        return;
    }

    var shipments = order.shipments();

    // First figure out how much the customer should be charged for the entire order
    // whether it's shipped in one shipment or multiple
    var totalCharged = order.shippingCharge(),
        totalTaxes = 0;
    shipments.forEach(function(shipment) {
        var barcode;
        for (barcode in shipment.items) {
            var quantity = shipment.items[barcode],
                this_item_price = order.costForBarcode(barcode) * quantity;

            if (order.isTaxable()) {
                totalTaxes += Money.taxRate * this_item_price;
                this_item_price = Money.afterTax(this_item_price);
            }
            totalCharged += this_item_price;
        }
    });

    shipments.forEach(function(shipment,idx) {
        var barcode,
            shipment_data,
            quantity,
            price,
            quan_price;
        // If it has a tracking number, it's actually shipped out
        if (shipment['tracking-number']) {

            shipment_data = {
                'customer-name': order.customerName(),
                'customer-address': order.customerAddress(),
                'order-source': order.orderSource(),
                'order-number': order.orderNumber(),
                'warehouse': order.warehouseName(),
                'is-taxable': order.isTaxable(),
                'shipment-number': idx,
                'tracking-number': shipment['tracking-number'],
                'carrier': shipment['carrier'],
                'carrier-method': shipment['carrier-method'],
                'shipping-charge': order.shippingCharge(),
                'shipping-cost': shipment['shipping-cost'],
                'total-charge': totalCharged,
                'total-taxes': totalTaxes,
                'is-first': (idx === 0),
                items: []
            };
 
            for (barcode in shipment.items) {
                quantity = shipment.items[barcode];
                price = order.costForBarcode(barcode);
                quan_price = quantity * price;
                shipment_data.items.push({
                    'sku': order.skuForBarcode(barcode),
                    'name': order.nameForBarcode(barcode),
                    'quantity': quantity,
                    'price-each': price,
                    'quantity-price': quan_price
                });
            }
            emit(shipment.date, shipment_data);
        }
    });
}
