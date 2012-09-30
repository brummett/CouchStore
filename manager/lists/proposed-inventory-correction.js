// proposed-inventory-correction
// Use with the inventory-by-permanenet-warehouse-barcode view
// probably with ?group=true
//
// For each warehouse, show a table with barcodes and the correction necessary
// to make the real inventory numbers match the proposed inventory 
function(head,req) {
    var ddoc = this,
        row,
        warehouse,
        barcode,
        warehouses = {};

    // Keys will be [ is-permanent, warehouse-name, barcode], depending on the grouping
    while( row = getRow() ) {
        warehouse = row.key[1];
        barcode = row.key[2];
        
        warehouses[warehouse] = warehouses[warehouse] || {};
        warehouses[warehouse][barcode] = warehouses[warehouse][barcode]
                                        || { count: 0, barcode: barcode, sku: row.value.sku, name: row.value.name };
        warehouses[warehouse][barcode].count -= row.value.count;
    }

    provides('json', function() {
        return JSON.stringify(warehouses);
    });

    provides('html', function() {
        var Mustache = require('vendor/couchapp/lib/mustache'),
            data = { warehouses: [] },
            warehouse;
            
        function item_list_for_warehouse(warehouse) {
            var items = [],
                barcode;
            for (barcode in warehouses[warehouse]) {
                items.push(warehouses[warehouse][barcode]);
            }
            return items;
        }

        for (warehouse in warehouses) {
            data.warehouses.push( { warehouseName: warehouse, items: item_list_for_warehouse(warehouse) } );
        }

        return Mustache.to_html(ddoc.templates.partials['proposed-inventory-corrections'], data);
    });
}
