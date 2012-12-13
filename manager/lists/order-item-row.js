// order-item-row list
// Renders table rows for the order widget
function(head, req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        Money = require('views/lib/money'),
        seen = {};

    provides('html', function() {
        var item,
            isUnknown = true,
            costKey = (req.query.orderType === 'receive' ? 'cost-cents' : 'price-cents'),
            template = ddoc.templates.partials['order-item-row'],
            row;

        while( row = getRow() ) {
            if (! (row.id in seen)) {
                seen[ row.id  ] = true;
                isUnknown = false;
                item = row.value;

                item.quantity = 0;
                item.allowDelete = (req.query.allowDelete == "1");
                item.cost = Money.toDollars( item[ costKey ] );

                send( Mustache.to_html(template, item) );
            }
        }

        if (isUnknown) {
            return Mustache.to_html(template, { isUnknown: true,
                                                quantity: 0,
                                                name: '',
                                                cost: '',
                                                barcode: req.query.scan });
        }
        return '';
    });
}
