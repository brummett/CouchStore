// The basic data page about inventory items
// Use with the items-by-any view
function(head,req) {
    var ddoc = this,
        search = req.query['search-query'],
        Mustache = require('vendor/couchapp/lib/mustache'),
        itemType = req.path[req.path.length-1];

    itemType = itemType.substr(0, itemType.indexOf('-')); // get the type up to the first '-'
    var matches = search
                ? function(doc) {
                    return ((doc.name && (doc.name.toString().toLowerCase().indexOf(search) > -1 ))
                        || (doc.sku && (doc.sku.toString().toLowerCase().indexOf(search) > -1 ))
                        || (doc.barcode && (doc.barcode.toString().toLowerCase().indexOf(search) > -1 ))
                        || (doc.desc && (doc.desc.toString().toLowerCase().indexOf(search) > -1 ))
                        ); }
                : function(doc) { return 1; };
                    

    provides('html', function() {
        var shown = {}
            data = {
                items: [],
                path: '#/data/' + itemType + '/',
            };
        while (row = getRow()) {
            if (! shown[row.id] && matches(row.value)) {
                shown[row.id] = true;  // Don't show the same item more than once
                row.value._id = row.id;
                data.items.push(row.value);
            }
        }

        data['search-query'] = search;
        return Mustache.to_html(ddoc.templates['data-inventory-items'], data);
    });

}
