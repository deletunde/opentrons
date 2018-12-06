// @flow
import * as React from 'react'

import {PDTitledList} from '../lists'
import SourceDestSubstep from './SourceDestSubstep'
import styles from './StepItem.css'
import AspirateDispenseHeader from './AspirateDispenseHeader'
import MixHeader from './MixHeader'
import PauseStepItems from './PauseStepItems'
import StepDescription from '../StepDescription'
import {stepIconsByType, type StepIdType} from '../../form-types'
import type {Labware} from '../../labware-ingred/types'
import type {
  SubstepIdentifier,
  StepItemData,
  SubstepItemData,
  WellIngredientNames,
} from '../../steplist/types'

type StepItemProps = {
  stepId: StepIdType,
  step: ?StepItemData,
  substeps: ?SubstepItemData,

  collapsed?: boolean,
  error?: ?boolean,
  selected?: boolean,
  hovered?: boolean,
  hoveredSubstep: ?SubstepIdentifier,
  ingredNames: WellIngredientNames,

  getLabware: (labwareId: ?string) => ?Labware,
  handleSubstepHover: SubstepIdentifier => mixed,
  onStepClick?: (event?: SyntheticEvent<>) => mixed,
  onStepContextMenu?: (event?: SyntheticEvent<>) => mixed,
  onStepItemCollapseToggle?: (event?: SyntheticEvent<>) => mixed,
  onStepHover?: (event?: SyntheticEvent<>) => mixed,
  onStepMouseLeave?: (event?: SyntheticEvent<>) => mixed,
}

function StepItem (props: StepItemProps) {
  const {
    step,

    collapsed,
    error,
    selected,
    hovered,

    onStepMouseLeave,
    onStepClick,
    onStepContextMenu,
    onStepItemCollapseToggle,
    onStepHover,
  } = props

  const iconName = step && stepIconsByType[step.stepType]
  const title = step && step.title
  const Description = <StepDescription description={step && step.description} />

  return (
    <PDTitledList
      description={Description}
      iconName={error ? 'alert-circle' : iconName}
      iconProps={{className: error ? styles.error_icon : ''}}
      title={title || ''}
      onClick={onStepClick}
      onContextMenu={onStepContextMenu}
      onMouseEnter={onStepHover}
      onMouseLeave={onStepMouseLeave}
      onCollapseToggle={onStepItemCollapseToggle}
      {...{selected, collapsed, hovered}}
    >
      {getStepItemContents(props)}
    </PDTitledList>
  )
}

function getStepItemContents (stepItemProps: StepItemProps) {
  const {
    step,
    substeps,
    getLabware,
    hoveredSubstep,
    handleSubstepHover,
    ingredNames,
  } = stepItemProps

  const formData = step && step.formData

  if (!step) {
    return null
  }

  if (substeps && substeps.stepType === 'pause') {
    return <PauseStepItems {...{substeps}} />
  }

  const result = []

  // headers

  if (
    formData && (
      formData.stepType === 'transfer' ||
      formData.stepType === 'consolidate' ||
      formData.stepType === 'distribute'
    )
  ) {
    const sourceLabware = getLabware(formData['aspirate_labware'])
    const destLabware = getLabware(formData['dispense_labware'])

    result.push(
      <AspirateDispenseHeader
        key='transferlike-header'
        {...{sourceLabware, destLabware}}
      />
    )
  }

  if (formData && formData.stepType === 'mix') {
    result.push(
      <MixHeader key='mix-header'
        volume={formData.volume}
        times={formData.times}
        labware={getLabware(formData.labware)}
      />
    )
  }

  // non-header substeps

  if (
    substeps && (
      substeps.stepType === 'transfer' ||
      substeps.stepType === 'consolidate' ||
      substeps.stepType === 'distribute' ||
      substeps.stepType === 'mix'
    )
  ) {
    result.push(
      <SourceDestSubstep
        key='substeps'
        ingredNames={ingredNames}
        substeps={substeps}
        hoveredSubstep={hoveredSubstep}
        onSelectSubstep={handleSubstepHover}
      />
    )
  }

  return result
}

export default StepItem
