// popular-items report
// Use with the item-count-by-selldate or item-count-by-ordersource-selldate views
// perhaps limiting to specific dates with startkey and endkey
//
// Shows a screen like the data lister, but customized for showing 
// the most popular items between two dates
//
// By default it shows all the items sorted with most popular first
// caller can add parm least-popular to show least popular items first
//                      list-limit to only show n items
//
// Apparently it's not really possible to have the DB sort by values:
// http://stackoverflow.com/questions/2817703/sorting-couchdb-views-by-value
// Another possible solution is to set up a temp DB, do filtered replication to it
// including only the orders in the specified date range and order source, then have
// a map/reduce view that sorts by count
function(head,req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        Shipping = require('views/lib/shipping-priority'),
        row, value,
        items = [], seen = {};

    // I'd rather this was done in the reduce, but after you get more than 30 or 40
    // sold items, it starts failing because the reduce values grow too quickly
    while (row = getRow() ) {
        value = row.value;
        if (seen[ value.barcode ]) {
            seen[ value.barcode ].count += value.count;
        } else {
            seen[ value.barcode ] = value;
            items.push(value);
        }
    }

    items.sort( req.query['least-popular']
                ? function(a,b) { return a.count - b.count }
                : function(a,b) { return b.count - a.count } );

    if (req.query['list-limit'] !== undefined) {
        items = items.slice(0, req.query['list-limit']);
    }

    provides('json', function() {
        return JSON.stringify(items);
    });

    provides('html', function() {
        var data = { items: items };

        // Hack!  typeof() and instanceof don't seem to work right on Arrays
        // We'll cheat and say it's an array if it has a "push" attribute. 
        // stirngs don't have push
        data.startkey = (req.query.startkey.push) ? req.query.startkey[1] : req.query.startkey;
        data.endkey = (req.query.endkey.push) ? req.query.endkey[1] : req.query.endkey;
        // start_key and end_key params will have quotes around them that needs to be removed
        data.startkey = data.startkey ? data.startkey.replace(/"|'/g, '') : '';
        data.endkey = data.endkey ? data.endkey.replace(/"|'/g, '') : '';

        data['least-popular'] = req.query['least-popular'];
        data.action = req.query.action;

        data['order-sources'] = [ { name: 'All', value: '' } ]
        Shipping.sources.forEach(function(source) {
            var node = { name: source, value: source };
            if (req.query['order-source'] === source) {
                node.selected = 'SELECTED';
            }
            data['order-sources'].push(node);
        });

        return Mustache.to_html(ddoc.templates['popular-items-report'], data, ddoc.templates.partials);
    });
}
