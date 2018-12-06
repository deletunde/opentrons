// @flow
import * as React from 'react'
import {FormGroup, HoverTooltip, CheckboxField} from '@opentrons/components'

import i18n from '../../localization'
import {
  StepInputField,
  StepCheckboxRow,
  PipetteField,
  BlowoutLocationDropdown,
  LabwareDropdown,
  ChangeTipField,
} from './formFields'

import StepField from './StepFormField'
import TipPositionInput from './TipPositionInput'
import getTooltipForField from './getTooltipForField'
import FlowRateField from './FlowRateField'
import WellSelectionInput from './WellSelectionInput'
import WellOrderInput from './WellOrderInput'
import type {StepType} from '../../form-types'
import formStyles from '../forms.css'
import styles from './StepEditForm.css'
import FormSection from './FormSection'
import type {FocusHandlers} from './index'

type TransferLikeFormProps = {focusHandlers: FocusHandlers, stepType: StepType}

const TransferLikeForm = (props: TransferLikeFormProps) => {
  const {focusHandlers, stepType} = props
  return (
    <React.Fragment>
      <FormSection sectionName="aspirate">
        <div className={formStyles.row_wrapper}>
          <FormGroup label="Labware:" className={styles.labware_field}>
            <LabwareDropdown name="aspirate_labware" {...focusHandlers} />
          </FormGroup>
          <WellSelectionInput
            name="aspirate_wells"
            labwareFieldName="aspirate_labware"
            pipetteFieldName="pipette"
            {...focusHandlers} />
          <PipetteField name="pipette" stepType={stepType} {...focusHandlers} />
          {stepType === 'consolidate' &&
            <FormGroup label='Volume:' className={styles.volume_field}>
              <StepInputField name="volume" units='μL' {...focusHandlers} />
            </FormGroup>
          }
        </div>

        <div className={formStyles.row_wrapper}>
          <div className={styles.left_settings_column}>
            <FormGroup label='TECHNIQUE'>
              <StepCheckboxRow name="aspirate_preWetTip" label="Pre-wet tip" />
              <StepCheckboxRow name="aspirate_touchTip" label="Touch tip">
                <TipPositionInput fieldName="aspirate_touchTipMmFromBottom" />
              </StepCheckboxRow>

              <StepCheckboxRow disabled tooltipComponent={i18n.t('tooltip.not_in_beta')} name="aspirate_airGap_checkbox" label="Air Gap">
                <StepInputField disabled name="aspirate_airGap_volume" units="μL" {...focusHandlers} />
              </StepCheckboxRow>

              <StepCheckboxRow name="aspirate_mix_checkbox" label='Mix'>
                <StepInputField name="aspirate_mix_volume" units='μL' {...focusHandlers} />
                <StepInputField name="aspirate_mix_times" units='Times' {...focusHandlers} />
              </StepCheckboxRow>
              {stepType === 'distribute' &&
                <StepField
                  name="aspirate_disposalVol_checkbox"
                  render={({value, updateValue}) => (
                    <React.Fragment>
                      <div className={styles.field_row}>
                        <CheckboxField
                          label="Disposal Volume"
                          value={!!value}
                          onChange={(e: SyntheticInputEvent<*>) => updateValue(!value)} />
                        {value
                          ? <div>
                            <StepInputField name="aspirate_disposalVol_volume" units="μL" {...focusHandlers} />
                          </div>
                          : null}
                      </div>
                      {value
                        ? <div className={styles.field_row}>
                          <div className={styles.sub_select_label}>Blowout</div>
                          <BlowoutLocationDropdown
                            name="dispense_blowout_location"
                            className={styles.full_width}
                            includeSourceWell
                            {...focusHandlers} />
                        </div>
                        : null
                      }
                    </React.Fragment>
                  )} />
              }
            </FormGroup>
          </div>
          <div className={styles.middle_settings_column}>
            <ChangeTipField stepType={stepType} name="aspirate_changeTip" />
            <TipPositionInput fieldName="aspirate_mmFromBottom" />
          </div>
          <div className={styles.right_settings_column}>
            {stepType !== 'distribute' && <WellOrderInput prefix="aspirate" />}
            <FlowRateField
              name='aspirate_flowRate'
              pipetteFieldName='pipette'
              flowRateType='aspirate' />
          </div>
        </div>
      </FormSection>

      <FormSection sectionName='dispense'>
        <div className={formStyles.row_wrapper}>
          <FormGroup label='Labware:' className={styles.labware_field}>
            <LabwareDropdown name="dispense_labware" {...focusHandlers} />
          </FormGroup>
          <WellSelectionInput
            name="dispense_wells"
            labwareFieldName="dispense_labware"
            pipetteFieldName="pipette"
            {...focusHandlers} />
          {(stepType === 'transfer' || stepType === 'distribute') && (
            // TODO: Ian 2018-08-30 make volume field not be a one-off
            <HoverTooltip
              tooltipComponent={getTooltipForField(stepType, 'volume')}
              placement='top-start'>
              {(hoverTooltipHandlers) =>
                <FormGroup
                  label='Volume:'
                  className={styles.volume_field}
                  hoverTooltipHandlers={hoverTooltipHandlers}>
                  <StepInputField name="volume" units="μL" {...focusHandlers} />
                </FormGroup>
              }
            </HoverTooltip>
          )}
        </div>

        <div className={formStyles.row_wrapper}>
          <div className={styles.left_settings_column}>
            <FormGroup label='TECHNIQUE'>
              <StepCheckboxRow name="dispense_touchTip" label="Touch tip">
                <TipPositionInput fieldName="dispense_touchTipMmFromBottom" />
              </StepCheckboxRow>
              <StepCheckboxRow name="dispense_mix_checkbox" label='Mix'>
                <StepInputField name="dispense_mix_volume" units="μL" {...focusHandlers} />
                <StepInputField name="dispense_mix_times" units="Times" {...focusHandlers} />
              </StepCheckboxRow>
              {stepType !== 'distribute' &&
                <StepCheckboxRow name='dispense_blowout_checkbox' label='Blow out'>
                  <BlowoutLocationDropdown
                    name="dispense_blowout_location"
                    className={styles.full_width}
                    includeSourceWell={stepType === 'transfer'}
                    includeDestWell
                    {...focusHandlers} />
                </StepCheckboxRow>
              }
            </FormGroup>
          </div>
          <div className={styles.middle_settings_column}>
            <TipPositionInput fieldName="dispense_mmFromBottom" />
          </div>
          <div className={styles.right_settings_column}>
            {stepType !== 'consolidate' && <WellOrderInput prefix="dispense" />}
            <FlowRateField
              name='dispense_flowRate'
              pipetteFieldName='pipette'
              flowRateType='dispense'
            />
          </div>
        </div>
      </FormSection>
    </React.Fragment>
  )
}

export default TransferLikeForm
