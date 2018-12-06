// @flow
import {
  createRobotState,
  commandCreatorNoErrors,
  commandCreatorHasErrors,
} from './fixtures'
import _dispense from '../commandCreators/atomic/dispense'

import updateLiquidState from '../dispenseUpdateLiquidState'

jest.mock('../dispenseUpdateLiquidState')

const dispense = commandCreatorNoErrors(_dispense)
const dispenseWithErrors = commandCreatorHasErrors(_dispense)

describe('dispense', () => {
  let initialRobotState
  let robotStateWithTip
  beforeEach(() => {
    initialRobotState = createRobotState({
      sourcePlateType: 'trough-12row',
      destPlateType: '96-flat',
      fillTiprackTips: true,
      fillPipetteTips: false,
      tipracks: [300, 300],
    })

    robotStateWithTip = {
      ...initialRobotState,
      tipState: {
        ...initialRobotState.tipState,
        pipettes: {
          ...initialRobotState.tipState.pipettes,
          p300SingleId: true,
        },
      },
    }

    // $FlowFixMe: mock methods
    updateLiquidState.mockClear()
    // $FlowFixMe: mock methods
    updateLiquidState.mockReturnValue(initialRobotState.liquidState)
  })

  describe('tip tracking & commands:', () => {
    describe('dispense normally (with tip)', () => {
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
          const result = dispense({
            pipette: 'p300SingleId',
            volume: 50,
            labware: 'sourcePlateId',
            well: 'A1',
            ...testCase.args,
          })(robotStateWithTip)

          expect(result.commands).toEqual([{
            command: 'dispense',
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

    test('dispense normally (with tip) and optional args', () => {
      const args = {
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'sourcePlateId',
        well: 'A1',
        offsetFromBottomMm: 5,
        'flow-rate': 6,
      }

      const result = dispense(args)(robotStateWithTip)

      expect(result.commands).toEqual([{
        command: 'dispense',
        params: args,
      }])
    })

    test('dispensing without tip should throw error', () => {
      const result = dispenseWithErrors({
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

    test('dispense to nonexistent labware should throw error', () => {
      const result = dispenseWithErrors({
        pipette: 'p300SingleId',
        volume: 50,
        labware: 'someBadLabwareId',
        well: 'A1',
      })(robotStateWithTip)

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toMatchObject({
        type: 'LABWARE_DOES_NOT_EXIST',
      })
    })

    // TODO Ian 2018-02-12... what is excessive volume?
    // Is it OK to dispense vol > pipette max vol?
    // LATER: shouldn't dispense > volume of liquid in pipette
    test.skip('dispense with excessive volume should... ?')
  })

  describe('liquid tracking', () => {
    const mockLiquidReturnValue = 'expected liquid state'
    beforeEach(() => {
      // $FlowFixMe
      updateLiquidState.mockReturnValue(mockLiquidReturnValue)
    })

    test('dispense calls dispenseUpdateLiquidState with correct args and puts result into robotState.liquidState', () => {
      const result = dispense({
        pipette: 'p300SingleId',
        labware: 'sourcePlateId',
        well: 'A1',
        volume: 152,
      })(robotStateWithTip)

      expect(updateLiquidState).toHaveBeenCalledWith(
        {
          pipetteId: 'p300SingleId',
          labwareId: 'sourcePlateId',
          volume: 152,
          well: 'A1',
          labwareType: 'trough-12row',
          pipetteData: robotStateWithTip.instruments.p300SingleId,
        },
        robotStateWithTip.liquidState
      )

      expect(result.robotState.liquidState).toBe(mockLiquidReturnValue)
    })
  })
})
