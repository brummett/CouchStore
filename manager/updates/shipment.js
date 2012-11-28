// create/update a shipment
function(doc,req) {
    var Updates = require('lib/updateHelpers');

    if (! doc) {
        // Creating a new thing
        throw({forbidden: 'No document with that id'});
    } else if (doc.type !== 'order') {
        throw({forbidden: doc._id+' is not an order'});
    }

    var shipmentNum = Updates.valueFor('s', req),
        thisShipment,
        matches,
        items = {};

    // Go through the params and look for quantities
    function getQuantitiesFrom(props) {
        for (prop in props) {
            matches = /scan-(\w+)-quan/.exec(prop);
            if (matches && matches.length) {
                items[matches[1]] = parseInt(props[prop]);
            }
        }
    }
    getQuantitiesFrom(req.query);
    getQuantitiesFrom(req.form);

    if (shipmentNum === null) {
        // Creating a new shipment
        thisShipment = { };
        doc.shipments = [ thisShipment ];

    } else {
        // updating a shipment
        thisShipment = doc.shipments[shipmentNum];
    }

    thisShipment.date = Updates.valueFor('date', req);
    thisShipment.box = Updates.valueFor('box', req);
    thisShipment.items = items;

    return [doc, JSON.stringify({ success: true })];
}
