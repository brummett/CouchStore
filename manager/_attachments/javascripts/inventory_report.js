function InventoryReport(params) {
    this.context = params.context;
    this.couchapp = params.couchapp;
    this.activity = params.activity;

    this.warehouseChooser = this.context.$element('select#warehouse-chooser');
    this.dataTable = this.context.$element('table#item-list');
    this.dataTableRows = this.dataTable.find('tr.inventory-row');

    this.warehouseChooser.change(this.showRows.bind(this));
    this.allWarehouseChooser = this.context.$element('input#all');
    this.allWarehouseChooser.change(this.allWarehouseButtonChanged.bind(this));

    this.obsoleteChooser = this.context.$element('input#show-obsolete');

    this.markObsoleteItems();

    var obsoleteClicked = function(e) {
        this.showRows();
    };
    this.obsoleteChooser.click(obsoleteClicked.bind(this));

    this.showRows();
};

// Adds the class 'obsolete' to all the rows with obsolete items
// looks up each row by its barcode to find out if it's obsolete
InventoryReport.prototype.markObsoleteItems = function() {
    var widget = this,
        couchapp = this.couchapp,
        tableRows = $('tr.inventory-row'),
        barcodes = {},
        barcodeList = [];

    var barcodes = {};
    tableRows.each(function(idx, elt) {
        var barcode = $(elt).attr('data-barcode');
        if (! (barcode in barcodes)) {
            barcodes[barcode] = true;
            barcodeList.push(barcode);
        }
    });

    couchapp.view('items-by-barcode', {
            keys: barcodeList,
            include_docs: true,
            success: function(data) {
                data.rows.forEach(function(row) {
                    var doc = row.doc;
                    if (doc['is-obsolete']) {
                        widget.dataTableRows.filter('[data-barcode="'+doc.barcode+'"]')
                            .addClass('obsolete');
                    }
                });
                widget.showRows();
            }
    });
};


// Show only the rows that match the obsolete and warehouse filters
InventoryReport.prototype.showRows = function() {
    var rows = this.dataTableRows;

    if (! this.obsoleteChooser.prop('checked')) {
        rows = rows.filter(':not(.obsolete)');
    }

    if (this.allWarehouseChooser.prop('checked')) {
        // Only keep 'All' warehouse items
        rows = rows.filter('[data-warehouse="All"]');

    } else {
        // Only keep items matching the selected warehouses
        var selector;
        this.warehouseChooser.find('option:selected').each(function() {
            var warehouse = $(this).text();
            if (selector) {
                selector = selector + ',[data-warehouse="'+warehouse+'"]';
            } else {
                selector = '[data-warehouse="'+warehouse+'"]';
            }
        });
        rows = rows.filter(selector);
    }

    this.dataTableRows.hide();
    rows.show();
};


InventoryReport.prototype.allWarehouseButtonChanged = function(e) {
    var value = $(e.target).prop('checked');
    this.warehouseChooser.prop('disabled', value);
    this.showRows();
};

