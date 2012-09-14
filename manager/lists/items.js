// The basic data page about inventory items
// Use with the items-by-any view
function(head,req) {
    var ddoc = this,
        search = req.query['search-query'],
        Mustache = require('vendor/couchapp/lib/mustache'),
        itemType = req.path[req.path.length-1],
        singular = '';

    itemType = itemType.substr(0, itemType.indexOf('-')); // get the type up to the first '-'
    singular = itemType.substr(0, itemType.indexOf('s')); // singular word used to construct the 'edit' URL
    var matches = search
                ? function(key) { return key.toString.toLowerCase.indexOf(search) > -1; }
                : function(key) { return 1; };
                    
    var headers = { items: [ 'Name', 'Sku','Barcode' ],
                    customers: ['Name', 'Email','Phone'],
                    warehouses: ['Name','Email','Phone']
                   };
    var template = ddoc.templates['data-inventory-items'];

    // Fixup the template for the proeper fields
    // Mustache dosen't seem to allow rendering of nested arrays
    var replacement = '<td>',
        i = 0;
    for (i = 0; i < headers[itemType].length; i++) {
        replacement += '{{' + headers[itemType][i].toLowerCase() + '}}</td><td>';
    }
    replacement += '</td>';
    template = template.replace('**FIELDS**', replacement);

    provides('html', function() {
        var shown = {}
            data = {
                items: [],
                headers: headers[itemType],
                path: '#/data/' + itemType + '/',
                edit: '#/edit/' + singular + '/',
                delete: '#/delete/' + singular + '/'
            };
        while (row = getRow()) {
            if (! shown[row.id] && matches(row.key)) {
                shown[row.id] = true;  // Don't show the same item more than once
                row.value._id = row.id;
                data.items.push(row.value);
            }
        }

        data['search-query'] = search;
        return Mustache.to_html(template, data);
    });

}
