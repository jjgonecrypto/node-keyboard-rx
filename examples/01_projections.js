const repl = require('repl').repl

const { midiIn, log, play, Rx } = repl.context

module.exports = () => {
    Rx.Observable.stream(midiIn)
        .do(() => console.log('-- Chord --'))
        .flatMap(note => [note, 'c3', 'g4', 'c5'])
        .do(log)
        .subscribe(play)
}
