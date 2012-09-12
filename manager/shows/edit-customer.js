function(doc, req) {
    var ddoc = this;
    var Mustache = require('vendor/couchapp/lib/mustache');

    var data = {},
        nameParts,
        lastname;
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
        nameParts = req.id.split(' ');
        data['firstname'] = nameParts[0].charAt(0).toUpperCase() + nameParts[0].substr(1);  // Uppercase 1st letter
        lastname = nameParts.slice(1).join(' ');
        data['lastname'] = lastname.charAt(0).toUpperCase() + lastname.substr(1);
    }

    return Mustache.to_html(ddoc.templates['edit-customer'], data);
}
