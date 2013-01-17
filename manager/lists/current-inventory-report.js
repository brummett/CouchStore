// current-inventory-report
// Use with the inventory-by-permanenet-warehouse-barcode view
// with reduce=false, and maybe limiting with date="yyyy-mm-dd"
//
// Shows a screen like the data lister, but customized for showing 
// the current inventory levels
function(head,req) {
    var ddoc = this,
        search = req.query['search-query'] && req.query['search-query'].toLowerCase(),
        row,
        data = { warehouses: [], items: [],
                'search-query': req.query['search-query'],
                path: '#/report/inventory/',
                date: req.query.date },
        all_items = {},
        items_by_warehouse = {};

    var matches = search
                ? function(key) { return (key !== null)
                                        && (key !== undefined)
                                        && (key != '')
                                        && (key.toString().toLowerCase().indexOf(search) > -1); }
                : function(key) { return 1; };

    function process_row(row) {
        var warehouse   = row.key[1],
            barcode     = row.key[2],
            node        = row.value;

        if (! (warehouse in items_by_warehouse)) {
            items_by_warehouse[warehouse] = {};
            data.warehouses.push(warehouse);
        }

        if (barcode in items_by_warehouse[warehouse]) {
            items_by_warehouse[warehouse][barcode].count += node.count;
        } else {
            node.warehouse = warehouse;
            node.barcode = barcode;
            items_by_warehouse[warehouse][barcode] = node;
            data.items.push(node);
        }

        if (barcode in all_items) {
            all_items[barcode].count += node.count;
        } else {
            all_items[barcode] = {  warehouse: 'All',
                                    hidden: true,
                                    barcode: barcode,
                                    sku: node.sku,
                                    name: node.name,
                                    count: node.count };
        }
    }

    function add_all_items_to_data() {
        var barcode;
        for (barcode in all_items) {
            data.items.push(all_items[barcode]);
        }
    }

    // Keys will be [ is-permanent, warehouse-name, barcode], depending on the grouping
    while( row = getRow() ) {
        if (
            ((data.date === undefined) || (row.value.date <= data.date))
            &&
            (matches(row.key[2])   // barcode
                || matches(row.value.name)
                || matches(row.value.sku)
            )
        ) {
            process_row(row);
        }
    }
    
    add_all_items_to_data();
    
    provides('json', function() {
        return JSON.stringify(data);
    });

    provides('html', function() {
        var Mustache = require('vendor/couchapp/lib/mustache');
            
        return Mustache.to_html(ddoc.templates['current-inventory-report'], data, ddoc.templates.partials);
    });
}
