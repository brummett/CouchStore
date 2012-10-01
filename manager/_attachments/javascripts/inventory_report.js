function InventoryReport(params) {
    this.context = params.context;
    this.couchapp = params.couchapp;
    this.activity = params.activity;

    this.warehouseChooser = this.context.$element('select#warehouse-chooser');
    this.dataTable = this.context.$element('table#item-list');

    this.warehouseChooser.change(this.warehouseChooserChanged.bind(this));
    this.context.$element('input#all').change(this.allWarehouseButtonChanged.bind(this));
}


InventoryReport.prototype.allWarehouseButtonChanged = function(e) {
    var value = $(e.target).prop('checked');
    if (value) {
        this.dataTable.find('tr.inventory-row').hide();
        this.dataTable.find('tr.inventory-row.wh-All').show();
        this.warehouseChooser.prop('disabled', true);
    } else {
        this.warehouseChooser.prop('disabled', false);
        this.warehouseChooserChanged();
    }
}

InventoryReport.prototype.warehouseChooserChanged = function(e) {
    var widget = this;
    widget.dataTable.find('tr.inventory-row').hide();
    widget.warehouseChooser.find('option:selected').each(function() {
        var warehouse = $(this).text();
        widget.dataTable.find('tr.inventory-row.wh-'+warehouse).show();
    });
};
