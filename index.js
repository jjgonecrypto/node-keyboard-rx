'use strict'

const Writable = require('stream').Writable
const examples = require('node-examples')

const path = require('path')
const repl = require('repl')
const Rx = require('rxjs/Rx')

module.exports = () => {
    const currentRepl = repl.repl

    let _subscriptions = []

    const subscribe = Rx.Observable.prototype.subscribe
    Rx.Observable.prototype.subscribe = function(...args) {
        let subscriber
        subscriber = subscribe.apply(this, args)
        _subscriptions.push(subscriber)
        return subscriber
    }

    const cleanup = () => {
        _subscriptions.forEach(s => s.unsubscribe())
        _subscriptions = []
    }

    // polyfill fromStream for rxjs 5 and node streams 3. Appropriated from:
    // https://github.com/Reactive-Extensions/rx-node/blob/master/index.js#L58
    Rx.Observable.stream = stream => {

        return Rx.Observable.create(observer => {

            const errorHandler = err => {
                observer.error(err)
            }

            const endHandler = () => {
                observer.complete()
            }

            const writable = new Writable({
                objectMode: true,
                write(chunk, enc, next) {
                    observer.next(chunk)
                    next()
                }
            })
            stream.addListener('error', errorHandler)
            stream.addListener('end', endHandler)

            stream.pipe(writable)

            return () => {
                stream.unpipe(writable)
                stream.removeListener('error', errorHandler)
                stream.removeListener('end', endHandler)
            }

        })
    }

    // On .break (CTRL+C), end all subscriptions
    currentRepl.on('SIGINT', cleanup)

    currentRepl.context.Rx = Rx

    examples({ path: path.join(__dirname, 'examples'), prefix: 'rx_example_' })

    return Rx
}
