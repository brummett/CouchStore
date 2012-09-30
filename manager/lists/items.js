// The basic data page about inventory items, customers, warehouses, etc
// Use with the <type>-by-any view
function(head,req) {
    var ddoc = this,
        search = req.query['search-query'] && req.query['search-query'].toLowerCase(),
        Mustache = require('vendor/couchapp/lib/mustache'),
        itemType = req.path[req.path.length-1],
        singular = '',
        addableThings = {items: 1, customers: 1, warehouses: 1};  // Show the add button for these things

    itemType = itemType.substr(0, itemType.indexOf('-')); // get the type up to the first '-'
    if (itemType == 'inventories') {
        singular = 'inventory';
    } else {
        singular = itemType.substr(0, itemType.lastIndexOf('s')); // singular word used to construct the 'edit' URL
    }

    var matches = search
                ? function(key) { return (key !== null)
                                        && (key !== undefined)
                                        && (key != '')
                                        && (key.toString().toLowerCase().indexOf(search.toLowerCase()) > -1); }
                : function(key) { return 1; };
                    
    var headers = { items: [ 'Name', 'Sku','Barcode' ],
                    customers: ['Name', 'Email','Phone'],
                    warehouses: ['Name','Email','Phone'],
                    orders: ['Order-Number', 'Customer-Name', 'Order-Type', 'Unfilled-Items', 'Shipped-Items'],
                    shipments: ['Order-Number', 'Customer-Name', 'Shipped-Items', 'Date', 'Tracking-Number'],
                    inventories: ['Warehouse', 'Section', 'Kinds', 'Items']
                   };
    var template = ddoc.templates['data-lister'];

    // Fixup the template for the proeper fields
    // Mustache dosen't seem to allow rendering of nested arrays
    var replacement = '<td>',
        i = 0;
    for (i = 0; i < headers[itemType].length; i++) {
        replacement += '{{' + headers[itemType][i].toLowerCase() + '}}</td><td>';
    }
    replacement += '</td>';
    template = template.replace('**FIELDS**', replacement);

    var isDuplicate = ( function() {
        var shown = {};
        return function(row) {
            // For most listers, the doc ID is all we need to know something is
            // a duplicate
            var key;
            if (itemType == 'shipments') {
                // But for shipments, it's the combo if doc ID and shipment
                key = row.value.shipment + row.id;
            } else {
                key = row.id;
            }
            if (shown[key]) {
                return true;
            } else {
                shown[key] = true;
                return false;
            }
        }
    })();

    // This is used to compose the edit and delete links
    function idForRow(row) {
        if (itemType == 'shipments') {
            return encodeURIComponent(row.id) + '/' + encodeURIComponent(row.value.shipment);
        } else {
            return encodeURIComponent(row.id);
        }
    };

    provides('html', function() {
        var data = {
                itemType: itemType,
                showAddButton: (itemType in addableThings),
                items: [],
                headers: headers[itemType],
                path: '#/data/' + itemType + '/',
                edit: '#/edit/' + singular + '/',
                delete: '#/delete/' + singular + '/'
            };
        while (row = getRow()) {
            if (matches(row.key)  && ! isDuplicate(row)) {
                row.value._id = idForRow(row);
                data.items.push(row.value);
            }
        }

        data['search-query'] = search;
        return Mustache.to_html(template, data);
    });

}
