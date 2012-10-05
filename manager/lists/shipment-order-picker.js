// generates data used by the shipment order picker typeahead
// use with the shipment-order-picker view
function(head,req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        data = { orders: [], typeaheadSource: '' },
        row;

    provides('html', function() {
        var typeaheadData = [];
        while( row = getRow() ) {
            data.firstOrderNumber = data.firstOrderNumber || row.id.substr(6);
            data.orders.push({ id: row.id, isBackordered: row.value.isBackordered, message: row.value.message});
            typeaheadData.push(row.value.message);
        }
        data.typeaheadSource = JSON.stringify(typeaheadData);

        return Mustache.to_html(ddoc.templates['shipment-order-picker'], data);
    });

}
