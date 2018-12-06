// @flow
import {_allReducers} from '../reducers.js'

const {
  steps,
  collapsedSteps,
  orderedSteps,
  selectedItem,
  stepCreationButtonExpanded,
} = _allReducers

describe('steps reducer', () => {
  test('initial add step', () => {
    const state = {}
    const action = {
      type: 'ADD_STEP',
      payload: {id: '123', stepType: 'transfer'},
    }

    expect(steps(state, action)).toEqual({
      '123': {
        id: '123',
        stepType: 'transfer',
        title: 'transfer', // title gets added
      },
    })
  })

  test('second add step', () => {
    const state = {
      '333': {
        id: '333',
        stepType: 'mix',
        title: 'mix',
      },
    }
    const action = {
      type: 'ADD_STEP',
      payload: {id: '123', stepType: 'transfer'},
    }

    expect(steps(state, action)).toEqual({
      '333': {
        id: '333',
        stepType: 'mix',
        title: 'mix',
      },
      '123': {
        id: '123',
        stepType: 'transfer',
        title: 'transfer',
      },
    })
  })
})

describe('collapsedSteps reducer', () => {
  test('add step', () => {
    const state = {}
    const action = {
      type: 'ADD_STEP',
      payload: {id: '1', stepType: 'transfer'},
    }
    expect(collapsedSteps(state, action)).toEqual({
      '1': false, // default is false: not collapsed
    })
  })

  test('toggle step on->off', () => {
    const state = {
      '1': true,
      '2': false,
      '3': true,
      '4': true,
    }
    const action = {
      type: 'TOGGLE_STEP_COLLAPSED',
      payload: '3',
    }
    expect(collapsedSteps(state, action)).toEqual({
      '1': true,
      '2': false,
      '3': false,
      '4': true,
    })
  })

  test('toggle step off-> on', () => {
    const state = {
      '1': true,
      '2': false,
      '3': true,
      '4': true,
    }
    const action = {
      type: 'TOGGLE_STEP_COLLAPSED',
      payload: '2',
    }
    expect(collapsedSteps(state, action)).toEqual({
      '1': true,
      '2': true,
      '3': true,
      '4': true,
    })
  })
})

describe('orderedSteps reducer', () => {
  test('initial add step', () => {
    const state = []
    const action = {
      type: 'ADD_STEP',
      payload: {id: '123', stepType: 'transfer'},
    }
    expect(orderedSteps(state, action)).toEqual(['123'])
  })

  test('second add step', () => {
    const state = ['123']
    const action = {
      type: 'ADD_STEP',
      payload: {id: '22', stepType: 'transfer'},
    }
    expect(orderedSteps(state, action)).toEqual(['123', '22'])
  })

  describe('reorder steps', () => {
    const state = ['1', '2', '3', '4']
    const testCases = [
      {
        label: '+1 to first',
        payload: {
          delta: 1,
          stepId: '1',
        },
        expected: ['2', '1', '3', '4'],
      },
      {
        label: '+0 to first: no change',
        payload: {
          delta: 0,
          stepId: '1',
        },
        expected: state,
      },
      {
        label: '-1 to first: no change',
        payload: {
          delta: -1,
          stepId: '1',
        },
        expected: state,
      },
      {
        label: '-10 to first: no change',
        payload: {
          delta: -10,
          stepId: '1',
        },
        expected: state,
      },

      {
        label: '-1 to second',
        payload: {
          delta: -1,
          stepId: '2',
        },
        expected: ['2', '1', '3', '4'],
      },
      {
        label: '-10 to second',
        payload: {
          delta: -10,
          stepId: '2',
        },
        expected: ['2', '1', '3', '4'],
      },

      {
        label: '+1 to last: no change',
        payload: {
          delta: 1,
          stepId: '4',
        },
        expected: state,
      },
      {
        label: '+10 to last: no change',
        payload: {
          delta: 10,
          stepId: '4',
        },
        expected: state,
      },
    ]

    testCases.forEach(({label, payload, expected}) => {
      test(label, () => {
        const action = {
          type: 'REORDER_SELECTED_STEP',
          payload,
        }
        expect(orderedSteps(state, action)).toEqual(expected)
      })
    })
  })
})

describe('selectedItem reducer', () => {
  test('select step', () => {
    const stepId = '123'
    const action = {
      type: 'SELECT_STEP',
      payload: stepId,
    }
    expect(selectedItem(null, action)).toEqual({
      isStep: true,
      id: stepId,
    })
  })

  test('select terminal item', () => {
    const terminalId = 'test'
    const action = {
      type: 'SELECT_TERMINAL_ITEM',
      payload: terminalId,
    }
    expect(selectedItem(null, action)).toEqual({
      isStep: false,
      id: terminalId,
    })
  })
})

describe('stepCreationButtonExpanded reducer', () => {
  test('close (or stay closed) on newly added step', () => {
    const action = {
      type: 'ADD_STEP',
      payload: {id: '123', stepType: 'transfer'},
    }
    expect(stepCreationButtonExpanded(true, action)).toEqual(false)
    expect(stepCreationButtonExpanded(false, action)).toEqual(false)
  })

  test('update with EXPAND_ADD_STEP_BUTTON action payload', () => {
    expect(stepCreationButtonExpanded(false, {
      type: 'EXPAND_ADD_STEP_BUTTON',
      payload: true,
    })).toEqual(true)

    expect(stepCreationButtonExpanded(true, {
      type: 'EXPAND_ADD_STEP_BUTTON',
      payload: false,
    })).toEqual(false)
  })
})
