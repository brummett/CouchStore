// generates data used by the picklist order picker typeahead
// use with the unfilled-items-by-ordernumber view and include_docs=true
function(head,req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        data = { orders: [], typeaheadSource: ''},
        row;

    provides('html', function() {
        var typeaheadData = [];
        while( row = getRow() ) {
            data.orders.push({ id: row.id, isBackordered: row.value.isBackordered, message: row.value.message});
            typeaheadData.push(row.value.message);
        }
        data.typeaheadSource = JSON.stringify(typeaheadData);

        return Mustache.to_html(ddoc.templates['picklist-order-picker'], data);
    });

}
