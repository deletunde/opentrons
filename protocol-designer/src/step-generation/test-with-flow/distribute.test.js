// @flow
import _distribute from '../commandCreators/compound/distribute'
// import merge from 'lodash/merge'
import {
  createRobotState,
  compoundCommandCreatorNoErrors,
  compoundCommandCreatorHasErrors,
  commandFixtures as cmd,
} from './fixtures'
import type {DistributeFormData} from '../types'
const distribute = compoundCommandCreatorNoErrors(_distribute)
const distributeWithErrors = compoundCommandCreatorHasErrors(_distribute)

// shorthand
const dispense = (well, volume) =>
  cmd.dispense(well, volume, {labware: 'destPlateId'})

let mixinArgs
let robotInitialState
let robotInitialStatePipettesLackTips
let blowoutSingleToTrash
let blowoutSingleToSourceA1

beforeEach(() => {
  mixinArgs = {
    stepType: 'distribute',
    name: 'distribute test',
    description: 'test blah blah',

    pipette: 'p300SingleId',
    sourceLabware: 'sourcePlateId',
    destLabware: 'destPlateId',

    preWetTip: false,
    touchTipAfterAspirate: false,
    disposalVolume: 60,
    disposalLabware: 'trashId',
    disposalWell: 'A1',
    mixBeforeAspirate: null,

    touchTipAfterDispense: false,
  }

  robotInitialState = createRobotState({
    sourcePlateType: '96-flat',
    destPlateType: '96-flat',
    tipracks: [300],
    fillPipetteTips: true,
    fillTiprackTips: true,
  })

  robotInitialStatePipettesLackTips = createRobotState({
    sourcePlateType: '96-flat',
    destPlateType: '96-flat',
    tipracks: [300],
    fillPipetteTips: true,
    fillTiprackTips: false,
  })

  blowoutSingleToTrash = cmd.blowout('trashId')
  blowoutSingleToSourceA1 = cmd.blowout('sourcePlateId', {well: 'A1'})
})

describe('distribute: minimal example', () => {
  test('single channel; 60uL from A1 -> A2, A3; no tip pickup', () => {
    // TODO Ian 2018-05-03 distributeArgs needs to be typed because the
    // commandCreatorNoErrors wrapper casts the arg type to any :(
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3'],
      changeTip: 'never',
      volume: 60,
    }
    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      cmd.aspirate('A1', 180),
      dispense('A2', 60),
      dispense('A3', 60),
      blowoutSingleToTrash,
    ])
  })
})

describe('tip handling for multiple distribute chunks', () => {
  test('changeTip: "once"', () => {
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'once',
      volume: 90,
    }

    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      cmd.dropTip('A1'),
      cmd.pickUpTip('A1'),
      cmd.aspirate('A1', 240),
      dispense('A2', 90),
      dispense('A3', 90),
      blowoutSingleToTrash,

      cmd.aspirate('A1', 240),
      dispense('A4', 90),
      dispense('A5', 90),

      blowoutSingleToTrash,
    ])
  })

  test('changeTip: "always"', () => {
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'always',
      volume: 90,
    }

    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      cmd.dropTip('A1'),
      cmd.pickUpTip('A1'),
      cmd.aspirate('A1', 240),
      dispense('A2', 90),
      dispense('A3', 90),
      blowoutSingleToTrash,

      // next chunk, change tip
      cmd.dropTip('A1'),
      cmd.pickUpTip('B1'),
      cmd.aspirate('A1', 240),
      dispense('A4', 90),
      dispense('A5', 90),
      blowoutSingleToTrash,
    ])
  })

  test('changeTip: "never" with carried-over tip', () => {
    // NOTE: this has been used as BASE CASE for the "advanced settings" tests
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume: 90,
    }
    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      cmd.aspirate('A1', 240),
      dispense('A2', 90),
      dispense('A3', 90),
      blowoutSingleToTrash,
      cmd.aspirate('A1', 240),
      dispense('A4', 90),
      dispense('A5', 90),
      blowoutSingleToTrash,
    ])
  })

  test('changeTip: "never" should fail with no initial tip', () => {
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'always',
      volume: 150,
    }

    const result = distributeWithErrors(distributeArgs)(robotInitialStatePipettesLackTips)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'INSUFFICIENT_TIPS',
    })
  })
})

describe('advanced settings: volume, mix, pre-wet tip, tip touch', () => {
  test('mix before aspirate, then aspirate disposal volume', () => {
    // NOTE this also tests "uneven final chunk" eg A6 in [A2 A3 | A4 A5 | A6]
    // which is especially relevant to disposal volume
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5', 'A6'],
      changeTip: 'never',
      volume: 120,

      mixFirstAspirate: true,
      disposalVolume: 12,
      disposalLabware: 'sourcePlateId',
      disposalWell: 'A1',
    }
    const result = distribute(distributeArgs)(robotInitialState)
    const aspirateVol = (120 * 2) + 12

    expect(result.commands).toEqual([
      cmd.aspirate('A1', aspirateVol),
      dispense('A2', 120),
      dispense('A3', 120),
      blowoutSingleToSourceA1,

      cmd.aspirate('A1', aspirateVol),
      dispense('A4', 120),
      dispense('A5', 120),
      blowoutSingleToSourceA1,

      cmd.aspirate('A1', 120 + 12),
      dispense('A6', 120),
      blowoutSingleToSourceA1,
    ])
  })

  test.skip('pre-wet tip', () => {
    // TODO Ian 2018-05-04 pre-wet volume is TBD.
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume: 150,
      preWetTip: true,
    }
    const result = distribute(distributeArgs)(robotInitialState)

    const preWetVolume = 42 // TODO what is pre-wet volume?
    const preWetTipCommands = [
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: preWetVolume,
        well: 'A1',
      },
      {
        command: 'dispense',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: preWetVolume,
        well: 'A1',
      },
    ]

    expect(result.commands).toEqual([
      ...preWetTipCommands,
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 300,
        well: 'A1',
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 150,
        well: 'A2',
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 150,
        well: 'A3',
      },
      blowoutSingleToTrash,
      ...preWetTipCommands,
      {
        command: 'aspirate',
        labware: 'sourcePlateId',
        pipette: 'p300SingleId',
        volume: 300,
        well: 'A1',
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 150,
        well: 'A4',
      },
      {
        command: 'dispense',
        labware: 'destPlateId',
        pipette: 'p300SingleId',
        volume: 150,
        well: 'A5',
      },
      blowoutSingleToTrash,
    ])
  })

  test('touch tip after aspirate', () => {
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume: 90,
      touchTipAfterAspirate: true,
    }
    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      cmd.aspirate('A1', 240),
      cmd.touchTip('A1'),
      dispense('A2', 90),
      dispense('A3', 90),
      blowoutSingleToTrash,

      cmd.aspirate('A1', 240),
      cmd.touchTip('A1'),
      dispense('A4', 90),
      dispense('A5', 90),
      blowoutSingleToTrash,
    ])
  })

  test('touch tip after dispense', () => {
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume: 90,
      touchTipAfterDispense: true,
    }
    const result = distribute(distributeArgs)(robotInitialState)

    function touchTip (well: string) {
      return cmd.touchTip(well, {labware: 'destPlateId'})
    }

    expect(result.commands).toEqual([
      cmd.aspirate('A1', 240),
      dispense('A2', 90),
      touchTip('A2'),
      dispense('A3', 90),
      touchTip('A3'),
      blowoutSingleToTrash,

      cmd.aspirate('A1', 240),
      dispense('A4', 90),
      touchTip('A4'),
      dispense('A5', 90),
      touchTip('A5'),
      blowoutSingleToTrash,
    ])
  })

  test('mix before aspirate w/ disposal vol', () => {
    const volume = 130
    const disposalVolume = 20
    const disposalLabware = 'sourcePlateId'
    const disposalWell = 'A1'
    const aspirateVol = (volume * 2) + disposalVolume
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3', 'A4', 'A5'],
      changeTip: 'never',
      volume,
      mixBeforeAspirate: {
        volume: 250,
        times: 2,
      },
      disposalVolume,
      disposalLabware,
      disposalWell,
    }

    const result = distribute(distributeArgs)(robotInitialState)

    const mixCommands = [
      // mix 1
      cmd.aspirate('A1', 250),
      cmd.dispense('A1', 250), // dispense to sourcePlateId
      // mix 2
      cmd.aspirate('A1', 250),
      cmd.dispense('A1', 250), // dispense to sourcePlateId
    ]

    expect(result.commands).toEqual([
      ...mixCommands,
      cmd.aspirate('A1', aspirateVol),
      dispense('A2', volume),
      dispense('A3', volume),
      blowoutSingleToSourceA1,

      ...mixCommands,
      cmd.aspirate('A1', aspirateVol),
      dispense('A4', volume),
      dispense('A5', volume),
      blowoutSingleToSourceA1,
    ])
  })
})

describe('invalid input + state errors', () => {
  test('invalid pipette ID should throw error', () => {
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3'],
      changeTip: 'never',
      volume: 100,
      pipette: 'no-such-pipette-id-here',
    }

    const result = distributeWithErrors(distributeArgs)(robotInitialState)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'PIPETTE_DOES_NOT_EXIST',
    })
  })
})

describe('distribute volume exceeds pipette max volume', () => {
  test(`change tip: always`, () => {
    const changeTip = 'always'
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3'],
      changeTip,
      volume: 350,
      disposalVolume: null, // TODO additional test with blowout
      disposalLabware: null,
      disposalWell: null,
    }
    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      cmd.dropTip('A1'),
      cmd.pickUpTip('A1'),

      cmd.aspirate('A1', 300),
      dispense('A2', 300),

      cmd.dropTip('A1'),
      cmd.pickUpTip('B1'),

      cmd.aspirate('A1', 50),
      dispense('A2', 50),

      // A2 done, move to A3
      cmd.dropTip('A1'),
      cmd.pickUpTip('C1'),

      cmd.aspirate('A1', 300),
      dispense('A3', 300),

      cmd.dropTip('A1'),
      cmd.pickUpTip('D1'),

      cmd.aspirate('A1', 50),
      dispense('A3', 50),
    ])
  })

  test(`change tip: once`, () => {
    const changeTip = 'once'
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3'],
      changeTip,
      volume: 350,
      disposalVolume: null, // TODO additional test with blowout
      disposalLabware: null,
      disposalWell: null,
    }
    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      cmd.dropTip('A1'),
      cmd.pickUpTip('A1'),

      cmd.aspirate('A1', 300),
      dispense('A2', 300),
      cmd.aspirate('A1', 50),
      dispense('A2', 50),

      // A2 done, move to A3
      cmd.aspirate('A1', 300),
      dispense('A3', 300),
      cmd.aspirate('A1', 50),
      dispense('A3', 50),
    ])
  })

  test(`change tip: never`, () => {
    const changeTip = 'never'
    const distributeArgs: DistributeFormData = {
      ...mixinArgs,
      sourceWell: 'A1',
      destWells: ['A2', 'A3'],
      changeTip,
      volume: 350,
      disposalVolume: null, // TODO additional test with blowout
      disposalLabware: null,
      disposalWell: null,
    }
    const result = distribute(distributeArgs)(robotInitialState)

    expect(result.commands).toEqual([
      cmd.aspirate('A1', 300),
      dispense('A2', 300),
      cmd.aspirate('A1', 50),
      dispense('A2', 50),

      // A2 done, move to A3
      cmd.aspirate('A1', 300),
      dispense('A3', 300),
      cmd.aspirate('A1', 50),
      dispense('A3', 50),
    ])
  })
})
