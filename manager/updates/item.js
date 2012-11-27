// update item
function(doc,req) {
    var Updates = require('lib/updateHelpers');

    var set_param = Updates.makeParamSetter(doc, req);

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
                Updates.dollars,
                function(name) {
                    return name+'-cents';
                });
    });

    // These are boolean
    ['is-obsolete'].forEach(function(name) {
        set_param(name,
                Updates.boolean);
    });
                

    return [doc, JSON.stringify(doc)];

}
