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
    this.common_init(params);

    var widget = this;

    // This would normally belong inside the submit() handler along with all the other validation functions
    // but this one requires a trip to the server to get some data.  Since the submit needs to succeed or fail
    // right then (can't wait while we talk to the server), we'll have to handle this a different way
    this.orderNumberInput.blur(function(e) {
        widget.couchapp.view('orders-by-order-number', {
            key: widget.orderNumberInput.val(),
            success: function(data) {
                if (data.rows.length > 0) {
                    widget.markError(widget.orderNumberInput, 'Duplicate Order Number');
                } else {
                    widget.clearError(widget.orderNumberInput);
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

    this.customerInput.typeahead({
        ajax: {
            url: '_view/customers-by-any-name',
            preDispatch: function(query) { widget.customerIdInput.val(''); return { startkey: '"' + query + '"', endkey: '"' + query+'ZZZZZZ"' } },
            preProcess: typeaheadProcessor,
            method: 'get',
            triggerLength: 2,
        },
        itemSelected: function(elt, data, customerName) {
                            var istaxable = data.substr(0, data.indexOf(':')),
                                customerId = data.substr(data.indexOf(':') + 1);
                            $('input#customer-id').val(customerId);
                            $('input#is-taxable').val(istaxable);
                            widget.clearError($('input#customer-name'));
                        },
        display: 'name',
        val: 'data'
    });

    this.orderForm.submit(this.formSubmission.bind(this));
    this.barcodeScan.submit(this.barcodeWasScanned.bind(this));
    this.activity.bind('item-updated', this.itemWasUpdated.bind(this));
    this.activity.bind('customer-updated', this.customerWasUpdated.bind(this));
}


(function() {
OrderWidget.prototype.common_init = function common_init(params) {
    this.couchapp = params.couchapp;
    this.context = params.context;
    this.activity = params.activity;
    this.orderTable = params.context.$element('table#order-display');
    this.barcodeScan = params.context.$element('form#barcode-scan');
    this.orderForm = params.context.$element('form#order-form');
    this.allow_unknown = ('allow_unknown' in params) ? params.allow_unknown : true;  // Default is true
    this.allow_delete = ('allow_delete' in params) ? params.allow_delete : true;     // Default is true
    this.barcodeInput = $('input#barcode', this.barcodeScan);
    this.customerInput = $('input#customer-name', this.orderForm);
    this.customerIdInput = $('input#customer-id', this.orderForm);
    this.orderNumberInput = $('input#order-number', this.orderForm);
    this.orderType = this.orderForm.attr('data-order-type');
    this.numErrors = 0;

    // Connect any already-existing item rows' button callbacks
    $('tr.line-item').each(function(idx, elt) {
        var elt = $(elt),
            barcode = elt.attr('id').substr(5); // Their IDs start with 'scan-'
        this.wireUpEditButtons(elt, barcode);
    });

    // Turn off browser autocomplete for all the form fields
    $('input[type=text]').attr('autocomplete', 'off');

}

OrderWidget.prototype.itemRowPartial = 'order-item-row';

OrderWidget.prototype.hasError = function hasError(elt) {
    if ( elt.parents('.control-group').hasClass('error') ) {
        return elt.siblings('span.help-inline').text();
    } else {
        return false;
    }
};

// FIXME - maybe this would work better if the error message element was always there
// and we just turned on/off displaying it with css and classes
OrderWidget.prototype.markError = function markError(elt, message) {
    this.numErrors += elt.length;
    if (! this.hasError(elt)) {
        elt.parents('.control-group')
            .addClass('error')
            .find('div.controls')
            .append('<span class="help-inline">'+message+'</span>');
    }
};

OrderWidget.prototype.clearError = function clearError(elt) {
    this.numErrors -= elt.length;

    elt.parents('.control-group')
        .removeClass('error')
        .find('div.controls span.help-inline')
        .remove();
    elt.siblings('button.is-unknown').remove();
};

// Functions to verify different parts of the form
OrderWidget.prototype.v_required = function v_required(input) {
    if (input.val() === undefined
        || input.val() === null
        || input.val() == ''
    ) {
        this.markError(input, 'Required');
    }
};

OrderWidget.prototype.v_matches = function v_matches(input, pattern, message) {
    var value = input.val();
    if (pattern.test(value)) {
        return true;
    } else {
        this.markError(input, message);
        return false;
    }
};

OrderWidget.prototype.v_is_date = function v_is_date(input) {
    var value = input.val();
    var matches = value.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (matches == undefined || matches.length == 0) {
        this.markError(input, 'Not a date');
    } else if (matches[1] < 1900 || matches[1] > 2100) {
        this.markError(input, "'" + matches[1] + "': Not a valid year");
    } else if (matches[2] < 1 || matches[2] > 12) {
        this.markError(input, "'" + matches[2] + "': Not a valid month");
    } else if (matches[3] < 1 || matches[3] > 31) {
        this.markError(input, "'" + matches[3] + "': Not a valid day");
    }
};

OrderWidget.prototype.v_checkUnknownItems = function v_checkUnknownItems(input) {
    if (input.length > 0) {
        this.markError(input, '<i class="icon-arrow-left"></i> Click to provide details');
    }
};

OrderWidget.prototype.v_checkCostsPrices = function v_checkCostsPrices(inputs) {
    var widget = this;
    inputs.each(function(idx, input) { widget.v_required($(input)) });
    inputs.each(function(idx, input) { widget.v_matches($(input), /\d*\.\d\d/, 'Bad money format') });
};

// The customerIdInput is filled in by the itemSelected handler of the customer/vendor input
// when the user has put in a known customer
OrderWidget.prototype.v_checkKnownCustomer = function v_checkKnownCustomer(input) {
    var customerIdInput = $(input).siblings('input#customer-id'),
        containingDiv = input.parents('div.controls').first(),
        unknownCustomerButton,
        widget = this;
    if ($(input).val() != '' && customerIdInput.val() == '' && $(input).siblings('button.is-unknown').length == 0) {
        $('<button class="btn btn-warning is-unknown" type="button"><i class="icon-question-sign icon-white"></i> Unknown</button>')
            .click( function(e) { widget.context.editItemModal('customer', $('input#customer-name').val()); return false; })
            .appendTo(containingDiv);
    }
};

OrderWidget.prototype.formSubmission = function formSubmission(e) {
    // Clear any prior errors/warnings
    var orderNumberError = this.hasError($('input#order-number'));

    this.orderForm.find('.error').removeClass('error');
    this.orderForm.find('.warning').removeClass('warning');
    this.orderForm.find('.help-inline').remove();
    this.orderTable.find('.help-inline').remove();

    if (orderNumberError) {
        this.numErrors = 1;
        this.markError($('input#order-number'), orderNumberError);
    } else {
        this.numErrors = 0;
    }

    var dateInput = $('input#date', this.orderForm);

    this.v_required(dateInput);
    this.v_is_date(dateInput);
    this.v_required( $('input#order-number', this.orderForm) );
    this.v_required( $('input#customer-name', this.orderForm) );

    this.v_checkKnownCustomer( $('input#customer-name'), this.orderForm)

    // Do checkUnknownItems after checkKnownCustomer so the latter can make an 'id-unknown' button if necessary
    this.v_checkUnknownItems($('button.is-unknown', this.context.$element()));

    this.v_checkCostsPrices($('input.unit-cost', this.orderTable));

    if (this.numErrors == 0) {
        this.copyCostsToForm();
        return true;
    } else {
        return false;
    }
};

// Copy the cost/price info from the line item list into the form for submission
OrderWidget.prototype.copyCostsToForm = function copyCostsToForm() {
    var widget = this;
    $('input.unit-cost', widget.orderTable).each(function(idx, input) {
        input = $(input);
        var tr = input.parents('tr');
        widget.orderForm.append('<input name="' + tr.attr('id') + '-cost" class="unit-cost" '
                                + 'type="hidden" value="' + input.val() + '">');
    });
};

// When a barcode is scanned in
OrderWidget.prototype.barcodeWasScanned = function barcodeWasScanned(e) {
    this.addRemoveItem(this.barcodeInput.val(), 1);
    this.barcodeInput.val('');
    this.barcodeInput.focus();
    return false;
};

// Given a scan (usually a barcode), return the hidden input
// element from order-form that stores the quantity.  It creates a new
// input for the name and quantity if it's not there yet
OrderWidget.prototype.inputForScan = function inputForScan(scan) {
    var input_id = 'scan-'+scan+'-quan',
        name_id  = 'scan-'+scan+'-name',
        sku_id   = 'scan-'+scan+'-sku';
    var input = $('input#'+input_id);
    if (input.length == 0) {
        $('<input id="' + name_id + '" name="' + name_id + '" type="hidden" value="">').appendTo(this.orderForm);
        $('<input id="' + sku_id + '" name="' + sku_id + '" type="hidden" value="">').appendTo(this.orderForm);
        input = $('<input id="' + input_id + '" name="' + input_id + '" type="hidden" value="0">').appendTo(this.orderForm);
    }
    return input;
};

OrderWidget.prototype.centsToDollars = function centsToDollars (cents) {
    if (cents) {
        return (parseFloat(cents) / 100).toFixed(2);
    } else {
        return "0.00";
    }
};

OrderWidget.prototype.getCostFromItem = function getCostFromItem(item) {
    if (this.orderType == 'receive') {
        return item['cost-cents'];
    } else {
        return item['price-cents'];
    }
};

OrderWidget.prototype.itemWasUpdated = function itemWasUpdated(context, item) {
    // called when the add/edit item modal is submitted, so we can update the price/cost
    var widget = this;
    widget.getTableRowForScan(item.barcode)
        .then(function(tr) {
            tr.removeClass('is-unknown')
                .find('input.unit-cost').val(widget.centsToDollars(widget.getCostFromItem(item)));
            tr.find('td.item-name').text(item.name);
            $('input#scan-'+item.barcode+'-name').val(item.name);
            $('input#scan-'+item.barcode+'-sku').val(item.sku);
        });
};

OrderWidget.prototype.customerWasUpdated = function customerWasUpdated(context, customer) {
    // called when the add/edit item modal is submitted, so we can update the customer's name
    var customerNameInput = this.orderForm.find('input#customer-name');

    customerNameInput.val( customer.firstname.concat(' ', customer.lastname));
    $('input#customer-id').val(customer['_id']);
    $('input#is-taxable').val(customer.istaxable);

    // Remove any error messages/buttons left there
    customerNameInput.parents('.error').removeClass('error');
    customerNameInput.siblings('button.is-unknown').remove();
    customerNameInput.siblings('span.help-inline').remove();
    this.numErrors = 0;
};

// Given a scan (usually a barcode, return the table-row
// element for the scan.  It will create a new row if it's
// not there yet
OrderWidget.prototype.getTableRowForScan = function getTableRowForScan(scan) {
    var tr      = this.orderTable.find('tr#scan-' + scan),
        d       = jQuery.Deferred(),
        widget  = this;

    if (tr.length) {
        d.resolve(tr);

    } else {
        var template = this.couchapp.ddoc.templates.partials[this.itemRowPartial];
        function renderRow(item, is_unknown) {
            var content = $( $.mustache(template,
                                    {   barcode: scan,
                                        cost: widget.centsToDollars(widget.getCostFromItem(item)),
                                        quantity: 0,
                                        allowDelete: widget.allow_delete,
                                        isUnknown: is_unknown ? true : false,
                                        name: item['name']
                                    }));
            widget.orderForm.find('input#scan-'+scan+'-name').val(item.name);
            widget.orderForm.find('input#scan-'+scan+'-sku').val(item.sku);
            widget.orderTable.append(content);
            widget.wireUpEditButtons(content, scan);
            d.resolve(content);
        };

        widget.couchapp.view('items-by-barcode', {
            include_docs: true,
            key: scan,
            success: function(data) {
                if (data.rows.length == 1) {
                    renderRow(data.rows[0].doc);
                } else {
                    widget.couchapp.view('items-by-sku', {
                        key: scan,
                        include_docs: true,
                        success: function (data) {
                            if (data.rows.length == 1) {
                                renderRow(data.rows[0].doc);
                            } else if (widget.allow_unknown) {
                                // This is an unknown item
                                renderRow({ 'cost-cents': '', name: ''}, true);
                            } else {
                                widget.context.errorModal(scan + ' is an unknown barcode or sku');
                            }
                        }
                    });
                }
            }
        });
    }
    return d.promise();
};

OrderWidget.prototype.wireUpEditButtons = function wireUpEditButtons(content, scan) {
    var widget = this;
    $('button.add-item', content).click( function(e) { widget.addRemoveItem(scan, 1) } );
    $('button.remove-item', content).click( function(e) { widget.addRemoveItem(scan, -1) } );
    $('button.delete-item', content).click( function(e) { widget.deleteItem(scan) } );
    $('button.is-unknown', content).click( function(e) { widget.context.editItemModal('item',scan) });
};

OrderWidget.prototype.addRemoveItem = function addRemoveItem(scan, delta) {
    var input = this.inputForScan(scan);
        count = parseInt(input.val());
    count += delta;
    input.val(count);

    this.getTableRowForScan(scan)
        .then(function(tr) {
            $('td.item-count',tr).text(count);
        });
};

OrderWidget.prototype.deleteItem = function deleteItem(scan) {
    var input = this.inputForScan(scan);

    input.remove();
    this.orderForm.find('input#scan-'+scan+'-name').remove();
    this.orderForm.find('input#scan-'+scan+'-sku').remove();
    this.getTableRowForScan(scan)
        .then(function(tr) {
            tr.animate( { height: '0px',
                          opacity: 0.0 },
                        500,
                        function() { tr.remove() }
                      );
        });
};
})();  // End of OrderWidget prototype function definitions


