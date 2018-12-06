// @flow
import {expectTimelineError} from './testMatchers'
import _aspirate from '../commandCreators/atomic/aspirate'
import {
  createRobotState,
  commandCreatorHasErrors,
  commandCreatorNoErrors,
} from './fixtures'
import getNextRobotStateAndWarnings from '../getNextRobotStateAndWarnings'

jest.mock('../getNextRobotStateAndWarnings')

const aspirate = commandCreatorNoErrors(_aspirate)
const aspirateWithErrors = commandCreatorHasErrors(_aspirate)

const mockRobotStateAndWarningsReturnValue = {
  // using strings instead of properly-shaped objects for easier assertions
  robotState: 'expected robot state',
  warnings: 'expected warnings',
}

beforeEach(() => {
  // $FlowFixMe
  getNextRobotStateAndWarnings.mockReturnValue(mockRobotStateAndWarningsReturnValue)
})

describe('aspirate', () => {
  let initialRobotState
  let robotStateWithTip

  beforeEach(() => {
    initialRobotState = createRobotState({
      sourcePlateType: 'trough-12row',
      destPlateType: '96-flat',
      fillPipetteTips: false,
      fillTiprackTips: true,
      tipracks: [300, 300],
    })
    robotStateWithTip = createRobotState({
      sourcePlateType: 'trough-12row',
      destPlateType: '96-flat',
      fillPipetteTips: true,
      fillTiprackTips: true,
      tipracks: [300, 300],
    })
  })

  describe('aspirate normally (with tip)', () => {
    const optionalArgsCases = [
      {
        description: 'no optional args',
        expectInParams: false,
        args: {},
      },
      {
        description: 'null optional args',
        expectInParams: false,
        args: {
          offsetFromBottomMm: null,
          'flow-rate': null,
        },
      },
      {
        description: 'all optional args',
        expectInParams: true,
        args: {
          offsetFromBottomMm: 5,
          'flow-rate': 6,
        },
      },
    ]

    optionalArgsCases.forEach(testCase => {
      test(testCase.description, () => {
        const result = aspirate({
          pipette: 'p300SingleId',
          volume: 50,
          labware: 'sourcePlateId',
          well: 'A1',
          ...testCase.args,
        })(robotStateWithTip)

        expect(result.commands).toEqual([{
          command: 'aspirate',
          params: {
            pipette: 'p300SingleId',
            volume: 50,
            labware: 'sourcePlateId',
            well: 'A1',
            ...(testCase.expectInParams ? testCase.args : {}),
          },
        }])
      })
    })
  })

  test('aspirate with volume > tip max volume should throw error', () => {
    robotStateWithTip.instruments['p300SingleId'].tiprackModel = 'tiprack-200ul'
    const result = aspirateWithErrors({
      pipette: 'p300SingleId',
      volume: 201,
      labware: 'sourcePlateId',
      well: 'A1',
    })(robotStateWithTip)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'TIP_VOLUME_EXCEEDED',
    })
  })

  test('aspirate with volume > pipette max volume should throw error', () => {
    // NOTE: assigning p300 to a 1000uL tiprack is nonsense, just for this test
    robotStateWithTip.instruments['p300SingleId'].tiprackModel = 'tiprack-1000ul'
    const result = aspirateWithErrors({
      pipette: 'p300SingleId',
      volume: 301,
      labware: 'sourcePlateId',
      well: 'A1',
    })(robotStateWithTip)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'PIPETTE_VOLUME_EXCEEDED',
    })
  })

  test('aspirate with invalid pipette ID should return error', () => {
    const result = aspirateWithErrors({
      pipette: 'badPipette',
      volume: 50,
      labware: 'sourcePlateId',
      well: 'A1',
    })(robotStateWithTip)

    expectTimelineError(result.errors, 'PIPETTE_DOES_NOT_EXIST')
  })

  test('aspirate with no tip should return error', () => {
    const result = aspirateWithErrors({
      pipette: 'p300SingleId',
      volume: 50,
      labware: 'sourcePlateId',
      well: 'A1',
    })(initialRobotState)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'NO_TIP_ON_PIPETTE',
    })
  })

  test('aspirate from nonexistent labware should return error', () => {
    const result = aspirateWithErrors({
      pipette: 'p300SingleId',
      volume: 50,
      labware: 'problematicLabwareId',
      well: 'A1',
    })(robotStateWithTip)

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      type: 'LABWARE_DOES_NOT_EXIST',
    })
  })

  describe('liquid tracking', () => {
    test('aspirate calls getNextRobotStateAndWarnings with correct args and puts result into robotState', () => {
      const args = {
        pipette: 'p300SingleId',
        labware: 'sourcePlateId',
        well: 'A1',
        volume: 152,
      }
      const result = aspirate(args)(robotStateWithTip)

      expect(getNextRobotStateAndWarnings).toHaveBeenCalledWith(result.commands[0], robotStateWithTip)
      expect(result.robotState).toBe(mockRobotStateAndWarningsReturnValue.robotState)
      expect(result.warnings).toBe(mockRobotStateAndWarningsReturnValue.warnings)
    })
  })
})
