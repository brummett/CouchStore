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
                                        && (key.toString().toLowerCase().indexOf(search) > -1); }
                : function(key) { return 1; };
                    
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

    function isEditable(row) {
        if ((itemType === 'orders') && (row.value['order-type'] === 'inventory-correction')) {
            return false;
        } else {
            return true;
        }
    };

    provides('html', function() {
        // Pick the right header/row partial for the item type
        var partials = ddoc.templates.partials;
        partials.headers = ddoc.templates.partials[itemType].headers;
        partials.row = ddoc.templates.partials[itemType].row;

        var data = {
                itemType: itemType,
                showAddButton: (itemType in addableThings),
                showObsoleteButton: (itemType == 'items'),
                items: [],
                path: '#/data/' + itemType + '/',
                edit: '#/edit/' + singular + '/',
                delete: '#/delete/' + singular + '/'
            };
        while (row = getRow()) {
            if (matches(row.key)  && ! isDuplicate(row)) {
                row.value._id = idForRow(row);
                row.value.editable = isEditable(row);
                data.items.push(row.value);
            }
        }

        data['search-query'] = search;
        return Mustache.to_html(ddoc.templates['data-lister'], data, partials);
    });

}
