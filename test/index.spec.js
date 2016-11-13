const assert = require('assert')
const Readable = require('stream').Readable
const repl = require('repl')
const sinon = require('sinon')

const rxKeyboard = require('..')

describe('node-keyboard-rx', function() {
    // setup replServer
    let replServer

    beforeEach(() => {
        replServer = repl.start({ prompt: '' })
    })
    afterEach(() => {
        replServer.close()
        delete repl.repl
    })

    describe('when executed', () => {
        let Rx
        beforeEach(() => {
            rxKeyboard()
            Rx = replServer.context.Rx
        })

        it('then Rx is added to the Repl context', () => {
            assert.equal(typeof Rx, 'object')
        })

        it('and Rx.Observable.stream is a function', () => {
            assert.equal(typeof Rx.Observable.stream, 'function')
        })

        describe('stream function', () => {
            let readable, observable, onNext, onError, onComplete, subscription

            beforeEach(() => {
                readable = new Readable({
                    objectMode: true,
                    read() {}
                })

                observable = Rx.Observable.stream(readable)
                onNext = sinon.spy()
                onError = sinon.spy()
                onComplete = sinon.spy()
                subscription = observable.subscribe(onNext, onError, onComplete)
                sinon.spy(subscription, 'unsubscribe')
            })

            describe('when the underlying stream emits', () => {
                beforeEach(() => {
                    readable.push(123)
                })

                it('onNext fires with streaming data', () => {
                    assert.equal(onNext.firstCall.args[0], 123)
                })
            })

            describe('when the underlying stream errors', () => {
                beforeEach(() => {
                    readable.emit('error', 'oh noes!')
                })

                it('onError fires with error', () => {
                    assert.equal(onError.firstCall.args[0], 'oh noes!')
                })
            })

            describe('when the underlying stream ends', () => {
                beforeEach(() => {
                    readable.push(null)
                })

                it('onComplete fires', done => {
                    process.nextTick(() => {
                        assert.equal(onComplete.callCount, 1)
                        done()
                    })
                })
            })

            describe('when SIGINT is triggered in the repl', () => {
                beforeEach(() => {
                    sinon.stub(process.stdout, 'write') // hide REPL message
                    replServer.emit('SIGINT')
                    process.stdout.write.restore()
                })

                it('unsubscribe is triggered', () => {
                    assert(subscription.unsubscribe.callCount, 1)
                })

                describe('when the underlying stream emits', () => {
                    beforeEach(() => {
                        readable.push(123)
                    })

                    it('onNext does not fire', () => {
                        assert.equal(onNext.callCount, 0)
                    })
                })
            })
        })
    })
})
