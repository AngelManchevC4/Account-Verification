
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

base.createAccount = function (account){
    var UUIDUtils = require('dw/util/UUIDUtils');
    
    var accountID = UUIDUtils.createUUID();

    var accountObject;

    accountObject = CustomObjectMgr.createCustomObject("ACCOUNTS_VERIFICATION_EMAIL", accountID);
    accountObject.custom.email = registrationForm.email;
    accountObject.custom.password = registrationForm.password;
    accountObject.custom.phone = registrationForm.phone;
    accountObject.custom.firstName = registrationForm.firstName;
    accountObject.custom.lastName = registrationForm.lastName;

    return accountObject;
}

module.exports = base;