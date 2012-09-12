// The DOM should have a few items already populated:
//    table#order-display
//    form#barcode-scan
//    form#order-form
//
// As items are scanned in, it adds hidden input elements ot the order-form
function OrderWidget(couchapp, context, activity, orderDoc) {
    this.table = $('table#order-display');
    this.barcodeScan = $('form#barcode-scan');
    this.orderForm = $('form#order-form');

    var widget = this,
        barcodeInput = $('input#barcode', this.barcodeScan),
        vendorInput = $('input#customer-name', this.orderForm),
        vendorIdInput = $('input#customer-id', this.orderForm),
        orderNumberInput = $('input#order-number', this.orderForm),
        numErrors = 0;

    function markError(elt, message) {
        numErrors += elt.length;
        elt.parents('.control-group')
                    .addClass('error')
                    .find('div.controls')
                    .append('<span class="help-inline">'+message+'</span>');
    };

    // This would normally belong inside the submit() handler along with all the other validation functions
    // but this one requires a trip to the server to get some data.  Sime the submit needs to succeed or fail
    // right then (can't wait while we talk to the server), we'll have to handle this a different way
    orderNumberInput.blur(function(e) {
        numErrors = 0;
        couchapp.view('orders-by-order-number', {
            key: orderNumberInput.val(),
            success: function(data) {
                if (data.rows.length > 0) {
                    markError(orderNumberInput, 'Not Unique');
                }
            }
        })
    });

    var typeaheadProcessor = function(jsonString) {
        var data = jQuery.parseJSON(jsonString).rows,
            seenIds = {},
            results = [];

        jQuery.each(data, function(idx, item) {
            if (! seenIds[item.id]) {
                results.push(item);
                seenIds[item.id] = 1;
            }
        });
        return results;
    };

    vendorInput.typeahead({
        ajax: {
            url: '_view/customers-by-any-name',
            preDispatch: function(query) { vendorIdInput.val(''); return { startkey: '"' + query + '"', endkey: '"' + query+'ZZZZZZ"' } },
            preProcess: typeaheadProcessor,
            method: 'get',
            triggerLength: 2,
        },
        itemSelected: function(elt, vendorId, vendorName) { $('input#customer-id').val(vendorId) },
        display: 'key',
        val: 'id'
    });


    this.orderForm.submit(function(e) {
        // Clear any prior errors/warnings
        widget.orderForm.find('.error').removeClass('error');
        widget.orderForm.find('.warning').removeClass('warning');
        widget.orderForm.find('.help-inline').remove();
        widget.table.find('.help-inline').remove();

        // Functions to verify different parts of the form
        function required(input) {
            if (input.val() === undefined
                || input.val() === null
                || input.val() == ''
            ) {
                markError(input, 'Required');
            }
        };
        function matches(input, pattern, message) {
            var value = input.val();
            if (pattern.test(value)) {
                return true;
            } else {
                markError(input, message);
                return false;
            }
        };
        function is_date(input) {
            var value = input.val();
            var matches = value.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (matches == undefined || matches.length == 0) {
                markError(input, 'Not a date');
            } else if (matches[1] < 1900 || matches[1] > 2100) {
                markError(input, "'" + matches[1] + "': Not a valid year");
            } else if (matches[2] < 1 || matches[2] > 12) {
                markError(input, "'" + matches[2] + "': Not a valid month");
            } else if (matches[3] < 1 || matches[3] > 31) {
                markError(input, "'" + matches[3] + "': Not a valid day");
            }
        };
        function checkUnknownItems(input) {
            if (input.length > 0) {
                markError(input, '<i class="icon-arrow-left"></i> Click to provide details');
            }
        };
        function checkCostsPrices(inputs) {
            inputs.each(function(idx, input) { required($(input)) });
            inputs.each(function(idx, input) { matches($(input), /\d*\.\d\d/, 'Bad money format') });
        };
        // The customerIdInput is filled in by the customerInput's blur handler when
        // the user has put in a known customer
        function checkKnownCustomer(input) {
            var customerIdInput = $(input).siblings('input#customer-id'),
                containingDiv = input.parents('div.controls').first(),
                unknownCustomerButton;
            if (customerIdInput.val() == '') {
                $('<button class="btn btn-warning is-unknown" type="button"><i class="icon-question-sign icon-white"></i> Unknown</button>')
                    .click( function(e) { context.editItemModal('customer', $('input#customer-name').val()); return false; })
                    .appendTo(containingDiv);
            }
        };

        var dateInput = $('input#date', this.orderForm);
        required(dateInput);
        is_date(dateInput);
        required($('input#order-number', this.orderForm));
        required($('input#customer-name', this.orderForm));

        checkKnownCustomer( $('input#customer-name'), this.orderForm)

        // Do checkUnknownItems after checkKnownCustomer so the latter can make an 'id-unknown' button if necessary
        checkUnknownItems($('button.is-unknown', this.orderForm));

        checkCostsPrices($('input.unit-cost', this.table));

        if (numErrors == 0) {
            widget.copyCostsToForm();
            return true;
        } else {
            return false;
        }
    });

    // Copy the cost/price info from the line item list into the form for submission
    this.copyCostsToForm = function() {
        var widget = this;
        $('input.unit-cost', widget.table).each(function(idx, input) {
            input = $(input);
            var tr = input.parents('tr');
            widget.orderForm.append('<input name="' + tr.attr('id') + '-cost" class="unit-cost" '
                                    + 'type="hidden" value="' + input.val() + '">');
        });
    };

    // When a barcode is scanned in
    this.barcodeScan.submit(function(e) {
        widget.addRemoveItem(barcodeInput.val(), 1);
        barcodeInput.val('');
        barcodeInput.focus();
        return false;
    });

    // Given a scan (usually a barcode), return the hidden input
    // element from order-form.  It creates a new input if it's not
    // there yet
    this.inputForScan = function(scan) {
        var input_id = 'scan-'+scan;
        var input = $('input#'+input_id);
        if (input.length == 0) {
            input = $('<input id="' + input_id + '" name="' + input_id + '" type="hidden" value="0">').appendTo(this.orderForm);
        }
        return input;
    };

    function centsToDollars (cents) {
        if (cents) {
            return (parseFloat(cents) / 100).toFixed(2);
        } else {
            return "0.00";
        }
    }

    activity.bind('item-updated', function(context,item) {
        // called when the add/edit item modal is submitted, so we can update the price/cost
        widget.getTableRowForScan(item.barcode)
            .then(function(tr) {
                tr.find('input.unit-cost').val(centsToDollars(item['cost-cents']));
                tr.find('td.item-name').text(item.name);
            });
    });


    // Given a scan (usually a barcode, return the table-row
    // element for the scan.  It will create a new row if it's
    // not there yet
    this.getTableRowForScan = function(scan) {
        var tr      = $('tr#scan-' + scan),
            table   = this.table,
            d       = jQuery.Deferred();

        if (tr.length) {
            d.resolve(tr);

        } else {
            $.get(couchapp.db.uri + couchapp.ddoc._id + '/templates/activity-receive-shipment-item-row.template')
                .then(function(content) {

                    var renderRow = function(item, is_unknown) {
                        content = $(context.template(content, { scan: scan,
                                                                unitCost: centsToDollars(item['cost-cents']),
                                                                count: 0,
                                                                is_unknown: is_unknown ? true : false,
                                                                name: item['name'] }));
                        table.append(content);
                        $('button.add-item', content).click( function(e) { widget.addRemoveItem(scan, 1) } );
                        $('button.remove-item', content).click( function(e) { widget.addRemoveItem(scan, -1) } );
                        $('button.delete-item', content).click( function(e) { widget.deleteItem(scan) } );
                        $('button.is-unknown', content).click( function(e) { context.editItemModal('item',scan) });
                        d.resolve(content);
                    };

                    couchapp.view('items-by-barcode', {
                        include_docs: true,
                        key: scan,
                        success: function(data) {
                            if (data.rows.length == 1) {
                                renderRow(data.rows[0].doc);
                            } else {
                                couchapp.view('items-by-sku', {
                                    key: scan,
                                    include_docs: true,
                                    success: function (data) {
                                        if (data.rows.length == 1) {
                                            renderRow(data.rows[0].doc);
                                        } else {
                                            // This is an unknown item
                                            renderRow({ 'cost-cents': '', name: ''}, true);
                                        }
                                    }
                                });
                            }
                        }
                    });
                });
        }
        return d;
    };

    this.addRemoveItem = function(scan, delta) {
        var input = this.inputForScan(scan);
            count = parseInt(input.val());
        count += delta;
        input.val(count);

        this.getTableRowForScan(scan)
            .then(function(tr) {
                $('td.item-count',tr).text(count);
            });
    };

    this.deleteItem = function(scan) {
        var input = this.inputForScan(scan);
        input.remove();
        this.getTableRowForScan(scan)
            .then(function(tr) {
                tr.animate( { height: '0px',
                              opacity: 0.0 },
                            500,
                            function() { tr.remove() }
                          );
            });
    };
            
        
    
}
