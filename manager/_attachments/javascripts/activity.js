$.couch.app(function(couchapp) {

    var showNotification = function(type, message) {
        // Type can be error, warning, success, info
        var alertClass = 'alert-' + type, notification = $('#inline-notification');
        notification
            .empty()
            .addClass(alertClass)
            .append(message)
            .show()
            .animate({ opacity: 0}, 5000, function() { notification.removeClass(alertClass) });
    };

    var loggedInUser = false;

    var account = $.sammy('#account', function() {
        var account = this;

        this.use('Template');

        this.bind('run', function(context) {
            this.init();
        });

        this.helpers( {
            isLoggedIn: function() {
                return !! loggedInUser;
            },
            doWithUser: function(callback) {
                callback(loggedInUser);
            },
            init: function(callback) {
                $.couch.session({
                    success: function(session) {
                        if (session.userCtx && session.userCtx.name) {
                            var prevName = loggedInUser;
                            loggedInUser = session.userCtx;
                            if (! loggedInUser || (loggedInUser.name != prevName)) {
                                // changed from loggout out to logged in, or switched user
                                account.trigger('loggedIn');
                            }
                            if (callback) {
                                callback(loggedInUser);
                            }
                        } else {
                            account.trigger('loggedOut');
                        }
                    }
                });
            },
            doWithValidUser: function(callback, force) {
                var user = this;
                if (!this.loggedInUser || force) {
                    this.init(callback);
                } else {
                    if (callback) {
                        callback(logegdInUser);
                    }
                }
            },
            login: function(name, password) {
                var context = this;
                $.couch.login({
                    name: name,
                    password: password,
                    success: function(s) {
                        context.doWithValidUser(function() { account.trigger('loggedIn') }, true );
                    },
                    error: function(code, error, reason) {
                        account.trigger('loggedOut');
                        showNotification('error', reason);
                    }
                });
            },
            logout: function() {
                var user = this;
                $.couch.logout({
                    success: function() {
                        user.logegdInUser = false;
                        account.trigger('loggedOut');
                    },
                    error: function(code, error, reason) {
                        showNotification('error', reason);
                    }
                });
            },
            signup: function(name, password) {
                var user = this;
                $.couch.signup({name: name}, password, {
                    success: function() {
                        this.login(name, password);
                    },
                    error: function() {
                        showNotification('error', reason);
                    }
                });
            }
        });  // end helpers

        this.get('#/login', function(context) {
            context.render('templates/account-loginForm.template')
                    .swap(function() {
                            context.$element('input').first().focus();
                            context.$element('button#cancel').click(function() { context.trigger('loggedOut')})
                          });
                    
        });
        this.post('#/login', function(context) {
            this.login(context.params['name'], context.params['password']);
        });
        this.bind('loggedIn', function(context) {
            this.render('templates/account-loggedIn.template', {user: loggedInUser}).swap();
            activity.trigger('loggedIn');
            this.redirect('#/');
        });

        this.get('#/signup', function(context) {
            context.render('templates/account-signupForm.template')
                    .swap(function() {
                            context.$element('input').first().focus();
                            context.$element('button#cancel').click(function() { context.trigger('loggedOut')})
                          });
        });
        this.post('#/signup', function(context) {
            this.signup(context.params['name'], context.params['password']);
        });

        this.get('#/logout', function(context) {
            this.logout();
        });
        this.bind('loggedOut', function(context) {
            this.render('templates/account-loggedOut.template').swap();
            activity.trigger('loggedOut');
            this.redirect('#/');
        });

        account.run();
    });


    var activity = $.sammy('#activity', function() {
        var activity = this;

        this.use('Template');
        this.use('Title');

        this.helpers({
            showNotification: showNotification,

            showNav: function() {
                $('#navbar .logged-in-menu').show();
            },

            hideNav: function() {
                $('#navbar .logged-in-menu').hide();
            },

            editItemModal: function(type, item_id) {
                var show_q = '_show/edit-' + type,
                    d = jQuery.Deferred(),
                    context = this;
                if (item_id) {
                    show_q += '/' + item_id;
                }
                $.get(show_q)
                    .then(function(content) {
                        var content = $(content),
                            orderTable = $('#order-display'),
                            modal;

                        modal = content.appendTo(context.$element())
                                           .modal({backdrop: true, keyboard: true, show: true});
                        modal.on('shown', function() { modal.find('input:text:first').focus() });
                        modal.on('hidden',
                                function() {
                                    modal.remove();
                                    d.resolve(modal);
                                });
                    });
                return d.promise();
            },

            errorModal: function(title, message) {
                var d = $.Deferred();
                var modal = $.mustache(couchapp.ddoc.templates['error-modal'],
                                            { title: 'Barcode', message: message });
                modal = $(modal).appendTo(this.$element())
                                .modal({backdrop: true, keyboard: true, show: true});
                modal.on('hidden', function() { modal.remove(); d.resolve(true) });
                return d.promise();
            },

            dialogModal: function(title, message) {
                var d = $.Deferred();
                var modal = $.mustache(couchapp.ddoc.templates['dialog-modal'],
                                            { title: title, message: message });
                modal = $(modal).appendTo(this.$element())
                                .modal({backdrop: true, keyboard: true, show: true});
                modal.on('hidden', function() { modal.remove(); d.resolve(true) });
                return d.promise();
            },

            newdialogModal: function(title, message, buttons) {
                var d = $.Deferred(),
                    answer,
                    firstButton = ((!buttons) || (buttons.length == 0)) ? 'Ok' : buttons.shift(),
                    modal, elt,
                    data = { title: title, firstButton: firstButton, buttons: buttons };

                if (typeof(message) == 'object') {
                    elt = message;   // This seems cheesy....
                } else {
                    data.message = message;
                }

                modal = $.mustache(couchapp.ddoc.templates['newdialog-modal'], data);
                modal = $(modal).appendTo(this.$element())
                                .modal({backdrop: true, keyboard: true, show: true});
                if (elt) {
                    modal.find('div.modal-body').append(elt);
                }
                modal.find('form').submit(function() {
                    answer = firstButton
                    modal.modal('hide');
                    return false;
                })
                .click(function(e) {
                    var elt = $(e.srcElement);
                    if (elt.is('button')) {
                        answer = elt.attr('value');
                        modal.modal('hide');
                        return false;
                    }
                });
                modal.on('hidden', function() { modal.remove(); d.resolve(answer) });
                return d.promise();
            },
 

            fixupOrderWarehouseSelect: function(warehouseList, selectedWarehouseId) {
                // The order show functions don't have access to all the warehouse docs, and
                // the select input is empty.  After we get the order's HTML, we need to fill
                // in the warehouse select
                var html = '',
                    warehouseSelect = $('select#warehouse-id');
                $.each(warehouseList, function(idx, warehouse) {
                    html += '<option value="' + warehouse.id + '">' + warehouse.key + '</option>';
                });
                warehouseSelect.append(html);
                selectedWarehouseId && selectedWarehouseId.done(
                    function(warehouseId) {
                        warehouseSelect.val(warehouseId);
                    });
            },

            fixupOrderDate: function() {
                $('input#date').val(this.todayAsString());
            },
 

            // FIXME - orders _do_ have the names now - remove this
            fixupOrderItemNames: function() {
                // The order show functions don't have access to all the item docs, so
                // we need to go through all the item table rows and fill in names for them
                var trs = $('tr.line-item');
                var barcodes = [];
                trs.each(function(idx, tr) {
                    barcodes.push($(tr).attr('id').substr(5));   // Their IDs start with 'scan-'
                });

                var d = $.Deferred();
                couchapp.view('items-by-barcode', {
                                keys: barcodes,
                                include_docs: true,
                                success: function(data) {
                                    var tr, i, row;
                                    for ( i = 0; i < data.rows.length; i++) {
                                        // Find the tr for this barcode, and the name td inside that
                                        var td = $('tr.line-item#scan-' + data.rows[i].key + ' td.item-name');
                                        td.text(data.rows[i].doc.name);
                                    }
                                    d.resolve(true);
                                }
                        });
                return d.promise();
            },

            // This updates the price/cost of all items in the order
            updateOrdersItems: function(orderDoc) {
                var cost_price_key = orderDoc['order-type'] == 'receive' ? 'cost-cents' : 'price-cents',
                    items_to_update = {},
                    barcode,
                    d = $.Deferred();

                if ('_rev' in orderDoc) {
                    // Don't update item costs/prices when editing an exiting order
                    d.resolve();
                } else {
                    // Go through the items list and update the cost/price of them
                    if ('items' in orderDoc) {
                        $.each(orderDoc['items'], function(barcode, quan) {
                            items_to_update[barcode] = quan;
                        });
                    }
                    couchapp.view('items-by-barcode', {
                        keys: Object.keys(items_to_update),
                        include_docs: true,
                        success: function(data) {
                            var i = 0,
                                itemDoc,
                                barcode,
                                whenComplete = 'resolve',
                                waitingOn = data.rows.length;

                            // After processing an item below, they call done()
                            function done(success) {
                                if (! success) {
                                    // A single failure means don't save the order
                                    whenComplete = 'reject';
                                }
                                if (--waitingOn == 0) {
                                    d[whenComplete]();
                                }
                            }
                            for (i = 0; i < data.rows.length; i++) {
                                itemDoc = data.rows[i].doc;
                                barcode = itemDoc.barcode;
                                (function(i, newCost, itemDoc) {
                                    if ((newCost != 0) && (newCost != itemDoc[cost_price_key])) {
                                    // The incoming order has a different cost/price
                                        itemDoc[cost_price_key] = newCost;
                                        couchapp.db.saveDoc(itemDoc, {
                                            success: function() {
                                                done(true);
                                            },
                                            error: function(status, reason, message) {
                                                context.showNotification('error', 'Problem updating ' + cost_price_key + ' for item ' + itemDoc.desc + ': ' + message);
                                                done(false);
                                            }
                                        });
                                    } else {
                                        done(true);
                                    }
                                })(i, orderDoc['item-costs'][barcode], itemDoc);
                            }
                        }
                    });
                }
                return d.promise();
            },

            saveOrder: function(orderDoc, d) {
                d = d || $.Deferred();
                couchapp.db.saveDoc(orderDoc, {
                    success: function() {
                        d.resolve()
                    },
                    error: function(status, reason, message) {
                        d.reject(status, reason, message);
                    }
                });
                return d.promise();
            },

            // Today's date as a string
            todayAsString: function() {
                var now = new Date,
                    month = now.getMonth() + 1,
                    dateStr = now.getFullYear() + '-'
                            + (month < 10 ? '0' : '') + month + '-'
                            + (now.getDate() < 10 ? '0' : '') + now.getDate();
                return dateStr;
            },

            // Find the last box ID used and return the next one
            getNextBoxId: function() {
                var d = $.Deferred();

                couchapp.view('shipment-box-ids', {
                    descending: true,
                    startkey: [this.todayAsString(), ''],
                    limit: 1,
                    success: function(data) {
                        var boxID = data.rows.length ? (data.rows[0].key[1] + 1) : 1;
                        d.resolve(boxID);
                    }
                });
                return d.promise();
            },

            // Create and save an order-like document
            createOrderlikeDoc: function(config, params) {
                var context = this,
                    d = $.Deferred(),
                    keep_costs = config.keep_costs,  // Orders save costs, inventories do not
                    quantity_fixup = config.quantity_fixup,  // sales will negate the quantity, receives and inventories will not
                    orderDoc = config.order_doc,
                    next_url = config.next_url,
                    order_number = params['order-number'],
                    items = {},
                    item_costs = {},
                    item_names = {},
                    item_skus = {};

                function extract_items() {
                    var prop = '',
                    matches;
                    for (prop in params) {
                        matches = /scan-(.*?)-quan/.exec(prop);
                        if (matches && matches.length) {
                            items[matches[1]] = quantity_fixup(parseInt(params[prop]));
                            continue;
                        }
                        if (keep_costs) {
                            matches = /scan-(.*?)-cost/.exec(prop);
                            if (matches && matches.length) {
                                item_costs[matches[1]] = Math.round(parseFloat(params[prop]) * 100);
                                continue;
                            }
                        }
                        matches = /scan-(.*?)-name/.exec(prop);
                        if (matches && matches.length) {
                            item_names[matches[1]] = params[prop];
                            continue;
                        }
                        matches = /scan-(.*?)-sku/.exec(prop);
                        if (matches && matches.length) {
                            item_skus[matches[1]] = params[prop];
                            continue;
                        }
                    }
                };

                extract_items();
                orderDoc.items = items;
                orderDoc['item-names'] = item_names;
                orderDoc['item-skus']  = item_skus;
                if (keep_costs) {
                    orderDoc['item-costs'] = item_costs;
                }
                
                // Copy some params to the order doc directly
                var copy_props =  ['date','customer-name','customer-id','warehouse-id',
                                    'shipping-service-level', 'order-source','is-taxable','_rev',
                                    'shipping-charge','section', 'customer-address'],
                    i;
                for (i = 0; i < copy_props.length; i++) {
                    if (copy_props[i] in params) {
                        orderDoc[copy_props[i]] = params[copy_props[i]];
                    }
                }

                $.log(orderDoc);

                // Find out what the warehouse's name is given its ID
                var whenDone = $.Deferred();

                function getWarehouseAndSaveOrder() {
                    couchapp.db.openDoc(orderDoc['warehouse-id'], {
                        success: function(warehouseDoc) {
                            orderDoc['warehouse-name'] = warehouseDoc.name;
                            context.saveOrder(orderDoc, whenDone);
                        }
                    });
                };

                if (keep_costs) {
                    context.updateOrdersItems(orderDoc)
                        .then( getWarehouseAndSaveOrder );
                } else {
                    getWarehouseAndSaveOrder();
                }
                
                return whenDone.promise();
            }

        });

        function getWarehouseList () {
            var d = $.Deferred();
            couchapp.view('warehouses-by-name', {
                success: function(data) {
                    d.resolve(data.rows);
                },
                error: function() {
                    d.reject();
                },
            });
            return d.promise();
        }

//        this.around({ except: /#\/(login|signup)/ }, function(callback) {
//            var context = this;
//            if (User.isLoggedIn()) {
//                callback();
//            } else {
//                this.trigger('loggedOut');
//            }
//            return false;
//        });

        this.bind('run', function() { 

        });

        this.bind('loggedIn', function(e) {
            var context = this;
            var account_context = new account.context_prototype();
            account_context.doWithUser(function(user) {
                if (user) {
                    context.showNav();
                } else {
                    context.hideNav();
                }
            });
        });

        this.bind('loggedOut', function(context) {
            this.$element().empty();
            this.hideNav();
            showNotification('info','Logged Out');
        });

        this.before({ except: /#\/(login|signup)/ }, function() {

            //User.doWithValidUser(this.showNav);
        });

        this.get('#/', function(context) {
            context.$element().empty();
        });

        // When called without an order-number, it presents a list of shipments without tracking
        // numbers for the user to pick from.  The form re-get()s this same URL with the
        // order-number and shipment as a param
        this.get('#/confirm-shipment/', function(context) {
            if (! ('shipment-id' in context.params)) {
                // No shipment, show the list of shipments to pick form
                var list_q = '_list/confirm-shipment-order-picker/unconfirmed-shipments';
                context.$element().load(list_q);

            } else {
                // Show the confirm-shipment entry form

                // shipment_id is composite of shipment-orderNumber
                var shipment_id = context.params['shipment-id'],
                    shipment    = shipment_id.substr(0, shipment_id.indexOf('-')),
                    orderNumber = shipment_id.substr(shipment_id.indexOf('-') + 1),
                    show_q      = '_show/confirm-shipment/order-' + orderNumber;

                context.$element().load(show_q + '?shipment='+encodeURIComponent(shipment));
            }

        });

        this.post('#/confirm-shipment/:orderNumber/:shipment', function(context) {
            var params = context.params,
                cost = Math.round(parseFloat(params['shipping-cost']) * 100);

            couchapp.db.openDoc('order-' + params.orderNumber, {
                success: function(doc) {
                    doc.shipments[params.shipment]['tracking-number']   = params['tracking-number'];
                    doc.shipments[params.shipment]['shipping-cost']     = cost;

                    couchapp.db.saveDoc(doc, {
                        success: function() {
                            showNotification('success', 'Shipment confirmed');
                            context.redirect('#/confirm-shipment/');
                        },
                        error: function(status, reason, message) {
                                showNotification('error', 'Could not confirm shipment: ' + message);
                        }
                    });
                },
                error: function( status, reason, message) {
                                showNotification('error', 'There is no order number ' + orderNumber);
                }
            });
        });

        // When called without an order-number, it presents a list of sale orders with unshipped items
        // to the user to pick from.  The form re-get()s this same URL with the order-number as a
        // param.
        this.get('#/shipment/', function(context) {
            if (! ('order-number' in context.params)) {
                // No order-number, show the list of orders to pick from

                var list_q = '_list/shipment-order-picker/shipment-order-picker';
                $.get(list_q, function(content) {
                    context.$element().html(content);
                    // The loaded page has scripts we need to start up
                    // that match the test box and select list
                    context.$element().find('script').each( function(i) {
                        eval($(this).text());
                    });
                });
            } else {
                // Presents a sale order to the user and allows them to select unshipped items to send
                // out in this shipment
                var orderNumber = context.params['order-number'],
                    orderId = 'order-' + orderNumber;
            
                $.get('_show/shipment/' + orderId)
                    .done(function(content) {
                        context.$element().html(content);
                        context.fixupOrderDate();
                        ShipmentWidget({
                            couchapp: couchapp,
                            context: context,
                            activity: activity
                        });
                    })
                    .fail(function(resp,  status, reason) {
                        message = $.parseJSON(resp.responseText).reason;
                        showNotification('error', 'Could not generate shipment for order ' + orderNumber + ': ' + message);
                    });
            }
        });

        // Called to edit a previously defined shipment
        this.get('#/edit/shipment/:orderId/:shipmentId', function(context) {
            var show_q = '_show/shipment/' + context.params.orderId;
            context.$element()
                .load(show_q + '?shipment=' + encodeURIComponent(context.params.shipmentId),
                    function() {
                        ShipmentWidget({
                            couchapp: couchapp,
                            context: context,
                            activity: activity
                        });
                    }
                );

        });

        this.get('#/delete/shipment/:orderId/:shipment', function(context) {
            var orderNumber = context.params.orderId.substr(6),
                shipment = context.params.shipment;
            couchapp.db.openDoc(context.params.orderId, {
                success: gotOrderDoc,
                error: function() {
                    showNotification('error', 'Could not find an order with order number ' + orderNumber);
                }
            });

            function gotOrderDoc(doc) {
                if ( (! ( 'shipments' in doc)) || (shipment >= doc.shipments.length)) {
                    showNotification('error', 'Order ' + orderNumber
                                                + ' has no shipment ' + shipment);
                    return;
                }
                var message = 'Are you sure you want to delete shipment '
                               + shipment + ' from order ' + orderNumber;
                var answer = context.newdialogModal('Delete Shipment',
                                                    message,
                                                    ['Ok', 'Cancel']);
                answer.done(function(answer) {
                    if (answer == 'Ok') {
                        doc.shipments.splice(shipment, 1);  // Remove the shipment
                        couchapp.db.saveDoc(doc, {
                            success: function() {
                                showNotification('success', 'Shipment deleted');
                            },
                            error: function(status, reason, message) {
                                showNotification('error', 'Could not delete shipment: '+message);
                            }
                        });
                    }
                });
                answer.always(function() {
                        window.history.back();
                });
            }

        });

        // called when a shipment form is submitted to define a shipment
        this.post('#/shipment/', function(context) {
            var orderId = 'order-' + context.params['order-number'];

            couchapp.db.openDoc(orderId, {
                success: gotOrderDoc,
                error: function() {
                    showNotification('error',
                                    'There is no order with order-number ' + context.params['order-number']);
                }
            });
            
            function gotOrderDoc(doc) {
                var items = {},
                    thisShipment,
                    prop,
                    matches;
                // Go through the params and look for quantities
                for (prop in context.params) {
                    matches = /scan-(\d+)-quan/.exec(prop);
                    if (matches && matches.length) {
                        items[matches[1]] = parseInt(context.params[prop]);
                        continue;
                    }
                }
                doc.shipments = doc.shipments || [];
                doc.items = doc.items || {};

                if (context.params.shipment) {
                    // Altering a previously defined shipment
                    thisShipment = doc.shipments[context.params.shipment];
                    thisShipment.date = context.params['date'];
                    thisShipment.items = items;
                } else {
                    // Saving a new shipment
                    thisShipment = { date: context.params['date'], items: items };
                    doc.shipments.push(thisShipment);
                }

                if (thisShipment.box) {
                    saveOrderDoc(doc, thisShipment.box);
                } else {
                    context.getNextBoxId()
                            .then( function(boxID) { addBoxIdToLatestShipment(doc, boxID) });
                }
            }

            function addBoxIdToLatestShipment(doc, boxID) {
                doc.shipments[ doc.shipments.length - 1 ].box = boxID;
                saveOrderDoc(doc, boxID);
            }

            function saveOrderDoc(doc, boxID) {
                couchapp.db.saveDoc(doc, {
                    success: function() {
                        context.dialogModal('Shipment saved', 'Shipment for order ' + orderId
                                            + ' is box ' + boxID)
                            .then(function() {
                                showNotification('success', 'Shipment saved');
                                context.redirect('#/shipment/');
                            });
                    },
                    error: function(status, reason, message) {
                            showNotification('error', 'Could not save shipment: ' + message);
                    }
                });
            }
                
        });


        // Presents a form to the user to start an inventory correction
        this.get('#/edit/inventory/(.*)', function(context) {
            var inv_id = context.params['splat'][0],
                show_q = '_show/partial-inventory';

            if (inv_id) {
                show_q += '/' + inv_id;
            }
            function runOrderWidget() {
                getWarehouseList().then( context.fixupOrderWarehouseSelect );
                context.fixupOrderDate();
                new InventoryWidget({   couchapp: couchapp,
                                    context: context,
                                    activity: activity,
                            });
            }

            context.$element().load(show_q, runOrderWidget);
        });

        // Submit a partial inventory correction
        this.post('#/inventory/(.*)', function(context) {
            var params = context.params,
                section = params['splat'][0] || params['section'],
                quantity_fixup,
                orderDoc = { _id: 'inv-' + section, type: 'inventory' },
                next_url = '#/';

            quantity_fixup = function(n) { return n };  // receive items are positive

            var whenDone = context.createOrderlikeDoc({
                                            keep_costs: false,
                                            quantity_fixup: quantity_fixup,
                                            order_doc: orderDoc,
                                            next_url: next_url,
                                        },
                                        params);
            whenDone.done(
                function() {
                    context.showNotification('success', 'Inventory for section ' + section + ' saved!');
                        activity.trigger('inventory-updated', orderDoc);
                    context.$element().empty();
                    context.redirect(next_url);
                });
            whenDone.fail(
               function(status, reason, message) {
                    $.log('Problem saving inventory for section  '+ section +"\nmessage: " + message + "\nstatus: " + status + "\nreason: "+reason);
                    context.showNotification('error' , 'Problem saving inventory for section ' + section + ': ' + message);
                });

 
        });

        // Used to apply the accumulated partial physical inventories into one "order" per
        // warehouse that will make the item counts correct
        this.get('#/inventory-commit/', function(context) {
            var content = $.mustache(couchapp.ddoc.templates['confirm-inventory-corrections'],
                                    { action: '#/inventory-commit/' },
                                    couchapp.ddoc.templates.partials);
            context.$element().html(content);
            context.$element('div#corrections')
                    .load('_list/proposed-inventory-correction/inventory-by-permanent-warehouse-barcode?group=true');
        });

        this.post('#/inventory-commit/', function(context) {
            var todaysDate = context.todayAsString(),
                stop_from_errors = false,
                is_last_doc = false,
                remove_on_error = [],   // In case of problems, remove these already-saved docs
                d = $.Deferred();

            d.done(function() {
                showNotification('success', 'Inventory changes applied successfully');
                context.redirect('#/');
            });
            d.fail(function(message) {
                remove_on_error.forEach(function(orderDoc) {
                    couchapp.db.removeDoc(orderDoc);
                });
                showNotification('error', lessage);
            });

            // Start the process!
            couchapp.list('proposed-inventory-correction', 'inventory-by-permanent-warehouse-barcode', {
                group: true,
                success: processRows,
                error: function(status, reason, message) {
                    stop_from_errors = true;
                    d.reject('Cannot get inventory corrections: '+message);
                }
            });
            function processRows(warehouses) {
                var warehouse,
                    barcode,
                    thisItem,
                    invDoc;

                // FIXME - we could probably move this conversion code into the list
                for (warehouse in warehouses) {
                    invDoc = {
                        _id: 'order-' + warehouse + '-inv-' + todaysDate,
                        type: 'order',
                        'order-type': 'inventory-correction',
                        date: todaysDate,
                        'warehouse-name': warehouse,
                        'customer-name': loggedInUser,
                        items: {},
                        'item-skus': {},
                        'item-names': {}
                    };
                    for (barcode in warehouses[warehouse]) {
                        thisItem = warehouses[warehouse][barcode];
                        invDoc.items[barcode] = thisItem.count;
                        invDoc['item-skus'][barcode] = thisItem.sku;
                        invDoc['item-names'][barcode] = thisItem.name;
                    }
                    if (stop_from_errors) return;
                    couchapp.db.saveDoc(invDoc, {
                        error: function(status, reason, message) {
                            stop_from_errors = true;
                            d.reject('Cannot save inventory correction for '+warehouse+': '+message);
                        }
                    });
                }
                removePartialInventories();
            }

            var left_to_delete = 0;
            function removePartialInventories() {
                couchapp.db.allDocs({
                    startkey: 'inv-',
                    endkey: 'inv-\u9999',
                    success: function(data) {
                        left_to_delete = data.rows.length;
                        data.rows.forEach(removeThisPartialInventory);
                    },
                    error: function(status, reason, message) {
                        stop_from_errors = true;
                        d.reject('Cannot get list of partial inventories: '+message);
                    }
                });
            }

            function removeThisPartialInventory(row) {
                if (stop_from_errors) return;

                var remove = { _id: row.id, _rev: row.value.rev };
                couchapp.db.removeDoc(remove, {
                    success: function() {
                        left_to_delete--;
                        if (left_to_delete <= 0) {
                            d.resolve();
                        }
                    },
                    error: function(status, reason, message) {
                        stop_from_errors = true;
                        d.reject('Cannot remove partial inventory doc '+row.id);
                    }
                });
            }
        });

        // Presents a form to the user to edit an already existing order
        this.get('#/edit/order/(.*)', function(context) {
            var order_id = context.params['splat'][0],
                show_q = '_show/edit-order';

            if (order_id) {
                show_q += '/' + order_id;
            }

            $.get(show_q)
                .then(function(content) {
                    context.$element().html(content);

                    // We still need to fixup the warehouse and item names
                    var d = $.Deferred();
                    couchapp.db.openDoc(order_id, {
                        success: function(doc) {
                            d.resolve(doc['warehouse-id']);
                        }
                    });
                    getWarehouseList().then( function(warehouseList) { context.fixupOrderWarehouseSelect(warehouseList, d.promise()) } );
                    context.fixupOrderItemNames()
                        .then(function() {
                            new OrderWidget({   couchapp: couchapp,
                                                context: context,
                                                activity: activity
                                        });
                        });
                });
        });

        // This presents a form to the user to create some kind of order
        // order_type is either receive or sale
        // The form posts to #/order/receive below VVV
        this.get('#/create-order/:order_type/', function(context) {
            var show_q = '_show/edit-order/?type=' + context.params.order_type;

            $.get(show_q)
                .then(function(content) {
                    context.$element().html(content);

                    // Still need to supply today's date and fix up the warehouse select
                    getWarehouseList().then( context.fixupOrderWarehouseSelect );
                    context.fixupOrderDate();
                    new OrderWidget({   couchapp: couchapp,
                                        context: context,
                                        activity: activity
                                });
                });
                    
        });

        // Called when the user submits an order to the system
        // order_type is receive or sale
        this.post('#/create-order/(.*)/(.*)', function(context) {
            var params = context.params,
                order_type = params['splat'][0],
                order_number = params['splat'][1] || params['order-number'],
                quantity_fixup,
                orderDoc = { _id: 'order-' + order_number, type: 'order' },
                next_url;

            if (order_type == 'receive') {
                quantity_fixup = function(n) { return n };  // receive items are positive
                next_url = '#/';   // Go back to the start page
            } else if (order_type == 'sale') {
                quantity_fixup = function(n) { return 0 - n };  // sale items are negative
                next_url = context.path;  // stay at the same URL
            } else {
                showNotification('error', 'Unknown type of order: '+order_type);
                return;
            }
            orderDoc['order-type'] = order_type;

            var whenDone = context.createOrderlikeDoc({
                                            keep_costs: true,
                                            quantity_fixup: quantity_fixup,
                                            order_doc: orderDoc,
                                            next_url: next_url,
                                        },
                                        params);
            whenDone.done(
                function() {
                    context.showNotification('success', 'Order ' + order_number + ' saved!');
                        activity.trigger('order-updated', orderDoc);
                    context.$element().empty();
                    context.redirect(next_url);
                });
            whenDone.fail(
               function(status, reason, message) {
                    $.log('Problem saving order '+ orderDoc._id +"\nmessage: " + message + "\nstatus: " + status + "\nreason: "+reason);
                    context.showNotification('error' , 'Problem saving order ' + orderDoc._id + ': ' + message);
                });
        });

        this.get('#/data/:type/', function dataLister(context) {
            var search  = context.params['search-query'] || '';
                type    = context.params['type'],
                view    = type + '-by-any',
                list_q  = '_list/items/' + view;

            if (search) {
                list_q += '?search-query=' + encodeURIComponent(search);
            }

            // we'd rather use couchapp.list, but it only supports getting JSON data :(
            $.get(list_q)
                .then(function(content) {
                        context.$element().html(content);

                        // The physical inventories lister should show the list of proposed corrections, too
                        if (type == 'inventories') {
                            var list_q = '_list/proposed-inventory-correction/inventory-by-permanent-warehouse-barcode?group=true';
                            // FIXME: For some reason, using $.get() here would always trigger the error handler :(
                            // we'll spell it out longhand  - maybe the list function isn't setting the content type correctly?
                            $.ajax({
                                url: list_q,
                                type: 'GET',
                                async: true,
                                dataType: 'html',
                                success: function(content) {
                                    context.$element().append(content);
                                },
                                error: function(resp, status, error) {
                                    1;
                                }
                            });
                            //$.get(list_q, function(content) {
                            //    context.$element().append(content);
                            //});
                            //$.get(list_q).
                            //    success(function(content) {
                            //            context.$element().append(content);
                            //    })
                            //    .error(function(results) {
                            //            1;
                            //    });
                            //$.get(list_q)
                            //    .then(function(content) {
                            //            context.$element().append(content);
                            //        },
                            //          function(result) {
                            //              1;
                            //        });
                        }
                    },
                    function(result) {
                        showNotification('error', 'Error getting data for '+type+ ': ' + $.parseJSON(result.responseText).reason);
                    }
                );
        });

        this.get('#/edit/(.*)/(.*)', function(context) {
            var type = context.params['splat'][0],
                item_id = context.params['splat'][1];

            this.editItemModal(type, item_id)
                .then(function(modal) {
                        window.history.back()
                    });
        });

        this.post('#/edit/(.*)/(.*)', function(context) {
            var validationError = 0,
                type = context.params['splat'][0],
                this_id = context.params['splat'][1],
                modal = $('.modal');

            var markError = function(field, message) {
                var fieldset = $('fieldset#' + field + '-field');
                fieldset.addClass('error');
                $('[name=' + field + ']', fieldset).after('<span class="help-inline label label-important"><i class="icon-exclamation-sign icon-white"></i>&nbsp;'
                                            + message + '</span>');
            };
            var checkFieldHasValue = function(field) {
                var value = context.params[field];
                if ((value == undefined) || (value == '')) {
                    markError(field, 'Required');
                    validationError = 1;
                }
            };
            var checkDuplicateField = function(field, callback) {
                var value = context.params[field];
                couchapp.view(type + 's-by-'+field, {
                    key: value,
                    success: function(data) {
                        if (data.rows.length && data.rows[0].id != this_id) {
                            // Found an item with the form's sku/barcode and it's a different doc id
                            markError(field, 'Duplicate');
                            validationError = 1;
                        }
                        callback();
                    }
                });
            };
            var saveItem = function(context) {
                if (validationError) {
                    $.log('not saving because of errors');
                    return false;
                }
                var doc = { type: type };
                if (context.params['_id']) {
                    doc['_id'] = context.params['_id'];
                    doc['_rev'] = context.params['_rev'];
                }
                if (type == 'item') {
                    var cost  = context.params['cost'] ? parseFloat(context.params['cost']) : 0
                        price = context.params['price'] ? parseFloat(context.params['price']) : 0
                    doc['barcode']      = context.params['barcode'];
                    doc['name']         = context.params['name'];
                    doc['sku']          = context.params['sku'];
                    doc['description']  = context.params['description'];
                    doc['cost-cents']   = Math.round(cost * 100);
                    doc['price-cents']  = Math.round(price * 100);
                } else if (type == 'customer') {
                    doc['firstname'] = context.params['firstname'];
                    doc['lastname'] = context.params['lastname'];
                    doc['address'] = context.params['address'];
                    doc['istaxable'] = (context.params['istaxable'] == 'on' ? 1 : 0);
                    doc['phonenumber'] = context.params['phonenumber'];
                    doc['alternatephonenumber'] = context.params['alternatephonenumber'];
                    doc['email'] = context.params['email'];
                    doc['notes'] = context.params['notes'];
                } else if (type == 'warehouse') {
                    doc['name'] = context.params['name'];
                    doc['address'] = context.params['address'];
                    doc['phonenumber'] = context.params['phonenumber'];
                    doc['alternatephonenumber'] = context.params['alternatephonenumber'];
                    doc['email'] = context.params['email'];
                    doc['notes'] = context.params['notes'];
                }
                $.log(doc);

                couchapp.db.saveDoc(doc, {
                    success: function(data) {
                        modal.modal('hide');
                        activity.trigger(type + '-updated', doc);
                        showNotification('success', type + ' saved');
                    },
                    error: function(status, reason, message) {
                        showNotification('error', 'Problem saving ' + type + ': ' + message);
                    }
                });
            };

            // Remove any errors from the last time they tried to submit
            $('fieldset.error span.help-inline', context.$element()).remove();

            if (type == 'item') {
                checkFieldHasValue('sku');
                checkFieldHasValue('barcode');
                checkFieldHasValue('name');

                checkDuplicateField('barcode',
                    function() { checkDuplicateField('sku',
                        function() { saveItem(context) }
                    )}
                );
            } else if (type == 'customer') {
                checkFieldHasValue('firstname');
                checkFieldHasValue('lastname');
                saveItem(context);
            } else if (type == 'warehouse') {
                checkFieldHasValue('name');
                checkFieldHasValue('address');
                checkDuplicateField('name',
                    function() { saveItem(context) }
                );
            }
                
        });

        this.get('#/delete/:thing/:id', function(context) {
            var docid = context.params['id'],
                thing = context.params['thing'],
                doc,
                modal,
                show_q = '_show/delete-thing/' + docid;

            function cleanUpModal () {
                if (modal) {
                    modal.modal('hide');
                    modal.remove();
                    window.history.back();
                }
            }

            couchapp.db.openDoc(docid, {
                success: function(loadedDoc) {
                    if (loadedDoc.type != thing) {
                        context.showNotification('error', 'Expected document ' + docid + ' to be a ' + thing
                                                            + ', but it is a ' + loadedDoc.type);
                        cleanUpModal();
                    } else {
                        doc = loadedDoc;
                    }
                },
                error: function(code, error, reason) {
                    cleanUpModal();
                    context.showNotification('error', 'There is no '+ thing + 'with id ' + docid);
                }
            });
    
            $.get(show_q)
                .then(function(content) {
                    modal = $(content).appendTo(context.$element())
                                   .modal({backdrop: true, keyboard: true, show: true});
                    modal.on('hidden', function() {
                                            modal.remove();
                                            window.history.back();
                                        });
                    modal.find('#delete-confirm')
                        .click( function(event) {
                            couchapp.db.removeDoc(doc, {
                                success: function() {
                                    showNotification('success', context.params['thing'] + ' removed');
                                    modal.modal('hide');
                                },
                                error: function(status) {
                                    context.log('delete failed after removeDoc');
                                    context.log(doc);
                                    context.log(status);
                                    modal.modal('hide');
                                    showNotification('error', 'Delete failed');
                                }
                            })
                            event.preventDefault();
                        });
                });
            
        });


        this.get('#/report/inventory/', function(context) {
            var search = context.params['search-query']
                list_q = '_list/current-inventory-report/inventory-by-permanent-warehouse-barcode?group=true&startkey=[1]';

            if (search) {
                list_q += '&search-query=' + encodeURIComponent(search);
            }
            context.$element().load(list_q, function() {
                new InventoryReport({
                        context: context,
                        activity: activity,
                        couchapp: couchapp
                    });
            });
        });

        this.get('#/report/item-history/:barcode', function(context) {
            var list_q = '_list/item-history/item-history-by-barcode-date';

            if ('barcode' in context.params) {
                list_q += '?startkey=' + encodeURIComponent(JSON.stringify([context.params.barcode]))
                        + '&endkey=' + encodeURIComponent(JSON.stringify([context.params.barcode,{}]));
            }

            $.ajax({
                url: list_q,
                type: 'GET',
                async: true,
                dataType: 'html',
                success: function(content) {
                    var answer = context.newdialogModal('Item History',
                                                        $(content),
                                                        ['Ok']);
                    answer.always(function() {
                        window.history.back()
                    });
                },
                error: function(code, error, message) {
                    showNotification('error', 'History not available: '+message);
                }
            });
        });


    });

    activity.run('#/');

});
