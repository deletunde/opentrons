// @flow
import * as React from 'react'
import cx from 'classnames'
import {connect} from 'react-redux'
import clamp from 'lodash/clamp'
import round from 'lodash/round'
import {
  Modal,
  OutlineButton,
  PrimaryButton,
  FormGroup,
  InputField,
  Icon,
  HandleKeypress,
} from '@opentrons/components'
import i18n from '../../../localization'
import {Portal} from '../../portals/MainPageModalPortal'
import modalStyles from '../../modals/modal.css'
import {actions} from '../../../steplist'
import TipPositionZAxisViz from './TipPositionZAxisViz'

import styles from './TipPositionInput.css'
import * as utils from './utils'
import {getIsTouchTipField, type TipOffsetFields} from '../../../form-types'

const SMALL_STEP_MM = 1
const LARGE_STEP_MM = 10
const DECIMALS_ALLOWED = 1

type DP = { updateValue: (?number) => mixed }

type OP = {
  mmFromBottom: number,
  wellHeightMM: number,
  isOpen: boolean,
  closeModal: () => mixed,
  defaultMm: number,
  fieldName: TipOffsetFields,
}

type Props = OP & DP
type State = { value: ?number }

const roundValue = (value: number | string): number => (
  round(Number(value), DECIMALS_ALLOWED)
)

class TipPositionModal extends React.Component<Props, State> {
  constructor (props: Props) {
    super(props)
    const initialValue = props.mmFromBottom
      ? roundValue(props.mmFromBottom)
      : roundValue(this.getDefaultMmFromBottom())
    this.state = { value: initialValue }
  }
  componentDidUpdate (prevProps) {
    if (prevProps.wellHeightMM !== this.props.wellHeightMM) {
      this.setState({value: roundValue(this.props.mmFromBottom)})
    }
  }
  applyChanges = () => {
    const {value} = this.state
    this.props.updateValue(value == null ? null : roundValue(value))
    this.props.closeModal()
  }
  getDefaultMmFromBottom = (): number => {
    const {fieldName, wellHeightMM} = this.props
    return utils.getDefaultMmFromBottom({fieldName, wellHeightMM})
  }
  getMinMaxMmFromBottom = (): {maxMmFromBottom: number, minMmFromBottom: number} => {
    if (getIsTouchTipField(this.props.fieldName)) {
      return {
        maxMmFromBottom: roundValue(this.props.wellHeightMM),
        minMmFromBottom: roundValue(this.props.wellHeightMM / 2),
      }
    }
    return {
      maxMmFromBottom: roundValue(this.props.wellHeightMM * 2),
      minMmFromBottom: 0,
    }
  }

  handleReset = () => {
    this.setState({value: null}, this.applyChanges)
  }
  handleCancel = () => {
    this.setState({value: roundValue(this.props.mmFromBottom)}, this.props.closeModal)
  }
  handleDone = () => {
    this.applyChanges()
  }

  handleChange = (newValueRaw: string | number) => {
    const {maxMmFromBottom, minMmFromBottom} = this.getMinMaxMmFromBottom()
    // if string, strip non-number characters from string and cast to number
    const valueFloatUnrounded = (typeof newValueRaw === 'string')
      ? Number(newValueRaw
        .replace(/[^.0-9]/, '')
        .replace(/(\d*[.]{1}\d{1})(\d*)/, (match, group1) => group1))
      : newValueRaw
    const valueFloat = roundValue(valueFloatUnrounded)

    if (!Number.isFinite(valueFloat)) {
      return
    }

    this.setState({value: clamp(valueFloat, minMmFromBottom, maxMmFromBottom)})
  }
  handleInputFieldChange = (e: SyntheticEvent<HTMLSelectElement>) => {
    this.handleChange(e.currentTarget.value)
  }
  handleIncrementDecrement = (delta: number) => {
    const {value} = this.state
    const prevValue = this.state.value == null
      ? this.getDefaultMmFromBottom()
      : value

    this.handleChange(prevValue + delta)
  }
  makeHandleIncrement = (step: number) => () => {
    this.handleIncrementDecrement(step)
  }
  makeHandleDecrement = (step: number) => () => {
    this.handleIncrementDecrement(step * -1)
  }
  render () {
    if (!this.props.isOpen) return null
    const {value} = this.state
    const {fieldName, wellHeightMM} = this.props
    const {maxMmFromBottom, minMmFromBottom} = this.getMinMaxMmFromBottom()

    return (
      <Portal>
        <HandleKeypress
          preventDefault
          handlers={[
            {key: 'ArrowUp', shiftKey: false, onPress: this.makeHandleIncrement(SMALL_STEP_MM)},
            {key: 'ArrowUp', shiftKey: true, onPress: this.makeHandleIncrement(LARGE_STEP_MM)},
            {key: 'ArrowDown', shiftKey: false, onPress: this.makeHandleDecrement(SMALL_STEP_MM)},
            {key: 'ArrowDown', shiftKey: true, onPress: this.makeHandleDecrement(LARGE_STEP_MM)},
          ]}>
          <Modal
            className={modalStyles.modal}
            contentsClassName={cx(modalStyles.modal_contents)}
            onCloseClick={this.handleCancel}>
            <div className={styles.modal_header}>
              <h4>{i18n.t('modal.tip_position.title')}</h4>
              <p>{i18n.t(`modal.tip_position.body.${fieldName}`)}</p>
            </div>
            <div className={styles.main_row}>
              <div className={styles.leftHalf}>
                <FormGroup label={i18n.t('modal.tip_position.field_label')}>
                  <InputField
                    className={styles.position_from_bottom_input}
                    onChange={this.handleInputFieldChange}
                    units="mm"
                    value={(value != null) ? String(value) : ''} />
                </FormGroup>
                <div className={styles.viz_group}>
                  <div className={styles.adjustment_buttons}>
                    <OutlineButton
                      className={styles.adjustment_button}
                      disabled={value != null && value >= maxMmFromBottom}
                      onClick={this.makeHandleIncrement(SMALL_STEP_MM)}>
                      <Icon name="plus" />
                    </OutlineButton>
                    <OutlineButton
                      className={styles.adjustment_button}
                      disabled={value != null && value <= minMmFromBottom}
                      onClick={this.makeHandleDecrement(SMALL_STEP_MM)}>
                      <Icon name="minus" />
                    </OutlineButton>
                  </div>
                  <TipPositionZAxisViz
                    mmFromBottom={(value != null)
                      ? value
                      : this.getDefaultMmFromBottom()}
                    wellHeightMM={wellHeightMM} />
                </div>
              </div>
              <div className={styles.rightHalf}>{/* TODO: xy tip positioning */}</div>
            </div>
            <div className={styles.button_row}>
              <OutlineButton className={styles.reset_button} onClick={this.handleReset}>
                {i18n.t('button.reset')}
              </OutlineButton>
              <div>
                <PrimaryButton className={styles.cancel_button} onClick={this.handleCancel}>
                  {i18n.t('button.cancel')}
                </PrimaryButton>
                <PrimaryButton className={styles.done_button} onClick={this.handleDone}>
                  {i18n.t('button.done')}
                </PrimaryButton>
              </div>
            </div>
          </Modal>
        </HandleKeypress>
      </Portal>
    )
  }
}

const mapDTP = (dispatch: Dispatch, ownProps: OP): DP => {
  return {
    updateValue: (value) => {
      dispatch(actions.changeFormInput({update: {[ownProps.fieldName]: value}}))
    },
  }
}

export default connect(null, mapDTP)(TipPositionModal)
