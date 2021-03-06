import debug from 'debug';
import assert from 'assert';
import noop from 'lodash/noop';
import flattenDeep from 'lodash/flattenDeep';
import { Request } from './Request';
import { verifyApplication } from './middleware/verifyApplication';
import { handleEvent } from './middleware/handleEvent';
import { handleRequest } from './handleRequest';

const cLog = debug('alexa-ability:ability:constructor');
const uLog = debug('alexa-ability:ability:use');
const oLog = debug('alexa-ability:ability:on');

const warnAppId = () => console.warn( // eslint-disable-line no-console
    'No "applicationId" provided, request may come from unauthorized sources'
);

const warnSent = () => console.warn( // eslint-disable-line no-console
    'Request already sent. Don\'t call "next" function after sending response.'
);


export class Ability {

    constructor(options = {}) { // eslint-disable-line no-unused-vars
        this._stack = [];

        if (options.applicationId) {
            cLog('adding verifyApplication middleware');
            this.use(verifyApplication(options.applicationId));
        } else {
            warnAppId();
        }
    }

    use(...fns) {
        assert(fns.length, 'expected at least one middleware');
        fns.forEach(fn => {
            assert(typeof fn === 'function', 'Expected function, got %o', fn);
            uLog(`adding middleware function: ${fn.name || '<unnamed function>'}`);
        });

        this._stack.push(...fns);
        return this;
    }

    on(event, ..._handlers) {
        const handlers = flattenDeep(_handlers);

        assert(typeof event === 'string', 'Expected string for event type');
        assert(handlers.length, 'Expected at least one handler');
        handlers.forEach(handler => {
            assert(typeof handler === 'function', 'Expected handler function, got %o', handler);
        });

        const fns = handlers.map(fn => handleEvent(event, fn));
        oLog(`adding ${fns.length} handlers for ${event} event`);
        this._stack.push(...fns);
        return this;
    }

    handle(event, callback = noop) {
        // build request object and attach listeners
        const req = new Request(event);
        req.on('finished', () => setImmediate(callback, null, req));
        req.on('failed', err => setImmediate(callback, err, req));

        // if we ever reach this function then everything has failed
        function done(err) {
            // halt execution early if response has been sent
            if (req.sent) {
                warnSent();
                return;
            }

            // just fail
            if (err) {
                req.fail(err);
                return;
            }

            req.fail(new Error('Unhandled event.'));
        }

        handleRequest(req, this._stack, done);
        return req;
    }
}
