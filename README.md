## CouchStore

CouchStore is a [Couchapp](http://couchapp.org) for managing a small business
inventory.  It tracks items, customers, warehouses, orders and shipments.

To deploy this source repo to your database, create a new database and use
the command-line couchapp tool:
> couchapp push manager http://name:passwd@hostname:5984/databaseName

## Features

Track items by barcode, name and SKU.  Reports for current inventory levels,
which items need to be ordered, most and least popular items.

Record customer information, like name, address and phone number.

Take orders from multiple warehouses.  Track multiple shipments per order.
Transfer items between warehouses.  Look up orders by customer, order number,
item barcode or SKU.

Record a year-end physical inventory done in multiple parts.n multiple parts.

## Workflow

Most of the daily work is done from the "Orders" menu.  Receiving shipments
from vendors, is done from "Receive Shipment".  Sales are done under
"Record a Sale".  When making a shipment, not all the items need to be
in the same shipment.

The "Data" menu is for searching and maintaining the basic entites of the
system: Items, Customers, Warehouses, Orders and Shipments.

The "Inventory" menu is for transferring items between warehouses, and
performing a physical inventory.


~                                                      
