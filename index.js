/**
 * Copyright (C) 2016 pantojs.xyz
 * index.js
 *
 * changelog
 * 2016-08-18[12:10:29]:revised
 *
 * @author yanni4night@gmail.com
 * @version 0.1.0
 * @since 0.1.0
 */
'use strict';

const chalk = require('chalk');
const table = require('text-table');
const dateTime = require('date-time');
const prettyMs = require('pretty-ms');
const barChar = require('figures').square;

const write = process.stdout.write.bind(process.stdout);

function log(str) {
    write(str + '\n', 'utf8');
}

function formatTable(tableData, totalTime) {
    const longestTaskName = tableData.reduce(function (acc, row) {
        return Math.max(acc, row[0].length);
    }, 0);

    const maxColumns = process.stdout.columns || 80;
    let maxBarWidth;

    if (longestTaskName > maxColumns / 2) {
        maxBarWidth = (maxColumns - 20) / 2;
    } else {
        maxBarWidth = maxColumns - (longestTaskName + 20);
    }
    maxBarWidth = Math.max(0, maxBarWidth);

    function shorten(taskName) {
        const nameLength = taskName.length;

        if (nameLength <= maxBarWidth) {
            return taskName;
        }

        const partLength = Math.floor((maxBarWidth - 3) / 2);
        const start = taskName.substr(0, partLength + 1);
        const end = taskName.substr(nameLength - partLength);

        return start.trim() + '...' + end.trim();
    }

    function createBar(percentage) {
        const rounded = Math.round(percentage * 100);

        if (rounded === 0) {
            return '0%';
        }

        const barLength = Math.ceil(maxBarWidth * percentage) + 1;
        const bar = new Array(barLength).join(barChar);

        return bar + ' ' + rounded + '%';
    }

    const tableDataProcessed = tableData.map(function (row) {
        const avg = row[1] / totalTime;

        return [shorten(row[0]), chalk.blue(prettyMs(row[1])), chalk.blue(createBar(avg))];
    }).reduce(function (acc, row) {
        if (row) {
            acc.push(row);
            return acc;
        }

        return acc;
    }, []);

    tableDataProcessed.push([chalk.magenta('Total', prettyMs(totalTime))]);

    return table(tableDataProcessed, {
        align: ['l', 'r', 'l'],
        stringLength: function (str) {
            return chalk.stripColor(str).length;
        }
    });
}

module.exports = panto => {
    let startTime;
    let flows = {};

    panto.on('start', () => {
        startTime = Date.now();
        flows = {};
    }).on('complete', () => {
        const totalMs = Date.now() - startTime;

        const data = Object.keys(flows).map(key => {
            return [key, flows[key]];
        });

        const startTimePretty = dateTime(new Date(startTime), {
            local: true
        });

        log('\n\n' + chalk.underline('Execution Time') + chalk.gray(' (' + startTimePretty + ')'));
        log(formatTable(data, totalMs) + '\n');
    }).on('flowstart', ({
        tag
    }) => {
        flows[tag] = Date.now();
    }).on('flowend', ({
        tag
    }) => {
        flows[tag] = Date.now() - flows[tag];
    });
};