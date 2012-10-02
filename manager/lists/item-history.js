// item-history-report
// Use with the item-history-by-barcode-date view
// probably with one key at a time
function(head,req) {
    var ddoc = this,
        row,
        barcode,
        names = {},
        data = { name: '', items: [] };

    while( row = getRow() ) {
        barcode = row.key[0];
        if (! (names[barcode])) {
            names[barcode] = true;
            data.name += row.value.name + ' ';
        }

        data.items.push({   barcode:    barcode,
                            date:       row.key[1],
                            'order-type':   row.value['order-type'],
                            'order-number': row.value['order-number'],
                            sku:        row.value.sku,
                            warehouse:  row.value.warehouse,
                            count:      row.value.count
                        });
    }
                            
    provides('json', function() {
        return JSON.stringify(data);
    });

    provides('html', function() {
        var Mustache = require('vendor/couchapp/lib/mustache');
            
        return Mustache.to_html(ddoc.templates.partials['item-history-report'], data);
    });
}
