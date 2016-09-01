/**
 * Copyright (C) 2016 pantojs.xyz
 * index.js
 *
 * changelog
 * 2016-08-18[12:10:29]:revised
 * 2016-09-01[19:48:13]:support multipart
 *
 * @author yanni4night@gmail.com
 * @version 0.2.0
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
    const taskMap = new Map();

    panto.on('start', buildId => {
        const task = new Map();
        task.set('startTime', Date.now());
        taskMap.set(buildId, task);
    }).on('complete', (files, buildId) => {
        if (!taskMap.has(buildId)) {
            return;
        }

        const task = taskMap.get(buildId);
        const flows = task.get('flows');

        const totalMs = Date.now() - task.get('startTime');

        const data = flows.map(flow => {
            return [flow.get('name'), flow.get('endTime') - flow.get('startTime')];
        });

        const startTimePretty = dateTime(new Date(task.get('startTime')), {
            local: true
        });

        log('\n\n' + chalk.underline('Execution Time') + chalk.gray(' (' + startTimePretty + ')'));
        log(formatTable(data, totalMs) + '\n');
    }).on('flowstart', ({
        tag
    }, flowId, buildId) => {
        if (!taskMap.has(buildId)) {
            return;
        }

        const task = taskMap.get(buildId);

        if (!task.has('flows')) {
            task.set('flows', []);
        }
        const flows = task.get('flows');
        const flow = new Map();
        flow.set('startTime', Date.now());
        flow.set('flowId', flowId);
        flow.set('name', tag);
        flows.push(flow);
    }).on('flowend', ({
        tag
    }, flowId, buildId) => {
        if (!taskMap.has(buildId)) {
            return;
        }

        const task = taskMap.get(buildId);
        const flows = task.get('flows');

        for(let flow of flows){
            if(flow.get('flowId') === flowId){
                flow.set('endTime', new Date());
                break;
            }
        }
    });
};