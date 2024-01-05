
var base = module.superModule;

var URLUtils = require("dw/web/URLUtils");

var Encoder = require('*/cartridge/scripts/util/utilityHelpers');

base.sendVerificationEmail = function (registeredUser) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');

    var encodedId = Encoder.encodeId(registeredUser.custom.id);

    var userObject = {
        email: registeredUser.custom.email,
        firstName: registeredUser.custom.firstName,
        lastName: registeredUser.custom.lastName,
        url: URLUtils.https('Account-Verify', 'id', encodedId)
    };

    var emailObj = {
        to: registeredUser.custom.email,
        subject: Resource.msg('email.subject.new.registration', 'registration', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.registration
    };

    emailHelpers.sendEmail(emailObj, 'checkout/confirmation/accountRegisteredEmail', userObject);
}

base.createAccount = function (email, password, phone, firstName, lastName) {
    var Transaction = require('dw/system/Transaction');
    var UUIDUtils = require('dw/util/UUIDUtils');
    var CustomObjectMgr = require("dw/object/CustomObjectMgr");

    var accountID = UUIDUtils.createUUID();

    var accountObject;

    Transaction.wrap(function () {
        accountObject = CustomObjectMgr.createCustomObject("ACCOUNTS_VERIFICATION_EMAIL", accountID);
        accountObject.custom.email = email;
        accountObject.custom.password = password;
        accountObject.custom.phone = phone;
        accountObject.custom.firstName = firstName;
        accountObject.custom.lastName = lastName;
    });

    return accountObject;
}

base.createAccountAfterVerification = function(customObj,id){
    var CustomerMgr = require("dw/customer/CustomerMgr");
    var Resource = require("dw/web/Resource");
    var CustomObjectMgr = require("dw/object/CustomObjectMgr");
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require("dw/web/URLUtils");
    var authenticatedCustomer;
    var serverError;

    var accountCustomObject = CustomObjectMgr.getCustomObject(customObj, id);

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
}

module.exports = base;