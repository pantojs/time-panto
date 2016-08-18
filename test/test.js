/**
 * Copyright (C) 2016 pantojs.xyz
 * test.js
 *
 * changelog
 * 2016-08-18[12:38:23]:revised
 *
 * @author yanni4night@gmail.com
 * @version 0.1.0
 * @since 0.1.0
 */
'use strict';
const panto = require('panto');
const timePanto = require('../');

describe('time-panto', () => {
    it('should print', done => {
        panto.setOptions({
            cwd: __dirname,
            src: 'fixtures'
        });

        timePanto(panto);

        panto.$('*.css').tag('css');
        panto.$('*.coffee').tag('coffee');

        panto.build().then(() => done()).catch(e=>console.error(e));
    });
});