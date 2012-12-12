// update customer
function(doc,req) {
    var Updates = require('lib/updateHelpers');

    if (! doc) {
        // Creating a new thing
        doc = { _id: req.uuid, type: 'customer' };
    } else if (doc.type !== 'customer') {
        return [null, { code: 403, json: { reason: doc._id+' is not a customer' }}];
    }

    var set_params = Updates.makeParamSetter(doc, req);

    // These are all strings
    set_params(['firstname', 'lastname', 'address', 'phonenumber','alternatephonenumber','email','notes']);

    // These are boolean
    set_params(['is-taxable'],
                Updates.boolean);
                
    return [doc, JSON.stringify(doc)];

}
