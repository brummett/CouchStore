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
        data['is-taxable'] = doc['is-taxable'] ? 'checked="checked"' : '';
        data.phonenumber = doc.phonenumber;
        data.alternatephonenumber = doc.alternatephonenumber;
        data.email = doc.email;
        data.notes = doc.notes;
        data['add-edit-title'] = "Edit";
        data.focusFirstName = true;
    } else {
        data['add-edit-title'] = "Add";
        if (req.id) {
            nameParts = req.id.split(' ');
            data['firstname'] = nameParts[0].charAt(0).toUpperCase() + nameParts[0].substr(1);  // Uppercase 1st letter
            lastname = nameParts.slice(1).join(' ');
            data['lastname'] = lastname.charAt(0).toUpperCase() + lastname.substr(1);
            data.focusAddress = true;
        } else {
            data.focusFirstName = true;
        }
    }

    return Mustache.to_html(ddoc.templates['edit-customer'], data);
}
