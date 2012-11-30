// popular-items report
// Use with the item-count-by-selldate and item-count-by-warehouse-selldate views
//
// Shows a screen like the data lister, but customized for showing 
// the most popular items between two dates
function(head,req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        row,
        data = {};

    // start_key and end_key params will have quotes around them that needs to be removed
    data.startkey = req.query.startkey ? req.query.startkey.replace(/"|'/g, '') : '';
    data.endkey = req.query.endkey ? req.query.endkey.replace(/"|'/g, '') : '';
    data.ascending = ! req.query.descending;
    data.action = req.form.action;

    provides('html', function() {
        send(Mustache.to_html(ddoc.templates['popular-items-report'], data, ddoc.templates.partials));

        // row keys will be count, sku, name
        while( row = getRow() ) {
            send(Mustache.to_html(ddoc.templates.partials['popular-items-report-table-row'], row));
        }
    
        return Mustache.to_html(ddoc.templates.partials['popular-items-report-table-footer'], {});
    });
}
