// The DOM should have a few items already populated:
//    table#order-display
//    form#barcode-scan
//    form#order-form
//
// As items are scanned in, it adds hidden input elements ot the order-form
//
// Configuration params allowed:
//      couchapp: the couchapp object
//      context: the Sammy.js context object
//      activity: the Sammy.js app object
//      allow_unknown: true if line items can be unknown, false if it should show an error dialog for unknown items
//      allow_delete: true if the order item lines should include a delete button
function OrderWidget(params) {

    var orderTable = $('table#order-display'),
        barcodeScan = $('form#barcode-scan'),
        orderForm = $('form#order-form'),
        couchapp = params.couchapp,
        context = params.context,
        activity = params.activity,
        allow_unknown = ('allow_unknown' in params) ? params.allow_unknown : true,
        allow_delete = ('allow_delete' in params) ? params.allow_delete : true,
        barcodeInput = $('input#barcode', barcodeScan),
        customerInput = $('input#customer-name', orderForm),
        customerIdInput = $('input#customer-id', orderForm),
        orderNumberInput = $('input#order-number', orderForm),
        orderType = orderForm.attr('data-order-type'),
        numErrors = 0;

    // Connect any already-existing item rows' button callbacks
    $('tr.line-item').each(function(idx, elt) {
        var elt = $(elt),
            barcode = elt.attr('id').substr(5); // Their IDs start with 'scan-'
        wireUpEditButtons(elt, barcode);
    });

    // Turn off browser autocomplete for all the form fields
    $('input[type=text]').attr('autocomplete', 'off');

    function hasError(elt) {
        if ( elt.parents('.control-group').hasClass('error') ) {
            return elt.siblings('span.help-inline').text();
        } else {
            return false;
        }
    };
    function markError(elt, message) {
        numErrors += elt.length;
        if (! hasError(elt)) {
            elt.parents('.control-group')
                .addClass('error')
                .find('div.controls')
                .append('<span class="help-inline">'+message+'</span>');
        }
    };
    function clearError(elt) {
        numErrors -= elt.length;

        elt.parents('.control-group')
            .removeClass('error')
            .find('div.controls span.help-inline')
            .remove();
        elt.siblings('button.is-unknown').remove();
    };
    // This would normally belong inside the submit() handler along with all the other validation functions
    // but this one requires a trip to the server to get some data.  Sime the submit needs to succeed or fail
    // right then (can't wait while we talk to the server), we'll have to handle this a different way
    orderNumberInput.blur(function(e) {
        couchapp.view('orders-by-order-number', {
            key: orderNumberInput.val(),
            success: function(data) {
                if (data.rows.length > 0) {
                    markError(orderNumberInput, 'Duplicate Order Number');
                } else {
                    clearError(orderNumberInput);
                }
            }
        })
    });

    // Type ahead code for the customer/vendor field
    var typeaheadProcessor = function(jsonString) {
        var data = jQuery.parseJSON(jsonString).rows,
            seenIds = {},
            results = [];

        jQuery.each(data, function(idx, item) {
            if (! seenIds[item.id]) {
                // The value that makes it to itemSelected below must be a single string
                // We'll encode the istaxable along with the customer ID as a string
                results.push({ name: item.key, data: item.value +':'+ item.id});
                seenIds[item.id] = 1;
            }
        });
        return results;
    };

    customerInput.typeahead({
        ajax: {
            url: '_view/customers-by-any-name',
            preDispatch: function(query) { customerIdInput.val(''); return { startkey: '"' + query + '"', endkey: '"' + query+'ZZZZZZ"' } },
            preProcess: typeaheadProcessor,
            method: 'get',
            triggerLength: 2,
        },
        itemSelected: function(elt, data, customerName) {
                            var istaxable = data.substr(0, data.indexOf(':')),
                                customerId = data.substr(data.indexOf(':') + 1);
                            $('input#customer-id').val(customerId);
                            $('input#is-taxable').val(istaxable);
                            clearError($('input#customer-name'));
                        },
        display: 'name',
        val: 'data'
    });


    orderForm.submit(function(e) {
        // Clear any prior errors/warnings
        var orderNumberError = hasError($('input#order-number'));

        orderForm.find('.error').removeClass('error');
        orderForm.find('.warning').removeClass('warning');
        orderForm.find('.help-inline').remove();
        orderTable.find('.help-inline').remove();

        if (orderNumberError) {
            numErrors = 1;
            markError($('input#order-number'), orderNumberError);
        } else {
            numErrors = 0;
        }

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
        // The customerIdInput is filled in by the itemSelected handler of the customer/vendor input
        // when the user has put in a known customer
        function checkKnownCustomer(input) {
            var customerIdInput = $(input).siblings('input#customer-id'),
                containingDiv = input.parents('div.controls').first(),
                unknownCustomerButton;
            if ($(input).val() != '' && customerIdInput.val() == '' && $(input).siblings('button.is-unknown').length == 0) {
                $('<button class="btn btn-warning is-unknown" type="button"><i class="icon-question-sign icon-white"></i> Unknown</button>')
                    .click( function(e) { context.editItemModal('customer', $('input#customer-name').val()); return false; })
                    .appendTo(containingDiv);
            }
        };

        var dateInput = $('input#date', orderForm);
        required(dateInput);
        is_date(dateInput);
        required($('input#order-number', orderForm));
        required($('input#customer-name', orderForm));

        checkKnownCustomer( $('input#customer-name'), orderForm)

        // Do checkUnknownItems after checkKnownCustomer so the latter can make an 'id-unknown' button if necessary
        checkUnknownItems($('button.is-unknown', context.$element()));

        checkCostsPrices($('input.unit-cost', orderTable));

        if (numErrors == 0) {
            copyCostsToForm();
            return true;
        } else {
            return false;
        }
    });

    // Copy the cost/price info from the line item list into the form for submission
    function copyCostsToForm() {
        $('input.unit-cost', orderTable).each(function(idx, input) {
            input = $(input);
            var tr = input.parents('tr');
            orderForm.append('<input name="' + tr.attr('id') + '-cost" class="unit-cost" '
                                    + 'type="hidden" value="' + input.val() + '">');
        });
    };

    // When a barcode is scanned in
    barcodeScan.submit(function(e) {
        addRemoveItem(barcodeInput.val(), 1);
        barcodeInput.val('');
        barcodeInput.focus();
        return false;
    });

    // Given a scan (usually a barcode), return the hidden input
    // element from order-form that stores the quantity.  It creates a new
    // input for the name and quantity if it's not there yet
    function inputForScan(scan) {
        var input_id = 'scan-'+scan+'-quan',
            name_id  = 'scan-'+scan+'-name',
            sku_id   = 'scan-'+scan+'-sku';
        var input = $('input#'+input_id);
        if (input.length == 0) {
            $('<input id="' + name_id + '" name="' + name_id + '" type="hidden" value="">').appendTo(orderForm);
            $('<input id="' + sku_id + '" name="' + sku_id + '" type="hidden" value="">').appendTo(orderForm);
            input = $('<input id="' + input_id + '" name="' + input_id + '" type="hidden" value="0">').appendTo(orderForm);
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

    function getCostFromItem(item) {
        if (orderType == 'receive') {
            return item['cost-cents'];
        } else {
            return item['price-cents'];
        }
    }

    activity.bind('item-updated', function(context,item) {
        // called when the add/edit item modal is submitted, so we can update the price/cost
        getTableRowForScan(item.barcode)
            .then(function(tr) {
                tr.removeClass('is-unknown')
                    .find('input.unit-cost').val(centsToDollars(getCostFromItem(item)));
                tr.find('td.item-name').text(item.name);
                $('input#scan-'+item.barcode+'-name').val(item.name);
                $('input#scan-'+item.barcode+'-sku').val(item.sku);
            });
    });
    activity.bind('customer-updated', function(context,customer) {
        // called when the add/edit item modal is submitted, so we can update the customer's name
        var customerNameInput = $('input#customer-name');
        customerNameInput.val( customer.firstname.concat(' ', customer.lastname));
        $('input#customer-id').val(customer['_id']);
        $('input#is-taxable').val(customer.istaxable);

        // Remove any error messages/buttons left there
        customerNameInput.parents('.error').removeClass('error');
        customerNameInput.siblings('button.is-unknown').remove();
        customerNameInput.siblings('span.help-inline').remove();
        numErrors = 0;
    });


    // Given a scan (usually a barcode, return the table-row
    // element for the scan.  It will create a new row if it's
    // not there yet
    getTableRowForScan = function(scan) {
        var tr      = $('tr#scan-' + scan, orderTable),
            d       = jQuery.Deferred();

        if (tr.length) {
            d.resolve(tr);

        } else {
            function renderRow(item, is_unknown) {
                var content = $( $.mustache(couchapp.ddoc.templates.partials['order-item-row'],
                                        {   barcode: scan,
                                            cost: centsToDollars(getCostFromItem(item)),
                                            quantity: 0,
                                            allowDelete: allow_delete,
                                            isUnknown: is_unknown ? true : false,
                                            name: item['name']
                                        }));
                $('input#scan-'+scan+'-name').val(item.name);
                $('input#scan-'+scan+'-sku').val(item.sku);
                orderTable.append(content);
                wireUpEditButtons(content, scan);
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
                                } else if (allow_unknown) {
                                    // This is an unknown item
                                    renderRow({ 'cost-cents': '', name: ''}, true);
                                } else {
                                    context.errorModal(scan + ' is an unknown barcode or sku');
                                }
                            }
                        });
                    }
                }
            });
        }
        return d.promise();
    };

    function wireUpEditButtons(content, scan) {
        $('button.add-item', content).click( function(e) { addRemoveItem(scan, 1) } );
        $('button.remove-item', content).click( function(e) { addRemoveItem(scan, -1) } );
        $('button.delete-item', content).click( function(e) { deleteItem(scan) } );
        $('button.is-unknown', content).click( function(e) { context.editItemModal('item',scan) });
    };

    function addRemoveItem(scan, delta) {
        var input = inputForScan(scan);
            count = parseInt(input.val());
        count += delta;
        input.val(count);

        getTableRowForScan(scan)
            .then(function(tr) {
                $('td.item-count',tr).text(count);
            });
    };

    function deleteItem(scan) {
        var input = inputForScan(scan);
        input.remove();
        $('input#scan-'+scan+'-name').remove();
        $('input#scan-'+scan+'-sku').remove();
        getTableRowForScan(scan)
            .then(function(tr) {
                tr.animate( { height: '0px',
                              opacity: 0.0 },
                            500,
                            function() { tr.remove() }
                          );
            });
    };

    function initFromDoc(doc) {
        var barcode = '';

        if (doc.type == 'receive') {
            for (barcode in doc.type['items']) {
                addRemoveItem(barcode, 1);
            }

        } else if (doc.type == 'sale') {
        }
    };

}
