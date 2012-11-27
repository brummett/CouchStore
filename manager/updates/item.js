// update item
function(doc,req) {
    var Money = require('views/lib/money');

    function set_param(name, valueMapper, nameMapper) {
        // Get params from the get params first, then post params
        function i(v) { return v; };
        valueMapper = valueMapper ? valueMapper : i;
        nameMapper = nameMapper ? nameMapper : i;

        if (name in req.query) {
            doc[nameMapper(name)] = valueMapper(req.query[name]);
        } else if (name in req.form) {
            doc[nameMapper(name)] = valueMapper(req.form[name]);
        }
    }

    if (! doc) {
        // Creating a new thing
        doc = { _id: req.uuid, type: 'item' };
    } else if (doc.type !== 'item') {
        //return [null, 'error:'+doc._id+' is not an item'];
        throw({forbidden: doc._id+' is not an item'});
    }

    var param;

    // These are all strings
    ['barcode', 'name', 'sku', 'description'].forEach(function(name) { set_param(name) });

    // These are integers
    ['cost-cents', 'price-cents'].forEach(function(name) {
        set_param(name, parseInt);
    });
    // These are floats to convert to integer cents
    ['cost', 'price'].forEach(function(name) {
        set_param(name,
                function(value) {
                    return Money.toCents(parseFloat(value));
                },
                function(name) {
                    return name+'-cents';
                });
    });

    // These are boolean
    ['is-obsolete'].forEach(function(name) {
        set_param(name,
                function(value) { return !!value } );
    });
                

log('**** updated item');
log(doc);

    return [doc, JSON.stringify(doc)];

}
