// @flow
import flatMap from 'lodash/flatMap'
import {repeatArray, blowoutUtil} from '../../utils'
import * as errorCreators from '../../errorCreators'
import type {MixFormData, RobotState, CommandCreator, CompoundCommandCreator} from '../../types'
import {aspirate, dispense, replaceTip, touchTip} from '../atomic'

/** Helper fn to make mix command creators w/ minimal arguments */
export function mixUtil (args: {
  pipette: string,
  labware: string,
  well: string,
  volume: number,
  times: number,
  aspirateOffsetFromBottomMm?: ?number,
  dispenseOffsetFromBottomMm?: ?number,
  aspirateFlowRateUlSec?: ?number,
  dispenseFlowRateUlSec?: ?number,
}): Array<CommandCreator> {
  const {
    pipette,
    labware,
    well,
    volume,
    times,
    aspirateOffsetFromBottomMm,
    dispenseOffsetFromBottomMm,
    aspirateFlowRateUlSec,
    dispenseFlowRateUlSec,
  } = args
  return repeatArray([
    aspirate({pipette, volume, labware, well, offsetFromBottomMm: aspirateOffsetFromBottomMm, 'flow-rate': aspirateFlowRateUlSec}),
    dispense({pipette, volume, labware, well, offsetFromBottomMm: dispenseOffsetFromBottomMm, 'flow-rate': dispenseFlowRateUlSec}),
  ], times)
}

const mix = (data: MixFormData): CompoundCommandCreator => (prevRobotState: RobotState) => {
  /**
    Mix will aspirate and dispense a uniform volume some amount of times from a set of wells
    in a single labware.

    =====

    For mix, changeTip means:
    * 'always': before the first aspirate in each well, get a fresh tip
    * 'once': get a new tip at the beginning of the overall mix step, and use it throughout for all wells
    * 'never': reuse the tip from the last step
  */
  const actionName = 'mix'
  const {
    pipette,
    labware,
    wells,
    volume,
    times,
    changeTip,
    aspirateOffsetFromBottomMm,
    dispenseOffsetFromBottomMm,
    aspirateFlowRateUlSec,
    dispenseFlowRateUlSec,
  } = data

  // Errors
  if (!prevRobotState.instruments[pipette]) {
    // bail out before doing anything else
    return [(_robotState) => ({
      errors: [errorCreators.pipetteDoesNotExist({actionName, pipette})],
    })]
  }

  if (!prevRobotState.labware[labware]) {
    return [(_robotState) => ({
      errors: [errorCreators.labwareDoesNotExist({actionName, labware})],
    })]
  }

  // Command generation
  const commandCreators = flatMap(
    wells,
    (well: string, wellIndex: number): Array<CommandCreator> => {
      let tipCommands: Array<CommandCreator> = []

      if (
        changeTip === 'always' ||
        (changeTip === 'once' && wellIndex === 0)
      ) {
        tipCommands = [replaceTip(pipette)]
      }

      const touchTipCommands = data.touchTip
        ? [
          touchTip({
            pipette,
            labware,
            well,
            offsetFromBottomMm: data.touchTipMmFromBottom,
          }),
        ]
        : []

      const blowoutCommand = blowoutUtil(
        data.pipette,
        data.labware,
        well,
        data.labware,
        well,
        data.blowoutLocation,
      )

      const mixCommands = mixUtil({
        pipette,
        labware,
        well,
        volume,
        times,
        aspirateOffsetFromBottomMm,
        dispenseOffsetFromBottomMm,
        aspirateFlowRateUlSec,
        dispenseFlowRateUlSec,
      })

      return [
        ...tipCommands,
        ...mixCommands,
        ...blowoutCommand,
        ...touchTipCommands,
      ]
    }
  )

  return commandCreators
}

export default mix
