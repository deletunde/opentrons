// interface selectors test

import {NAME, selectors} from '../'

describe('user interface selectors', () => {
  test('get is nav panel open', () => {
    const state = {[NAME]: {isNavPanelOpen: true}}

    expect(selectors.getIsNavPanelOpen(state)).toBe(true)
  })

  test('get current nav panel', () => {
    const state = {[NAME]: {currentNavPanelTask: 'upload'}}

    expect(selectors.getCurrentNavPanelTask(state)).toBe('upload')
  })
})