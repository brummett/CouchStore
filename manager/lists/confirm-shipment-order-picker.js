// confirm-shipment-order-picker
// Generates the page the user chooses a shipment to confirm
function(head,req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        data = { shipments: [], count: 0 };


    provides('html', function() {
        var row,
            orderNumber;
        while( row = getRow() ) {
            orderNumber = row.id.substr(6);   // order numbers start with 'order-'
            data.count++;
            data.shipments.push({   id: row.value.shipment + '-' + orderNumber,
                                    orderNumber: orderNumber,
                                    orderCount: row.value.count,
                                    box: row.value.box,
                                });
        }
        return Mustache.to_html(ddoc.templates['confirm-shipment-order-picker'], data);
    });
}
