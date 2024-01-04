
var base = module.superModule;

var URLUtils = require("dw/web/URLUtils");

base.sendVerificationEmail = function (registeredUser) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');

    var userObject = {
        email: registeredUser.custom.email,
        firstName: registeredUser.custom.firstName,
        lastName: registeredUser.custom.lastName,
        url: URLUtils.https('Account-Verify', 'id', registeredUser.custom.id)
    };

    var emailObj = {
        to: registeredUser.custom.email,
        subject: Resource.msg('email.subject.new.registration', 'registration', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@testorganization.com',
        type: emailHelpers.emailTypes.registration
    };

    emailHelpers.sendEmail(emailObj, 'checkout/confirmation/accountRegisteredEmail', userObject);
}

module.exports = base;