import { EventEmitter } from 'events';
import { Request } from '../src/Request';

const intentRequest = require('./fixtures/intent-request');
const endRequest = require('./fixtures/session-ended-request');
const intentResponse = require('./fixtures/intent-response');


describe('Request', function() {

    let req = null;

    beforeEach(function() {
        req = new Request(intentRequest);
    });

    describe('object', function() {

        it('should be an EventEmitter', function() {
            expect(req).to.be.instanceOf(EventEmitter);
        });

        it('should have a "sent" field', function() {
            expect(req.sent).to.equal(false);
        });

        it('should have a "isNew" field', function() {
            expect(req.isNew).to.equal(intentRequest.session.new);
        });

        it('should have a "isEnding" field', function() {
            expect(req.isEnding).to.equal(false);
            req = new Request(endRequest);
            expect(req.isEnding).to.equal(true);
        });

        it('should have a "reason" field', function() {
            expect(req.reason).to.equal(null);
            req = new Request(endRequest);
            expect(req.reason).to.equal(endRequest.request.reason);
        });

        it('should have a "version" field', function() {
            expect(req.version).to.equal(intentRequest.version);
        });

        it('should have a "session" field', function() {
            expect(req.session).to.deep.equal(intentRequest.session.attributes);
        });

        it('should have a "user" field', function() {
            expect(req.user).to.deep.equal(intentRequest.session.user);
        });

        it('should have a "params" field', function() {
            expect(req.params).to.deep.equal({
                ZodiacSign: 'virgo'
            });
        });

        it('should have a alias the "params" field to "slots"', function() {
            expect(req.params).to.equal(req.slots);
        });

        it('should alias "send" to "ask"', function() {
            expect(req.send).to.equal(req.ask);
        });

        it('should alias "end" to "tell"', function() {
            expect(req.end).to.equal(req.tell);
        });

        it('should have a "handler" property', function() {
            expect(req.handler).to.equal("GetZodiacHoroscopeIntent");
        });
    });

    describe('"say" function', function() {

        it('should chain', function() {
            expect(req.say("foo")).to.equal(req);
        });

        it('should accept text', function() {
            req.say("foo");
            expect(req.toJSON().response.outputSpeech).to.deep.equal({
                type: "PlainText",
                text: "foo"
            });
        });

        it('should accept an optional type argument', function() {
            req.say('ssml', '<speak></speak>');
            expect(req.toJSON().response.outputSpeech).to.deep.equal({
                type: "SSML",
                ssml: "<speak></speak>"
            });

            req.say('text', 'foobar');
            expect(req.toJSON().response.outputSpeech).to.deep.equal({
                type: "PlainText",
                text: "foobar"
            });
        });
    });

    describe('"show" function', function() {

        it('should chain', function() {
            expect(req.show("foo")).to.equal(req);
        });

        it('can create a simple card', function() {
            req.show('foo', 'bar');
            expect(req.toJSON().response.card).to.deep.equal({
                type: "Simple",
                title: 'foo',
                content: 'bar'
            });
        });

        it('can create a simple card', function() {
            req.show({ title: 'test' });
            expect(req.toJSON().response.card).to.deep.equal({
                type: "Standard",
                title: 'test',
            });
        });
    });

    describe('"linkAccount" function', function() {
        it('should chain', function() {
            expect(req.linkAccount()).to.equal(req);
        });

        it('should set the card type to "LinkAccount"', function() {
            req.linkAccount();
            expect(req.toJSON().response.card).to.deep.equal({
                type: "LinkAccount"
            });
        });
    });

    describe('"reprompt" function', function() {

        it('should chain', function() {
            expect(req.reprompt("foo")).to.equal(req);
        });

        it('should accept text', function() {
            req.reprompt("foo");
            expect(req.toJSON().response.reprompt.outputSpeech).to.deep.equal({
                type: "PlainText",
                text: "foo"
            });
        });

        it('should accept an optional type argument', function() {
            req.reprompt('ssml', '<speak></speak>');
            expect(req.toJSON().response.reprompt.outputSpeech).to.deep.equal({
                type: "SSML",
                ssml: "<speak></speak>"
            });

            req.reprompt('text', 'foobar');
            expect(req.toJSON().response.reprompt.outputSpeech).to.deep.equal({
                type: "PlainText",
                text: "foobar"
            });
        });
    });

    describe('"end" function', function() {
        it('should not chain', function() {
            expect(req.end("foo")).to.be.undefined;
        });

        it('should end the session', function() {
            req.end();
            expect(req.toJSON().response.shouldEndSession).to.equal(true);
        });

        it('should emit the "finished" event', function() {
            const spy = sinon.spy();
            req.on('finished', spy);
            expect(spy).to.not.have.been.called;
            req.end();
            expect(spy).to.have.been.called;
        });

        it('should set the sent property to true', function() {
            expect(req.sent).to.equal(false);
            req.end();
            expect(req.sent).to.equal(true);
        });
    });

    describe('"send" function', function() {
        it('should not chain', function() {
            expect(req.end("foo")).to.be.undefined;
        });

        it('should emit the "finished" event', function() {
            const spy = sinon.spy();
            req.on('finished', spy);
            expect(spy).to.not.have.been.called;
            req.end();
            expect(spy).to.have.been.called;
        });

        it('should set the sent property to true', function() {
            expect(req.sent).to.equal(false);
            req.end();
            expect(req.sent).to.equal(true);
        });
    });

    describe('"fail" function', function() {
        it('should not chain', function() {
            expect(req.fail(new Error())).to.be.undefined;
        });

        it('should emit the "failed" event with error and request', function() {
            const spy = sinon.spy();
            const err = new Error();

            req.on('failed', spy);
            expect(spy).to.not.have.been.called;
            req.fail(err);
            expect(spy).to.have.been.calledWith(err, req);
        });

        it('should set the sent property to true', function() {
            expect(req.sent).to.equal(false);
            req.fail(new Error());
            expect(req.sent).to.equal(true);
        });
    });

    describe('"toJSON" function', function() {

        it('should work', function() {
            req.say("foo").show("foo", "bar").reprompt('ssml', '<speak>foo</speak>').end();
            expect(req.toJSON()).to.deep.equal(intentResponse);
        });
    });
});
