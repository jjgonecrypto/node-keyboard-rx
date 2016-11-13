const repl = require('repl').repl

const { sequence, play, Rx } = repl.context

module.exports = (key = 'C') => {
    const modeNames = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian']
    const progression = [2, 2, 1, 2, 2, 2, 1]

    const modes = Rx.Observable.of(progression)
        .combineLatest(Rx.Observable.range(0, progression.length))
        .map(([x,i]) => {
            const seq = x.slice(i).concat(progression.slice(0, i))
            return [seq, i]
        })

    const playModes = modes
        .flatMap(([seq, i]) => sequence(key, seq).map(n => { return { n, i } }))
        .concatMap(x => Rx.Observable.of(x).delay(250))
        .publish()

    playModes
        .distinct(o => o.i)
        .subscribe(({ i }) => process.stdout.write(`\n${key} ${modeNames[i]}:${i+1}`))

    playModes
        .subscribe(({ n }) => { process.stdout.write(`\t${n}`); play(n) })

    playModes.connect()
}
