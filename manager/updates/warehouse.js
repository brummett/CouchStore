// update warehouse
function(doc,req) {
    var Updates = require('lib/updateHelpers');

    if (! doc) {
        // Creating a new thing
        doc = { _id: req.uuid, type: 'warehouse' };
    } else if (doc.type !== 'warehouse') {
        throw({forbidden: doc._id+' is not a warehouse'});
    }

    var set_params = Updates.makeParamSetter(doc, req);

    // These are all strings
    set_params(['name', 'address', 'phonenumber','alternatephonenumber','email','notes']);

    // These are integer
    set_params(['priority'],
                Updates.iteger);
                
    return [doc, JSON.stringify(doc)];

}
