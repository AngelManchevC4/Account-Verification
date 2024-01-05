'use strict';

/**
 * @namespace Account
 */

var server = require('server');

var base = server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var Encoder = require('*/cartridge/scripts/util/utilityHelpers');

server.replace(
    'SubmitRegistration',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');

        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var UUIDUtils = require('dw/util/UUIDUtils');

        var formErrors = require('*/cartridge/scripts/formErrors');

        var registrationForm = server.forms.getForm('profile');

        // form validation
        if (registrationForm.customer.email.value.toLowerCase()
            !== registrationForm.customer.emailconfirm.value.toLowerCase()
        ) {
            registrationForm.customer.email.valid = false;
            registrationForm.customer.emailconfirm.valid = false;
            registrationForm.customer.emailconfirm.error =
                Resource.msg('error.message.mismatch.email', 'forms', null);
            registrationForm.valid = false;
        }

        if (registrationForm.login.password.value
            !== registrationForm.login.passwordconfirm.value
        ) {
            registrationForm.login.password.valid = false;
            registrationForm.login.passwordconfirm.valid = false;
            registrationForm.login.passwordconfirm.error =
                Resource.msg('error.message.mismatch.password', 'forms', null);
            registrationForm.valid = false;
        }

        if (!CustomerMgr.isAcceptablePassword(registrationForm.login.password.value)) {
            registrationForm.login.password.valid = false;
            registrationForm.login.passwordconfirm.valid = false;
            registrationForm.login.passwordconfirm.error =
                Resource.msg('error.message.password.constraints.not.matched', 'forms', null);
            registrationForm.valid = false;
        }

        // setting variables for the BeforeComplete function
        var registrationFormObj = {
            firstName: registrationForm.customer.firstname.value,
            lastName: registrationForm.customer.lastname.value,
            phone: registrationForm.customer.phone.value,
            email: registrationForm.customer.email.value,
            emailConfirm: registrationForm.customer.emailconfirm.value,
            password: registrationForm.login.password.value,
            passwordConfirm: registrationForm.login.passwordconfirm.value,
            validForm: registrationForm.valid,
            form: registrationForm
        };

        if (registrationForm.valid) {
            res.setViewData(registrationFormObj);

            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var Transaction = require('dw/system/Transaction');
                var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
                var authenticatedCustomer;
                var serverError;

                // getting variables for the BeforeComplete function
                var registrationForm = res.getViewData(); // eslint-disable-line

                if (registrationForm.validForm) {
                    var accountObject;
                    var login = registrationForm.email;
                    var password = registrationForm.password;

                    // attempt to create a new user and log that user in.
                    try {
                        Transaction.wrap(function () {
                            var error = {};
                            // var newCustomer = CustomerMgr.createCustomer(login, password);
                            accountObject = accountHelpers.createAccount();
                        });
                    } catch (e) {
                        registrationForm.validForm = false;
                        registrationForm.form.customer.email.valid = false;
                        registrationForm.form.customer.emailconfirm.valid = false;
                        registrationForm.form.customer.email.error = Resource.msg('error.message.username.invalid', 'forms', null);
                    }
                }

                delete registrationForm.password;
                delete registrationForm.passwordConfirm;
                formErrors.removeFormValues(registrationForm.form);

                if (registrationForm.validForm) {
                    
                    accountHelpers.sendVerificationEmail(accountObject);

                    res.setViewData({ authenticatedCustomer: authenticatedCustomer });
                    res.json({
                        success: true,
                        redirectUrl: accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, true),
                        successMsg: Resource.msg('registration.success', 'registration', null)
                    });

                    req.session.privacyCache.set('args', null);
                } else {
                    res.json({
                        fields: formErrors.getFormErrors(registrationForm)
                    });
                }
            });
        } else {
            res.json({
                fields: formErrors.getFormErrors(registrationForm)
            });
        }

        return next();
    }
);

server.get("Verify", function (req, res, next) {
    var CustomerMgr = require("dw/customer/CustomerMgr");
    var Resource = require("dw/web/Resource");
    var CustomObjectMgr = require("dw/object/CustomObjectMgr");
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require("dw/web/URLUtils");
    var authenticatedCustomer;
    var serverError;

    var decodedId = Encoder.decodeId(req.querystring.id);

    var accountCustomObject = CustomObjectMgr.getCustomObject("ACCOUNTS_VERIFICATION_EMAIL", decodedId);

    if (accountCustomObject) {
        try {
            Transaction.wrap(function () {
                var error = {};
                var newCustomer = CustomerMgr.createCustomer(accountCustomObject.custom.email, accountCustomObject.custom.password);

                var authenticateCustomerResult = CustomerMgr.authenticateCustomer(accountCustomObject.custom.email, accountCustomObject.custom.password);
                if (authenticateCustomerResult.status !== 'AUTH_OK') {
                    error = { authError: true, status: authenticateCustomerResult.status };
                    throw error;
                }

                authenticatedCustomer = CustomerMgr.loginCustomer(authenticateCustomerResult, false);

                if (!authenticatedCustomer) {
                    error = { authError: true, status: authenticateCustomerResult.status };
                    throw error;
                } else {
                    // assign values to the profile
                    var newCustomerProfile = newCustomer.getProfile();

                    newCustomerProfile.firstName = accountCustomObject.custom.firstName;
                    newCustomerProfile.lastName = accountCustomObject.custom.lastName;
                    newCustomerProfile.phoneHome = accountCustomObject.custom.phone;
                    newCustomerProfile.email = accountCustomObject.custom.email;

                    CustomObjectMgr.remove(accountCustomObject);
                }
            });
        } catch (e) {
            serverError = true;
        }
    } else {
        res.setStatusCode(404);
    }

    res.redirect(URLUtils.url('Account-Show'));

    next();
})

module.exports = server.exports();
