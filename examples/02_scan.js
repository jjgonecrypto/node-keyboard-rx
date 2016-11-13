const repl = require('repl').repl

const { midiIn, log, play, Rx } = repl.context

module.exports = () => {
    Rx.Observable.stream(midiIn)
        .do(() => console.log('Note with previous'))
        .scan((acc,cur) => Object.assign(cur, { last: { input: acc.input } } ))
        .flatMap(note => [note, note.last || note])
        .do(log)
        .subscribe(play)
}
