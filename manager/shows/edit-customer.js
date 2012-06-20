function(doc, req) {
    var ddoc = this;
    var Mustache = require('vendor/couchapp/lib/mustache');

    var data = {};
    if(doc) {
        data._id = doc._id;
        data._rev = doc._rev;
        data.firstname = doc.firstname;
        data.lastname = doc.lastname;
        data.address = doc.address;
        data.istaxable = doc.istaxable ? 'checked="checked"' : '';
        data.phonenumber = doc.phonenumber;
        data.alternatephonenumber = doc.alternatephonenumber;
        data.email = doc.email;
        data.notes = doc.notes;
        data['add-edit-title'] = "Edit";
    } else {
        data['add-edit-title'] = "Add";
    }

    return Mustache.to_html(ddoc.templates['edit-customer'], data);
}
