'use strict';

var base = require("base/login/login");

var formValidation = require('base/components/formValidation');
var createErrorNotification = require('base/components/errorNotification');
var createSuccessNotification = require('../components/successNotification');

base.register = function () {
    $('form.registration').submit(function (e) {
        var form = $(this);
        e.preventDefault();
        var url = form.attr('action');
        form.spinner().start();
        $('form.registration').trigger('login:register', e);
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: form.serialize(),
            success: function (data) {
                form.spinner().stop();
                if (!data.success) {
                    $('form.registration').trigger('login:register:error', data);
                    formValidation(form, data);
                } else {
                    $('form.registration').trigger('login:register:success', data);
                    createSuccessNotification($('.error-messaging'), data.successMsg);
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification($('.error-messaging'), err.responseJSON.errorMessage);
                }

                form.spinner().stop();
            }
        });
        return false;
    });
}

module.exports = base;