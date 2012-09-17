// generates data used by the picklist order picker typeahead
// use with the unfilled-items-by-ordernumber view and include_docs=true
function(head,req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        data = { orders: [], typeaheadSource: ''},
        row;

    provides('html', function() {
        while( row = getRow() ) {
            data.orders.push({ id: row.id, value: row.value});
        }
        data.typeaheadSource = JSON.stringify(data.orders);

        return Mustache.to_html(ddoc.templates['picklist-order-picker'], data);
    });

}
