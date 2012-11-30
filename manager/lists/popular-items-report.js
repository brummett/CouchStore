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
        row,
        data = {};

    // The view should not get called with group or group_level, so there
    // should only ever be one row
    row = getRow();
    row = row || { value: [] };
    data.items = row.value.sort( req.query['least-popular']
                                ? function(a,b) { return a.count - b.count }
                                : function(a,b) { return b.count - a.count } );

    if (req.query['list-limit'] !== undefined) {
        data.items = data.items.slice(0, req.query['list-limit']);
    }

    provides('json', function() {
        return JSON.stringify(data.items);
    });

    provides('html', function() {

log(req.query);
log('req startkey '+ req.query.startkey);
        data.startkey = (req.query.startkey instanceof Array) ? req.query.startkey[1] : req.query.startkey;
log('data startkey '+data.endkey);
        data.endkey = (req.query.endkey instanceof Array) ? req.query.endkey[1] : req.query.endkey;
log(data);
        // start_key and end_key params will have quotes around them that needs to be removed
        data.startkey = data.startkey ? data.startkey.replace(/"|'/g, '') : '';
log('munged data startkey '+data.endkey);
        data.endkey = data.endkey ? data.endkey.replace(/"|'/g, '') : '';

        data['least-popular'] = req.query['least-popular'];
        data.action = req.query.action;
        data['order-sources'] = Shipping.sources;

        return Mustache.to_html(ddoc.templates['popular-items-report'], data, ddoc.templates.partials);
    });
}
