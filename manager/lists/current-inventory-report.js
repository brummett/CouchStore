// current-inventory-report
// Use with the inventory-by-permanenet-warehouse-barcode view
// probably with ?group=true
//
// Shows a screen like the data lister, but customized for showing 
// the current inventory levels
function(head,req) {
    var ddoc = this,
        row,
        data = { warehouses: [], items: [], 'search-query': req.query['search-query'] },
        all_items = {},
        warehouses = {};

    function process_row(row) {
        var warehouse   = row.key[1],
            barcode     = row.key[2],
            node        = row.value;

        if (! (warehouse in warehouses)) {
            warehouses[warehouse] = 1;
            data.warehouses.push(warehouse);
        }
        node.warehouse = warehouse;
        node.barcode = barcode;
        data.items.push(node);

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
        process_row(row);
    }
    
    add_all_items_to_data();
    
    provides('json', function() {
        return JSON.stringify(data);
    });

    provides('html', function() {
        var Mustache = require('vendor/couchapp/lib/mustache');
            
        return Mustache.to_html(ddoc.templates['current-inventory-report'], data);
    });
}
