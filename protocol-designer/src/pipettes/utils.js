// @flow
import {getPipetteNameSpecs, getLabware} from '@opentrons/shared-data'

import type {Mount} from '@opentrons/components'
import type {PipetteData} from '../step-generation'

export function createPipette (
  mount: Mount,
  _model: string,
  tiprackModel: ?string,
  overrideId?: string
): ?PipetteData {
  // for backwards compatibility, strip version suffix (_v1, _v1.3 etc)
  // from model string, if it exists
  const model = _model.replace(/_v\d(\.|\d+)*$/, '')
  // TODO: Ian 2018-11-01 once the schema is updated to always exclude versions
  // (breaking change to schema), this version removal would be handled in schema migration.

  const id = overrideId || `pipette:${mount}:${model}`
  const pipetteData = getPipetteNameSpecs(model)

  if (!pipetteData) {
    console.error(`Pipette ${id} - model '${model}' does not exist in shared-data`)
    return null
  }
  if (!tiprackModel) {
    console.error(`Pipette ${id} - no tiprackModel assigned. Skipping pipette creation.`)
    return null
  }
  if (!getLabware(tiprackModel)) {
    console.error(`Pipette ${id} - tiprackModel '${tiprackModel}' does not exist in shared-data`)
    return null
  }
  return {
    id,
    model,
    mount,
    maxVolume: pipetteData.maxVolume,
    channels: pipetteData.channels,
    tiprackModel,
  }
}
