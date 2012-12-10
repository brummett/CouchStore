// generates data used by the shipment order picker typeahead
// use with the shipment-order-picker view
function(head,req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        data = { orders: [], typeaheadSource: '' },
        row;

    provides('html', function() {
        var typeaheadData = [],
            orderNumber;
        while( row = getRow() ) {
            orderNumber = row.key[1];
            data.firstOrderNumber = data.firstOrderNumber || orderNumber;
            data.orders.push({  id: row.id,
                                isBackordered: row.value.isBackordered,
                                'order-number': orderNumber,
                                count: row.value.count,
                                orderSource: row.value.orderSource,
                                shipping: row.value.shipping
                            });
            typeaheadData.push(orderNumber);
        }
        if (typeaheadData.length) {
            data.typeaheadSource = "['" + typeaheadData.join("','") + "']";
        }

        return Mustache.to_html(ddoc.templates['shipment-order-picker'], data);
    });

}
